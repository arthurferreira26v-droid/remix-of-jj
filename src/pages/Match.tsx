// @ts-nocheck - Database types will be updated after migration
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { teams } from "@/data/teams";
import { botafogoPlayers, flamengoPlayers, generateTeamPlayers, Player } from "@/data/players";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { TacticsManager } from "@/components/TacticsManager";
import { ChevronLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useAuth } from "@/hooks/useAuth";
import { evolveTeamPlayers } from "@/utils/playerEvolution";
import { PenaltyKickerModal } from "@/components/PenaltyKickerModal";

interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'penalty' | 'penalty_missed';
  team: 'home' | 'away';
  playerName: string;
}

const Match = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const teamName = searchParams.get("time") || "Seu Time";
  const opponentName = searchParams.get("adversario") || "Adversário";
  
  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const [minute, setMinute] = useState(1);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [possession, setPossession] = useState({ home: 50, away: 50 });
  const [shots, setShots] = useState({ home: 0, away: 0 });
  const [fouls, setFouls] = useState({ home: 0, away: 0 });
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSavingMatch, setIsSavingMatch] = useState(false);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [pendingPenaltyMinute, setPendingPenaltyMinute] = useState<number | null>(null);
  const [isHalftime, setIsHalftime] = useState(false);
  const [halftimeDone, setHalftimeDone] = useState(false);

  const selectedTeam = teams.find(t => t.name === teamName);
  const opponent = teams.find(t => t.name === opponentName);

  // Initialize players - carregar do localStorage se existir
  const getInitialUserPlayers = () => {
    const savedPlayers = localStorage.getItem(`players_${teamName}`);
    if (savedPlayers) {
      return JSON.parse(savedPlayers);
    }
    return teamName === "Botafogo" 
      ? botafogoPlayers 
      : teamName === "Flamengo"
      ? flamengoPlayers
      : generateTeamPlayers(teamName);
  };

  const [userPlayers, setUserPlayers] = useState<Player[]>(getInitialUserPlayers);
  
  const opponentPlayers =
    opponentName === "Botafogo" 
      ? botafogoPlayers 
      : opponentName === "Flamengo"
      ? flamengoPlayers
      : generateTeamPlayers(opponentName);
  
  const userStarters = userPlayers.filter((p) => p.isStarter);
  const userReserves = userPlayers.filter((p) => !p.isStarter);
  const opponentStarters = opponentPlayers.filter((p) => p.isStarter);

  const [selectedReserve, setSelectedReserve] = useState<Player | null>(null);

  const handleReserveClick = (player: Player) => {
    setSelectedReserve(player);
  };

  const handleStarterClick = (starter: Player) => {
    if (!selectedReserve) return;


    const updatedPlayers = userPlayers.map((p) => {
      if (p.id === starter.id) {
        return { ...p, isStarter: false };
      }
      if (p.id === selectedReserve.id) {
        return { ...p, isStarter: true };
      }
      return p;
    });

    setUserPlayers(updatedPlayers);
    // Salvar no localStorage também
    localStorage.setItem(`players_${teamName}`, JSON.stringify(updatedPlayers));
    setSelectedReserve(null);
  };

  const saveMatchResult = async () => {
    if (isSavingMatch || !user) return;
    setIsSavingMatch(true);

    try {
      const campeonatoId = searchParams.get("campeonatoId");
      let championshipId: string;
      let championshipName: string = "";

      if (campeonatoId) {
        // Use the championship ID from URL (for Libertadores/pre-lib)
        championshipId = campeonatoId;
        const { data: champData } = await supabase
          .from("championships")
          .select("name")
          .eq("id", campeonatoId)
          .eq("user_id", user.id)
          .single();
        championshipName = champData?.name || "";
      } else {
        // Determinar o nome do campeonato baseado na liga do time
        const userTeam = teams.find(t => t.name === teamName);
        championshipName = userTeam?.league === "brasileiro" 
          ? `Brasileirão - ${teamName}`
          : `Liga dos Campeões - ${teamName}`;

        const { data: championships } = await supabase
          .from("championships")
          .select("id")
          .eq("name", championshipName)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const championship = championships?.[0];
        if (!championship) throw new Error("Campeonato não encontrado");
        championshipId = championship.id;
      }

      const isPreLib = championshipName.startsWith("Pré-Libertadores");
      const isLibertadores = championshipName.startsWith("Libertadores");

      const { data: match } = await supabase
        .from("matches")
        .select("*")
        .eq("championship_id", championshipId)
        .eq("is_played", false)
        .or(`home_team_name.eq.${teamName},away_team_name.eq.${teamName}`)
        .order("round", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!match) throw new Error("Partida não encontrada");

      // Atualizar resultado da partida
      await supabase
        .from("matches")
        .update({
          home_score: homeScore,
          away_score: awayScore,
          is_played: true,
        })
        .eq("id", match.id);

      // Para Pré-Libertadores: apenas salvar resultado, sem classificação
      if (!isPreLib) {
        // Atualizar classificação - sistema de pontos: vitória=3, empate=1, derrota=0
        const homeTeamName = match.home_team_name;
        const awayTeamName = match.away_team_name;

        const { data: standings } = await supabase
          .from("standings")
          .select("*")
          .eq("championship_id", championshipId)
          .in("team_name", [homeTeamName, awayTeamName]);

        if (standings && standings.length === 2) {
          const homeStanding = standings.find(s => s.team_name === homeTeamName);
          const awayStanding = standings.find(s => s.team_name === awayTeamName);

          if (homeStanding && awayStanding) {
            let homePoints = 0;
            let awayPoints = 0;
            let homeWins = 0;
            let awayWins = 0;
            let homeDraws = 0;
            let awayDraws = 0;
            let homeLosses = 0;
            let awayLosses = 0;

            if (homeScore > awayScore) {
              homePoints = 3;
              homeWins = 1;
              awayLosses = 1;
            } else if (homeScore < awayScore) {
              awayPoints = 3;
              awayWins = 1;
              homeLosses = 1;
            } else {
              homePoints = 1;
              awayPoints = 1;
              homeDraws = 1;
              awayDraws = 1;
            }

            await supabase.from("standings").update({
              points: homeStanding.points + homePoints,
              played: homeStanding.played + 1,
              wins: homeStanding.wins + homeWins,
              draws: homeStanding.draws + homeDraws,
              losses: homeStanding.losses + homeLosses,
              goals_for: homeStanding.goals_for + homeScore,
              goals_against: homeStanding.goals_against + awayScore,
              goal_difference: (homeStanding.goals_for + homeScore) - (homeStanding.goals_against + awayScore),
            }).eq("id", homeStanding.id);

            await supabase.from("standings").update({
              points: awayStanding.points + awayPoints,
              played: awayStanding.played + 1,
              wins: awayStanding.wins + awayWins,
              draws: awayStanding.draws + awayDraws,
              losses: awayStanding.losses + awayLosses,
              goals_for: awayStanding.goals_for + awayScore,
              goals_against: awayStanding.goals_against + homeScore,
              goal_difference: (awayStanding.goals_for + awayScore) - (awayStanding.goals_against + homeScore),
            }).eq("id", awayStanding.id);
          }
        }

        // Simular jogos dos outros times na mesma rodada
        const currentRound = match.round;
        const { data: otherMatches } = await supabase
          .from("matches")
          .select("*")
          .eq("championship_id", championshipId)
          .eq("round", currentRound)
          .eq("is_played", false)
          .neq("id", match.id);

        if (otherMatches && otherMatches.length > 0) {
          for (const otherMatch of otherMatches) {
            const homeGoals = Math.floor(Math.random() * 4);
            const awayGoals = Math.floor(Math.random() * 4);

            await supabase
              .from("matches")
              .update({
                home_score: homeGoals,
                away_score: awayGoals,
                is_played: true,
              })
              .eq("id", otherMatch.id);

            const { data: otherStandings } = await supabase
              .from("standings")
              .select("*")
              .eq("championship_id", championshipId)
              .in("team_name", [otherMatch.home_team_name, otherMatch.away_team_name]);

            if (otherStandings && otherStandings.length === 2) {
              const homeStanding = otherStandings.find(s => s.team_name === otherMatch.home_team_name);
              const awayStanding = otherStandings.find(s => s.team_name === otherMatch.away_team_name);

              if (homeStanding && awayStanding) {
                let homePoints = 0;
                let awayPoints = 0;
                let homeWins = 0;
                let awayWins = 0;
                let homeDraws = 0;
                let awayDraws = 0;
                let homeLosses = 0;
                let awayLosses = 0;

                if (homeGoals > awayGoals) {
                  homePoints = 3;
                  homeWins = 1;
                  awayLosses = 1;
                } else if (homeGoals < awayGoals) {
                  awayPoints = 3;
                  awayWins = 1;
                  homeLosses = 1;
                } else {
                  homePoints = 1;
                  awayPoints = 1;
                  homeDraws = 1;
                  awayDraws = 1;
                }

                await supabase.from("standings").update({
                  points: homeStanding.points + homePoints,
                  played: homeStanding.played + 1,
                  wins: homeStanding.wins + homeWins,
                  draws: homeStanding.draws + homeDraws,
                  losses: homeStanding.losses + homeLosses,
                  goals_for: homeStanding.goals_for + homeGoals,
                  goals_against: homeStanding.goals_against + awayGoals,
                  goal_difference: (homeStanding.goals_for + homeGoals) - (homeStanding.goals_against + awayGoals),
                }).eq("id", homeStanding.id);

                await supabase.from("standings").update({
                  points: awayStanding.points + awayPoints,
                  played: awayStanding.played + 1,
                  wins: awayStanding.wins + awayWins,
                  draws: awayStanding.draws + awayDraws,
                  losses: awayStanding.losses + awayLosses,
                  goals_for: awayStanding.goals_for + awayGoals,
                  goals_against: awayStanding.goals_against + homeGoals,
                  goal_difference: (awayStanding.goals_for + awayGoals) - (awayStanding.goals_against + homeGoals),
                }).eq("id", awayStanding.id);
              }
            }
          }
        }

        // Reordenar classificação
        const { data: finalStandings } = await supabase
          .from("standings")
          .select("*")
          .eq("championship_id", championshipId)
          .order("points", { ascending: false })
          .order("goal_difference", { ascending: false })
          .order("goals_for", { ascending: false });

        if (finalStandings) {
          if (isLibertadores) {
            // Reordenar dentro de cada grupo
            const groupMap = new Map<string, any[]>();
            for (const s of finalStandings) {
              const g = s.group_name || "Grupo A";
              if (!groupMap.has(g)) groupMap.set(g, []);
              groupMap.get(g)!.push(s);
            }
            for (const [, groupStandings] of groupMap) {
              groupStandings.sort((a: any, b: any) => b.points - a.points || b.goal_difference - a.goal_difference || b.goals_for - a.goals_for);
              for (let i = 0; i < groupStandings.length; i++) {
                await supabase
                  .from("standings")
                  .update({ position: i + 1 })
                  .eq("id", groupStandings[i].id);
              }
            }
          } else {
            for (let i = 0; i < finalStandings.length; i++) {
              await supabase
                .from("standings")
                .update({ position: i + 1 })
                .eq("id", finalStandings[i].id);
            }
          }
        }
      }

      // Atualizar rodada atual do campeonato
      const currentRoundForUpdate = match.round;
      await supabase
        .from("championships")
        .update({ current_round: currentRoundForUpdate + 1 })
        .eq("id", championshipId);

      // Verificar se há investimento ativo e adicionar $200k ao budget
      const hasInvestment = localStorage.getItem(`investment_${teamName}`) === 'true';
      if (hasInvestment) {
        const investmentEarnings = 200000; // $200 mil por jogo
        
        // Buscar budget atual do time
        const { data: budgetData } = await supabase
          .from("team_budgets")
          .select("budget")
          .eq("championship_id", championshipId)
          .eq("team_name", teamName)
          .maybeSingle();

        if (budgetData) {
          await supabase
            .from("team_budgets")
            .update({ budget: budgetData.budget + investmentEarnings })
            .eq("championship_id", championshipId)
            .eq("team_name", teamName);
          
          toast.success("Investimento: +$200 mil recebidos!");
        }
      }

      // Evoluir jogadores após o jogo
      const savedPlayers = localStorage.getItem(`players_${teamName}`);
      if (savedPlayers) {
        const currentPlayers = JSON.parse(savedPlayers);
        const { evolvedPlayers, improvements, declines, improvedNames, declinedNames } = evolveTeamPlayers(currentPlayers);
        
        // Salvar jogadores evoluídos
        localStorage.setItem(`players_${teamName}`, JSON.stringify(evolvedPlayers));
        
        // Mostrar notificações de evolução
        if (improvements > 0) {
          toast.success(`📈 ${improvements} jogador(es) evoluíram!`, {
            description: improvedNames.join(", "),
            duration: 5000,
          });
        }
        if (declines > 0) {
          toast.warning(`📉 ${declines} jogador(es) declinaram`, {
            description: declinedNames.join(", "),
            duration: 5000,
          });
        }
      }

      toast.success("Resultado salvo com sucesso!");
      setTimeout(() => {
        navigate(`/jogo?time=${teamName}`);
      }, 1000);
    } catch (error) {
      console.error("Erro ao salvar resultado:", error);
      toast.error("Erro ao salvar resultado");
    }
  };

  // Função para escolher jogador aleatório com peso por posição
  const getRandomPlayer = (team: 'home' | 'away'): string => {
    const players = team === 'away' ? userStarters : opponentStarters;
    if (players.length === 0) return 'Jogador';

    // Pesos por posição para chance de marcar gol
    const getPositionWeight = (position: string): number => {
      if (position === 'GOL') return 0.03; // 3%
      if (['ZAG', 'LD', 'LE'].includes(position)) return 0.20; // 20%
      // Meio-campo para frente: peso normal (1.0)
      return 1.0;
    };

    const weights = players.map(p => getPositionWeight(p.position));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < players.length; i++) {
      random -= weights[i];
      if (random <= 0) return players[i].name;
    }
    return players[players.length - 1].name;
  };

  // Callback para quando o usuário escolhe o batedor de pênalti
  const handlePenaltyKickerSelected = (player: Player) => {
    if (pendingPenaltyMinute !== null) {
      // Calcular chance de acerto baseado na posição
      // Atacantes (ATA, PE, PD): 80% de acerto
      // Meias e outros: 50% de acerto
      const isAttacker = ['ATA', 'PE', 'PD'].includes(player.position);
      const successChance = isAttacker ? 0.80 : 0.50;
      const isGoal = Math.random() < successChance;
      
      if (isGoal) {
        setAwayScore(s => s + 1);
        setMatchEvents(events => [...events, {
          minute: pendingPenaltyMinute,
          type: 'penalty',
          team: 'away',
          playerName: player.name
        }]);
      } else {
        // Pênalti perdido
        setMatchEvents(events => [...events, {
          minute: pendingPenaltyMinute,
          type: 'penalty_missed',
          team: 'away',
          playerName: player.name
        }]);
      }
      
      setPendingPenaltyMinute(null);
      setIsPlaying(true);
    }
  };

  // Timer: 90 minutos em 30 segundos reais (333ms por minuto)
  useEffect(() => {
    if (!isPlaying || minute >= 90 || showPenaltyModal || isHalftime) return;

    const interval = setInterval(() => {
      setMinute(prev => {
        const next = prev + 1;

        // Intervalo aos 45 minutos
        if (next === 45 && !halftimeDone) {
          setIsPlaying(false);
          setIsHalftime(true);
          return next;
        }
        
        // Simular eventos aleatórios — chance de gol baseada em tática e overall adversário
        // Calcular overall médio do adversário para ajustar dificuldade
        const opponentAvgOvr = opponentStarters.length > 0
          ? opponentStarters.reduce((sum, p) => sum + p.overall, 0) / opponentStarters.length
          : 75;
        // Fator de dificuldade: adversário forte reduz chance de gol do usuário
        const difficultyFactor = Math.max(0.5, Math.min(1.5, (150 - opponentAvgOvr) / 75));
        const baseGoalChance = 0.05;
        
        if (Math.random() < baseGoalChance) {
          // Chance de gol — time com overall maior tem vantagem
          const homeGoalProb = 1 - (difficultyFactor * 0.5); // adversário forte = mais gols pra ele
          const isHomeGoal = Math.random() < homeGoalProb;
          
          // Chance de ser pênalti (20% dos gols)
          const isPenalty = Math.random() < 0.2;
          
          if (isPenalty) {
            if (!isHomeGoal) {
              // Pênalti para o time do usuário - pausar e mostrar modal
              setIsPlaying(false);
              setPendingPenaltyMinute(next);
              setShowPenaltyModal(true);
              return next;
            } else {
              // Pênalti para o adversário
              const scorer = getRandomPlayer('home');
              setHomeScore(s => s + 1);
              setMatchEvents(events => [...events, {
                minute: next,
                type: 'penalty',
                team: 'home',
                playerName: scorer
              }]);
            }
          } else {
            // Gol normal
            const scorer = getRandomPlayer(isHomeGoal ? 'home' : 'away');
            if (isHomeGoal) {
              setHomeScore(s => s + 1);
            } else {
              setAwayScore(s => s + 1);
            }
            setMatchEvents(events => [...events, {
              minute: next,
              type: 'goal',
              team: isHomeGoal ? 'home' : 'away',
              playerName: scorer
            }]);
          }
        }
        
        if (Math.random() < 0.15) {
          // Chutes
          if (Math.random() < 0.5) {
            setShots(s => ({ ...s, home: s.home + 1 }));
          } else {
            setShots(s => ({ ...s, away: s.away + 1 }));
          }
        }
        
        if (Math.random() < 0.08) {
          // Faltas
          const isHomeFoul = Math.random() < 0.5;
          if (isHomeFoul) {
            setFouls(s => ({ ...s, home: s.home + 1 }));
          } else {
            setFouls(s => ({ ...s, away: s.away + 1 }));
          }
          
          // Chance de cartão amarelo (10% das faltas)
          if (Math.random() < 0.3) {
            const cardPlayer = getRandomPlayer(isHomeFoul ? 'home' : 'away');
            // Chance de cartão vermelho (10% dos cartões)
            const isRed = Math.random() < 0.1;
            
            setMatchEvents(events => [...events, {
              minute: next,
              type: isRed ? 'red_card' : 'yellow_card',
              team: isHomeFoul ? 'home' : 'away',
              playerName: cardPlayer
            }]);
          }
        }
        
        // Atualizar posse
        setPossession({
          home: Math.floor(40 + Math.random() * 20),
          away: Math.floor(40 + Math.random() * 20)
        });
        
        if (next >= 90) {
          setIsPlaying(false);
        }
        
        return next;
      });
    }, 333); // 30000ms / 90 = 333ms

    return () => clearInterval(interval);
  }, [isPlaying, minute, showPenaltyModal, isHalftime, halftimeDone]);

  // Função para renderizar ícone do evento
  const getEventIcon = (type: MatchEvent['type']) => {
    switch (type) {
      case 'goal':
        return '⚽';
      case 'penalty':
        return '⚽';
      case 'penalty_missed':
        return '🔴';
      case 'yellow_card':
        return '🟨';
      case 'red_card':
        return '🟥';
      default:
        return '';
    }
  };

  const getEventText = (event: MatchEvent) => {
    return event.playerName;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-border bg-black backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate(`/jogo?time=${teamName}`)}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">CAMPEONATO CARIOCA - 2025</span>
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">{Math.floor(minute / 90 * 100)}%</span>
            </div>
          </div>
        </div>
      </header>

      {/* Match Info */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-accent px-6 py-2 rounded-full mb-6">
            <span className="text-2xl font-bold text-black">{minute}'</span>
          </div>
        </div>

        {/* Score Board */}
        <div className="flex items-center justify-center gap-8 mb-8">
          {/* Home Team */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center p-4">
                  <img src={opponent?.logo} alt={opponentName} className="w-full h-full object-contain" />
                </div>
                <span className="text-sm font-medium text-white">{opponentName.slice(0, 3).toUpperCase()}</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-black border-border w-full sm:max-w-lg">
              <VisuallyHidden>
                <SheetTitle>Táticas do {opponentName}</SheetTitle>
              </VisuallyHidden>
              <div className="mt-8">
                <TacticsManager teamName={opponentName} players={opponentStarters} />
              </div>
            </SheetContent>
          </Sheet>

          {/* Score */}
          <div className="flex items-center gap-6">
            <span className="text-6xl font-bold text-white">{homeScore}</span>
            <span className="text-4xl font-bold text-muted-foreground">-</span>
            <span className="text-6xl font-bold text-white">{awayScore}</span>
          </div>

          {/* Away Team */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center p-4">
                  <img src={selectedTeam?.logo} alt={teamName} className="w-full h-full object-contain" />
                </div>
                <span className="text-sm font-medium text-white">{teamName.slice(0, 3).toUpperCase()}</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-black border-border w-full sm:max-w-lg">
              <VisuallyHidden>
                <SheetTitle>Táticas do {teamName}</SheetTitle>
              </VisuallyHidden>
              <div className="mt-8">
                <TacticsManager teamName={teamName} players={userStarters} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Match Events */}
        {matchEvents.length > 0 && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-zinc-900 rounded-lg p-4 max-h-40 overflow-y-auto">
              <div className="space-y-2">
                {matchEvents.slice().reverse().map((event, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center gap-3 text-sm ${
                      event.team === 'away' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {event.team === 'home' && (
                      <>
                        <span className="text-muted-foreground">{event.minute}'</span>
                        <span>{getEventIcon(event.type)}</span>
                        <span className="text-white">{getEventText(event)}</span>
                      </>
                    )}
                    {event.team === 'away' && (
                      <>
                        <span className="text-white">{getEventText(event)}</span>
                        <span>{getEventIcon(event.type)}</span>
                        <span className="text-muted-foreground">{event.minute}'</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="max-w-2xl mx-auto space-y-6 mt-8">
          {/* Possession */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">{possession.home}%</span>
              <span className="text-sm font-medium text-white">Posse de bola</span>
              <span className="text-sm text-muted-foreground">{possession.away}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
              <div 
                className="bg-white transition-all duration-300" 
                style={{ width: `${possession.home}%` }}
              />
              <div 
                className="bg-accent transition-all duration-300" 
                style={{ width: `${possession.away}%` }}
              />
            </div>
          </div>

          {/* Shots */}
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-white">{shots.home}</span>
            <span className="text-sm font-medium text-white">Chutes a gol</span>
            <span className="text-2xl font-bold text-white">{shots.away}</span>
          </div>

          {/* Fouls */}
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-white">{fouls.home}</span>
            <span className="text-sm font-medium text-white">Faltas</span>
            <span className="text-2xl font-bold text-white">{fouls.away}</span>
          </div>
        </div>

        {/* Botão fixo de Gerenciar Time */}
        <div className="fixed bottom-6 left-4 right-4 z-40 max-w-2xl mx-auto">
          <Sheet>
            <SheetTrigger asChild>
              <button className="w-full bg-accent hover:bg-accent/90 text-black font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-accent/20 flex items-center justify-center backdrop-blur-sm">
                <span className="text-lg font-bold">GERENCIAR TIME</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-black border-border h-[90vh]">
              <VisuallyHidden>
                <SheetTitle>Gerenciar Time</SheetTitle>
              </VisuallyHidden>
              <div className="mt-8 overflow-y-auto h-full pb-20 space-y-6">
                <TacticsManager
                  teamName={teamName}
                  players={userStarters}
                  onStarterClick={handleStarterClick}
                  canSubstitute={!!selectedReserve}
                />

                <div className="bg-zinc-900 rounded-lg p-4">
                  <h3 className="text-white text-xl font-bold mb-4">Reservas</h3>
                  <div className="space-y-2">
                    {userReserves.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => handleReserveClick(player)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          selectedReserve?.id === player.id
                            ? "bg-[#c8ff00] text-black"
                            : "bg-zinc-800 text-white hover:bg-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-lg w-8 ${selectedReserve?.id === player.id ? 'text-black' : 'text-blue-400'}`}>{player.overall}</span>
                          <div className="text-left">
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm opacity-70">{player.position}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedReserve && (
                    <p className="mt-3 text-xs text-[#c8ff00]">
                      Selecione um titular no campo para substituir.
                    </p>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Spacer para evitar sobreposição com botão fixo */}
        <div className="h-24" />

        {/* Halftime Overlay */}
        {isHalftime && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="container mx-auto px-4 py-8">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">INTERVALO</h2>
                <div className="text-5xl font-bold text-white mb-1">
                  {homeScore} - {awayScore}
                </div>
                <span className="text-muted-foreground text-sm">45'</span>
              </div>

              <div className="max-w-lg mx-auto space-y-6">
                <TacticsManager
                  teamName={teamName}
                  players={userStarters}
                  onStarterClick={handleStarterClick}
                  canSubstitute={!!selectedReserve}
                />

                <div className="bg-zinc-900 rounded-lg p-4">
                  <h3 className="text-white text-xl font-bold mb-4">Reservas</h3>
                  <div className="space-y-2">
                    {userReserves.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => handleReserveClick(player)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          selectedReserve?.id === player.id
                            ? "bg-accent text-black"
                            : "bg-zinc-800 text-white hover:bg-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-lg w-8 ${selectedReserve?.id === player.id ? 'text-black' : 'text-blue-400'}`}>{player.overall}</span>
                          <div className="text-left">
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm opacity-70">{player.position}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedReserve && (
                    <p className="mt-3 text-xs text-accent">
                      Selecione um titular no campo para substituir.
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    setIsHalftime(false);
                    setHalftimeDone(true);
                    setIsPlaying(true);
                  }}
                  className="w-full bg-accent hover:bg-accent/90 text-black font-bold py-4 px-6 rounded-xl transition-all text-lg"
                >
                  INICIAR 2º TEMPO
                </button>
              </div>
            </div>
          </div>
        )}

        {/* End Match Message */}
        {minute >= 90 && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-8 max-w-md mx-4 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">FIM DE JOGO</h2>
              <div className="text-6xl font-bold text-white mb-6">
                {homeScore} - {awayScore}
              </div>
              <button
                onClick={saveMatchResult}
                disabled={isSavingMatch}
                className="w-full bg-accent hover:bg-accent/90 text-black font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSavingMatch ? "Salvando..." : "Continuar"}
              </button>
            </div>
          </div>
        )}

        {/* Modal de seleção de batedor de pênalti */}
        <PenaltyKickerModal
          isOpen={showPenaltyModal}
          onClose={() => {
            setShowPenaltyModal(false);
            setIsPlaying(true);
          }}
          players={userStarters}
          onSelectKicker={handlePenaltyKickerSelected}
          teamName={teamName}
        />
      </div>
    </div>
  );
};

export default Match;