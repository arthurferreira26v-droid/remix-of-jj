// @ts-nocheck - Database types will be updated after migration
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { teams } from "@/data/teams";
import { generateTeamPlayers, Player } from "@/data/players";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { TacticsManager } from "@/components/TacticsManager";
import { ChevronLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useAuth } from "@/hooks/useAuth";
// Evolução de jogadores ocorre apenas no final da temporada
import { applyEnergyChanges, drainEnergyPerMinute, getEffectiveOverall, initMatchEnergy, finalizeMatchEnergy } from "@/utils/energySystem";
import { PenaltyKickerModal } from "@/components/PenaltyKickerModal";
import { applySuspensions } from "@/utils/cardSystem";
import { optimizeStartersDefault } from "@/utils/formationOptimizer";
import { flushPendingWrites } from "@/utils/localChampionship";
import { getYellowCardChance, applyCardToPlayer, finalizeCardsAfterMatch } from "@/utils/cardSystem";

interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'penalty' | 'penalty_missed' | 'substitution';
  team: 'home' | 'away';
  playerName: string;
  substituteOut?: string;
}

const Match = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const teamName = searchParams.get("time") || "Seu Time";
  const opponentName = searchParams.get("adversario") || "Adversário";
  const isQuickMatch = searchParams.get("quick") === "true";
  const is2PMode = searchParams.get("modo") === "2p";
  const is2PReturn = searchParams.get("modo") === "2preturn";
  const player2Team2P = searchParams.get("time2") || "";
  const quickMatchCode = searchParams.get("code");
  const quickMatchRole = searchParams.get("role");
  const isQMHost = isQuickMatch && quickMatchRole === "host";
  const isQMGuest = isQuickMatch && quickMatchRole === "guest";
  const channelRef = useRef<any>(null);

  useEffect(() => { document.title = `${teamName} vs ${opponentName} | Partida`; }, [teamName, opponentName]);
  

  const [minute, setMinute] = useState(1);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [possession, setPossession] = useState({ home: 0, away: 100 });
  const [shots, setShots] = useState({ home: 0, away: 0 });
  const [fouls, setFouls] = useState({ home: 0, away: 0 });
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSavingMatch, setIsSavingMatch] = useState(false);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [pendingPenaltyMinute, setPendingPenaltyMinute] = useState<number | null>(null);
  const [isHalftime, setIsHalftime] = useState(false);
  const [halftimeDone, setHalftimeDone] = useState(false);
  const [isPausedBySquad, setIsPausedBySquad] = useState(false);
  const [pausedByRole, setPausedByRole] = useState<string | null>(null);

  // Quick match: channel setup for realtime sync
  useEffect(() => {
    if (!isQuickMatch || !quickMatchCode) return;
    const channel = supabase.channel(`qm-match-${quickMatchCode}`);
    if (isQMGuest) {
      channel.on('broadcast', { event: 'tick' }, ({ payload }: any) => {
        setMinute(payload.minute);
        setHomeScore(payload.awayScore);
        setAwayScore(payload.homeScore);
        setPossession({ home: payload.possession.away, away: payload.possession.home });
        setShots({ home: payload.shots.away, away: payload.shots.home });
        setFouls({ home: payload.fouls.away, away: payload.fouls.home });
        setIsPlaying(payload.isPlaying);
        setIsHalftime(payload.isHalftime);
        setHalftimeDone(payload.halftimeDone);
        setMatchEvents((payload.matchEvents || []).map((e: MatchEvent) => ({
          ...e,
          team: e.team === 'home' ? 'away' as const : 'home' as const
        })));
      });
    }
    // Both host and guest listen for pause/resume events
    channel.on('broadcast', { event: 'squad_pause' }, ({ payload }: any) => {
      setIsPausedBySquad(payload.paused);
      setPausedByRole(payload.paused ? payload.role : null);
      if (payload.paused) {
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
      }
    });
    channel.subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [isQuickMatch, quickMatchCode, isQMGuest]);

  // Quick match host: broadcast state on every change
  useEffect(() => {
    if (!isQMHost || !channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'tick',
      payload: { minute, homeScore, awayScore, possession, shots, fouls, matchEvents, isPlaying, isHalftime, halftimeDone }
    });
  }, [minute, homeScore, awayScore, isHalftime, halftimeDone, isQMHost, matchEvents]);

  // Handle squad sheet open/close in quick match → pause/resume for both players
  const handleSquadSheetChange = (open: boolean) => {
    // Always pause/resume for squad management
    if (open) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }

    // Quick match: also broadcast pause to opponent
    if (isQuickMatch && channelRef.current) {
      const myRole = quickMatchRole || 'host';
      channelRef.current.send({
        type: 'broadcast',
        event: 'squad_pause',
        payload: { paused: open, role: myRole }
      });
      setIsPausedBySquad(open);
      setPausedByRole(open ? myRole : null);
    }
  };

  const selectedTeam = teams.find(t => t.name === teamName);
  const opponent = teams.find(t => t.name === opponentName);

  // Initialize players - carregar do localStorage se existir
  const getInitialUserPlayers = () => {
    const savedPlayers = localStorage.getItem(`players_${teamName}`);
    let players: Player[];
    if (savedPlayers) {
      players = JSON.parse(savedPlayers);
    } else {
      const raw = generateTeamPlayers(teamName);
      const { players: optimized, starterOrder } = optimizeStartersDefault(raw);
      localStorage.setItem(`players_${teamName}`, JSON.stringify(optimized));
      localStorage.setItem(`starter_order_${teamName}`, JSON.stringify(starterOrder));
      players = optimized;
    }
    // Apply suspensions: bench suspended starters, promote reserves
    const afterSuspensions = applySuspensions(players);
    // Reset match-specific card fields
    const resetCards = afterSuspensions.map(p => ({ ...p, matchYellowCards: 0, matchRedCard: false }));
    localStorage.setItem(`players_${teamName}`, JSON.stringify(resetCards));
    // Initialize matchEnergy from energy at start of match
    return initMatchEnergy(resetCards);
  };

  const [userPlayers, setUserPlayers] = useState<Player[]>(getInitialUserPlayers);
  
  const opponentPlayers = generateTeamPlayers(opponentName);
  
  const userStarters = userPlayers.filter((p) => p.isStarter);
  const userReserves = userPlayers.filter((p) => !p.isStarter);
  const opponentStarters = opponentPlayers.filter((p) => p.isStarter);

  // Ordenar titulares respeitando a ordem salva no localStorage
  const getOrderedStarters = () => {
    const savedOrder = localStorage.getItem(`starter_order_${teamName}`);
    if (savedOrder) {
      const orderIds = JSON.parse(savedOrder) as string[];
      return [...userStarters].sort((a, b) => {
        const indexA = orderIds.indexOf(a.id);
        const indexB = orderIds.indexOf(b.id);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
    return userStarters;
  };
  const orderedStarters = getOrderedStarters();

  const [selectedReserve, setSelectedReserve] = useState<Player | null>(null);
  const [selectedStarter, setSelectedStarter] = useState<Player | null>(null);

  const handleReserveClick = (player: Player) => {
    setSelectedStarter(null);
    setSelectedReserve(player);
  };

  const saveStarterOrder = (newOrder: Player[]) => {
    const orderIds = newOrder.map(p => p.id);
    localStorage.setItem(`starter_order_${teamName}`, JSON.stringify(orderIds));
  };

  const handleStarterClick = (starter: Player) => {
    // Se tem reserva selecionado, troca reserva <-> titular
    if (selectedReserve) {
      const updatedPlayers = userPlayers.map((p) => {
        if (p.id === starter.id) return { ...p, isStarter: false };
        if (p.id === selectedReserve.id) return { ...p, isStarter: true };
        return p;
      });

      // Atualizar ordem: colocar o novo titular na posição do antigo
      const newOrder = orderedStarters.map(p =>
        p.id === starter.id ? { ...selectedReserve, isStarter: true } : p
      );
      saveStarterOrder(newOrder);

      // Log substitution event
      setMatchEvents(events => [...events, {
        minute,
        type: 'substitution' as const,
        team: 'away' as const,
        playerName: selectedReserve.name,
        substituteOut: starter.name,
      }]);

      setUserPlayers(updatedPlayers);
      localStorage.setItem(`players_${teamName}`, JSON.stringify(updatedPlayers));
      setSelectedReserve(null);
      return;
    }

    // Se já tem um titular selecionado, troca posições entre eles
    if (selectedStarter) {
      if (selectedStarter.id === starter.id) {
        setSelectedStarter(null);
        return;
      }

      // Swap na ordem do campo
      const newOrder = orderedStarters.map(p => {
        if (p.id === selectedStarter.id) return starter;
        if (p.id === starter.id) return selectedStarter;
        return p;
      });
      saveStarterOrder(newOrder);

      setSelectedStarter(null);
      setUserPlayers([...userPlayers]); // force re-render
      return;
    }

    // Nenhum selecionado - selecionar este titular
    setSelectedStarter(starter);
  };

  const saveMatchResult = async () => {
    if (isSavingMatch) return;
    
    // Quick match: just navigate back, no DB save
    if (isQuickMatch) {
      navigate("/jogo-rapido");
      return;
    }
    
    setIsSavingMatch(true);

    try {
      // Import local championship utilities
      const { getNextUserMatch, saveMatchResultLocal, getLocalMatches } = await import("@/utils/localChampionship");
      
      // Find the current match from local storage
      const nextMatch = getNextUserMatch(teamName);
      if (!nextMatch) throw new Error("Partida não encontrada");

      // Determine scores: in Match.tsx, "home" = opponent, "away" = user
      const userIsHome = nextMatch.home_team_name === teamName;
      const dbHomeScore = userIsHome ? awayScore : homeScore;
      const dbAwayScore = userIsHome ? homeScore : awayScore;

      // Save match result locally (also simulates other matches and updates standings)
      // In 2P mode, exclude the other player's team from simulation
      const excludeTeams = (is2PMode && player2Team2P) ? [player2Team2P] : undefined;
      saveMatchResultLocal(teamName, nextMatch.id, dbHomeScore, dbAwayScore, excludeTeams);

      // Handle investment earnings
      const hasInvestment = localStorage.getItem(`investment_${teamName}`) === 'true';
      if (hasInvestment) {
        const { getLocalBudget, saveLocalBudget } = await import("@/utils/localChampionship");
        const currentBudget = getLocalBudget(teamName);
        saveLocalBudget(teamName, currentBudget + 200000);
        toast.success("Investimento: +$200 mil recebidos!");
      }

      // Finalize energy and cards
      const afterEnergy = finalizeMatchEnergy(userPlayers);
      const finalizedPlayers = finalizeCardsAfterMatch(afterEnergy);
      localStorage.setItem(`players_${teamName}`, JSON.stringify(finalizedPlayers));
      
      // Evolução de OVR é aplicada apenas no final da temporada

      // Flush all pending async writes before navigating
      flushPendingWrites();

      toast.success("Resultado salvo com sucesso!");
      setTimeout(() => {
        if (is2PMode && player2Team2P) {
          // P1 just finished — save post-match data, then load P2's match
          localStorage.setItem('2p_postmatch_p1', JSON.stringify({
            teamName,
            opponentName,
            homeScore,
            awayScore,
            matchEvents,
          }));
          
          // Sync P1's updated championship data to P2
          const { getLocalMatches, getLocalStandings, getLocalChampionship, saveLocalMatches, saveLocalStandings, saveLocalChampionship } = await import("@/utils/localChampionship");
          const p1Matches = getLocalMatches(teamName);
          const p1Standings = getLocalStandings(teamName);
          const p1Champ = getLocalChampionship(teamName);
          saveLocalMatches(player2Team2P, p1Matches);
          saveLocalStandings(player2Team2P, p1Standings);
          if (p1Champ) saveLocalChampionship(player2Team2P, p1Champ);
          flushPendingWrites();
          
          const p2Pending = localStorage.getItem('2p_p2_match_pending');
          if (p2Pending) {
            const p2Data = JSON.parse(p2Pending);
            const p2Players = localStorage.getItem('match_players_p2');
            if (p2Players) localStorage.setItem('match_players', p2Players);
            localStorage.removeItem('2p_p2_match_pending');
            localStorage.removeItem('2p_p1_match_pending');
            localStorage.removeItem('match_players_p1');
            localStorage.removeItem('match_players_p2');
            navigate(`/partida?time=${encodeURIComponent(p2Data.team)}&adversario=${encodeURIComponent(p2Data.opponent)}&modo=2preturn&time2=${encodeURIComponent(teamName)}`);
          } else {
            navigate(`/jogo?time=${encodeURIComponent(teamName)}&time2=${encodeURIComponent(player2Team2P)}&modo=2p`);
          }
        } else if (is2PReturn && player2Team2P) {
          // P2 just finished — save post-match data, go to sequential post-match review
          localStorage.setItem('2p_postmatch_p2', JSON.stringify({
            teamName,
            opponentName,
            homeScore,
            awayScore,
            matchEvents,
          }));
          // player2Team2P here is P1's team (passed as time2 in 2preturn)
          navigate(`/pos-jogo-2p?time=${encodeURIComponent(player2Team2P)}&time2=${encodeURIComponent(teamName)}`);
        } else {
          navigate(`/jogo?time=${teamName}`);
        }
      }, 800);
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
    if (!isPlaying || minute >= 90 || showPenaltyModal || isHalftime || isQMGuest) return;

    const interval = setInterval(() => {
      // Drain energy for all user starters each minute
      setUserPlayers(prev => {
        const updated = prev.map(p => {
          if (!p.isStarter) return p;
          return { ...p, matchEnergy: drainEnergyPerMinute(p) };
        });
        return updated;
      });

      setMinute(prev => {
        const next = prev + 1;

        // Intervalo aos 45 minutos
        if (next === 45 && !halftimeDone) {
          setIsPlaying(false);
          setIsHalftime(true);
          return next;
        }
        
        // Simular eventos aleatórios — chance de gol baseada em tática e overall adversário
        const opponentAvgOvr = opponentStarters.length > 0
          ? opponentStarters.reduce((sum, p) => sum + p.overall, 0) / opponentStarters.length
          : 75;
        const userAvgOvr = userStarters.length > 0
          ? userStarters.reduce((sum, p) => sum + getEffectiveOverall(p), 0) / userStarters.length
          : 75;
        const difficultyFactor = Math.max(0.5, Math.min(1.5, (150 - opponentAvgOvr) / 75));

        // Red cards reduce team strength by 22% each
        const homeRedCards = matchEvents.filter(e => e.type === 'red_card' && e.team === 'home').length;
        const awayRedCards = matchEvents.filter(e => e.type === 'red_card' && e.team === 'away').length;
        const homeStrength = Math.max(0.3, 1 - homeRedCards * 0.20);
        const awayStrength = Math.max(0.3, 1 - awayRedCards * 0.20);

        // Play style bonuses
        let styleAttackBonus = 0;
        let styleDefenseBonus = 0;
        if (isQuickMatch) {
          const myStyleId = searchParams.get("myStyle") || "balanced";
          const oppStyleId = searchParams.get("oppStyle") || "balanced";
          const styleMap: Record<string, { attack: number; defense: number }> = {
            balanced: { attack: 0, defense: 0 },
            counter: { attack: -10, defense: 15 },
            possession: { attack: 5, defense: 5 },
            pressing: { attack: 10, defense: 5 },
            defensive: { attack: -20, defense: 25 },
            attacking: { attack: 25, defense: -15 },
          };
          const myPS = styleMap[myStyleId] || styleMap.balanced;
          const oppPS = styleMap[oppStyleId] || styleMap.balanced;
          styleAttackBonus = (myPS.attack - oppPS.defense) / 200;
          styleDefenseBonus = (oppPS.attack - myPS.defense) / 200;
        }

        const baseGoalChance = 0.05;
        
        if (Math.random() < baseGoalChance) {
          // Chance de gol — overall, tactics, red cards affect probability
          const homeGoalProb = (1 - (difficultyFactor * 0.5) + styleDefenseBonus) * homeStrength;
          const awayGoalProb = (difficultyFactor * 0.5 + styleAttackBonus) * awayStrength;
          const totalProb = homeGoalProb + awayGoalProb;
          const isHomeGoal = Math.random() < (homeGoalProb / totalProb);
          
          // Chance de ser pênalti (20% dos gols)
          const isPenalty = Math.random() < 0.2;
          
          if (isPenalty) {
            if (!isHomeGoal) {
              if (isQuickMatch) {
                // Auto-resolve penalty in quick match
                const kicker = userStarters.find(p => ['ATA', 'PE', 'PD'].includes(p.position)) || userStarters[0];
                const kickerName = kicker?.name || 'Jogador';
                const isGoal = Math.random() < 0.75;
                if (isGoal) {
                  setAwayScore(s => s + 1);
                  setMatchEvents(events => [...events, { minute: next, type: 'penalty' as const, team: 'away' as const, playerName: kickerName }]);
                } else {
                  setMatchEvents(events => [...events, { minute: next, type: 'penalty_missed' as const, team: 'away' as const, playerName: kickerName }]);
                }
              } else {
                // Pênalti para o time do usuário - pausar e mostrar modal
                setIsPlaying(false);
                setPendingPenaltyMinute(next);
                setShowPenaltyModal(true);
                return next;
              }
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
          
          // Card system: pick a random player from the fouling team
          const foulTeam: 'home' | 'away' = isHomeFoul ? 'home' : 'away';
          if (foulTeam === 'away') {
            // User team: use functional state to get fresh player data
            setUserPlayers(prev => {
              const activeStarters = prev.filter(p => p.isStarter && !p.matchRedCard);
              if (activeStarters.length === 0) return prev;
              const foulPlayer = activeStarters[Math.floor(Math.random() * activeStarters.length)];
              
              // Direct red card check (18% per match ≈ 2.5% per foul)
              if (Math.random() < 0.025) {
                setMatchEvents(events => [...events, {
                  minute: next,
                  type: 'red_card' as const,
                  team: 'away' as const,
                  playerName: foulPlayer.name
                }]);
                return prev.map(p =>
                  p.id === foulPlayer.id ? applyCardToPlayer(p, 'red_card') : p
                );
              }
              
              const cardChance = getYellowCardChance(foulPlayer);
              if (Math.random() * 100 < cardChance) {
                const currentYellows = foulPlayer.matchYellowCards || 0;
                const isSecondYellow = currentYellows >= 1;
                const cardType = isSecondYellow ? 'red_card' as const : 'yellow_card' as const;
                
                setMatchEvents(events => [...events, {
                  minute: next,
                  type: cardType,
                  team: 'away' as const,
                  playerName: foulPlayer.name
                }]);
                
                return prev.map(p =>
                  p.id === foulPlayer.id ? applyCardToPlayer(p, cardType) : p
                );
              }
              return prev;
            });
          } else {
            // Opponent team: stateless, just generate event
            const foulPlayers = opponentStarters;
            if (foulPlayers.length > 0) {
              const foulPlayer = foulPlayers[Math.floor(Math.random() * foulPlayers.length)];
              
              // Direct red card check
              if (Math.random() < 0.025) {
                setMatchEvents(events => [...events, {
                  minute: next,
                  type: 'red_card' as const,
                  team: 'home' as const,
                  playerName: foulPlayer.name
                }]);
              } else {
                const cardChance = getYellowCardChance(foulPlayer);
                if (Math.random() * 100 < cardChance) {
                  const currentYellows = foulPlayer.matchYellowCards || 0;
                  const isSecondYellow = currentYellows >= 1;
                  const cardType = isSecondYellow ? 'red_card' as const : 'yellow_card' as const;
                  setMatchEvents(events => [...events, {
                    minute: next,
                    type: cardType,
                    team: 'home' as const,
                    playerName: foulPlayer.name
                  }]);
                }
              }
            }
          }
        }
        
        // Atualizar posse (sempre soma 100%)
        const homePoss = Math.floor(35 + Math.random() * 30);
        setPossession({
          home: homePoss,
          away: 100 - homePoss
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
      case 'substitution':
        return '🔄';
      default:
        return '';
    }
  };

  const getEventText = (event: MatchEvent) => {
    if (event.type === 'substitution') {
      return `${event.playerName} → ${event.substituteOut || ''}`;
    }
    return event.playerName;
  };

  // No auth loading check needed

  return (
    <div className="min-h-screen bg-black">
      {/* Header - only timer */}

      {/* Match Info */}
      <div className="container mx-auto px-4 py-4">
        <div className="text-center mb-4">
          <div className="inline-block bg-accent px-6 py-2 rounded-full mb-4">
            <span className="text-2xl font-bold text-black">{minute}'</span>
          </div>
        </div>

        {/* Score Board */}
        <div className="flex items-center justify-center gap-8 mb-4">
          {/* Home Team (Opponent) - not clickable */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center p-4">
              <img src={opponent?.logo} alt={opponentName} className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-medium text-white">{opponentName.slice(0, 3).toUpperCase()}</span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-6">
            <span className="text-6xl font-bold text-white">{homeScore}</span>
            <span className="text-4xl font-bold text-muted-foreground">-</span>
            <span className="text-6xl font-bold text-white">{awayScore}</span>
          </div>

          {/* Away Team (User) - opens full squad management */}
          <Sheet onOpenChange={(open) => handleSquadSheetChange(open)}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center p-4">
                  <img src={selectedTeam?.logo} alt={teamName} className="w-full h-full object-contain" />
                </div>
                <span className="text-sm font-medium text-white">{teamName.slice(0, 3).toUpperCase()}</span>
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
                  orderedPlayers={orderedStarters}
                  onStarterClick={handleStarterClick}
                  canSubstitute={!!selectedReserve || !!selectedStarter}
                  selectedStarterId={selectedReserve?.id || selectedStarter?.id}
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

        {/* Match Events - fixed height for 3 events */}
        <div className="max-w-2xl mx-auto mb-4">
          <div className="bg-zinc-900 rounded-lg p-3 h-[100px] overflow-y-auto">
            {matchEvents.length > 0 ? (
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
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="text-zinc-600 text-xs">Sem eventos</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-2xl mx-auto space-y-6 mt-12">
          {/* Possession */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">{possession.home}%</span>
              <span className="text-sm font-medium text-white">Posse de bola</span>
              <span className="text-sm text-muted-foreground">{possession.away}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex w-full">
              <div 
                className="bg-white transition-all duration-1000" 
                style={{ width: `${possession.home}%` }}
              />
              <div 
                className="bg-accent transition-all duration-1000" 
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

        {/* Pause overlay when other player is managing squad (Quick Match) */}
        {isPausedBySquad && pausedByRole !== quickMatchRole && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <div className="text-4xl mb-4">⏸️</div>
              <h2 className="text-2xl font-bold text-white mb-2">JOGO PAUSADO</h2>
              <p className="text-muted-foreground">O adversário está gerenciando o elenco...</p>
              <p className="text-muted-foreground text-sm mt-2">Minuto {minute}'</p>
            </div>
          </div>
        )}

        {/* Halftime Overlay */}
        {isHalftime && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-8 pb-24">
              <div className="container mx-auto">
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
                    orderedPlayers={orderedStarters}
                    onStarterClick={handleStarterClick}
                    canSubstitute={!!selectedReserve || !!selectedStarter}
                    selectedStarterId={selectedReserve?.id || selectedStarter?.id}
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

                  {isQMGuest && (
                    <p className="text-center text-muted-foreground animate-pulse text-lg py-4">Aguardando o anfitrião iniciar o 2º tempo...</p>
                  )}
                </div>
              </div>
            </div>
            {!isQMGuest && (
              <div className="shrink-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent">
                <button
                  onClick={() => {
                    setIsHalftime(false);
                    setHalftimeDone(true);
                    setIsPlaying(true);
                  }}
                  className="w-full max-w-md mx-auto block bg-accent hover:bg-accent/90 text-black font-bold py-4 px-6 rounded-xl transition-all text-lg"
                >
                  INICIAR 2º TEMPO
                </button>
              </div>
            )}
          </div>
        )}

        {/* End Match Message */}
        {minute >= 90 && (
          <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
            {/* Header: Score with logos */}
            <div className="bg-zinc-900 py-6 px-4">
              <div className="flex items-center justify-between max-w-md mx-auto">
                <div className="flex items-center gap-3">
                  <img src={opponent?.logo} alt={opponentName} className="w-12 h-12 object-contain" />
                  <span className="text-4xl font-bold text-white">{homeScore}</span>
                </div>
                <div className="flex items-center justify-center">
                  {awayScore > homeScore ? (
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl">✓</span>
                    </div>
                  ) : homeScore > awayScore ? (
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl">✗</span>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl">−</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-white">{awayScore}</span>
                  <img src={selectedTeam?.logo} alt={teamName} className="w-12 h-12 object-contain" />
                </div>
              </div>
            </div>

            {/* Event list */}
            <div className="px-4 py-6 max-w-md mx-auto space-y-3">
              {matchEvents.slice().reverse().map((event, index) => {
                const teamLogo = event.team === 'home' ? opponent?.logo : selectedTeam?.logo;
                return (
                  <div 
                    key={index}
                    className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3"
                  >
                    <span className="text-sm text-muted-foreground font-medium min-w-[30px]">{event.minute}'</span>
                    <span className="text-lg">{getEventIcon(event.type)}</span>
                    <img src={teamLogo} alt="" className="w-6 h-6 object-contain" />
                    <span className="text-white text-sm font-medium truncate">{getEventText(event)}</span>
                  </div>
                );
              })}
              {matchEvents.length === 0 && (
                <div className="text-center py-8">
                  <span className="text-zinc-500">Nenhum evento na partida</span>
                </div>
              )}
            </div>

            {/* Continue button fixed at bottom */}
            <div className="sticky bottom-0 px-4 pb-6 pt-2 bg-gradient-to-t from-black via-black to-transparent">
              <button
                onClick={saveMatchResult}
                disabled={isSavingMatch}
                className="w-full max-w-md mx-auto block bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 text-lg"
              >
                {isSavingMatch ? "Salvando..." : "CONTINUAR"}
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