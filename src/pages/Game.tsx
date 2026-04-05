import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { GameMenu } from "@/components/GameMenu";
import { MatchCard } from "@/components/MatchCard";
import { TacticsManager } from "@/components/TacticsManager";
import { SquadManager } from "@/components/SquadManager";
import { TeamBudget } from "@/components/TeamBudget";
import { PlayerValueModal } from "@/components/PlayerValueModal";
import { TransferMarket } from "@/components/TransferMarket";
import { ReceivedOffersModal } from "@/components/ReceivedOffersModal";
import { FinancesModal } from "@/components/FinancesModal";
import { processCpuOffers, countPendingOffers, generateCpuOffers, clearAllOffers } from "@/utils/transferOffers";

import { teams } from "@/data/teams";
import {
  generateTeamPlayers,
  type Player,
} from "@/data/players";
import { Loader2, Zap, ShoppingCart } from "lucide-react";
import { useChampionship } from "@/hooks/useChampionship";
import { useLibertadores } from "@/hooks/useLibertadores";
import { useTeamForm } from "@/hooks/useTeamForm";
import { useTeamBudget } from "@/hooks/useTeamBudget";
import { getTeamLogo } from "@/utils/teamLogos";
import { getLocalStandings, deleteLocalChampionship, getLocalBudget } from "@/utils/localChampionship";
import { calculateMarketValue, formatMarketValue } from "@/utils/marketValue";
import { fetchAdminPlayers, fetchAdminLogos } from "@/hooks/useAdminData";
import { optimizeStartersDefault } from "@/utils/formationOptimizer";
import { getTeamRosterPlayers, removePlayerFromTeamRoster, saveTeamRosterPlayers, adjustSquadBalance } from "@/utils/teamRoster";
import { sortPlayersByReserveOrder } from "@/utils/playerOrder";
import { toast } from "sonner";
import { useSwipePages } from "@/hooks/useSwipePages";

const Game = () => {
  const [rosterTab, setRosterTab] = useState<'reserves' | 'unlisted'>('reserves');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamName = searchParams.get("time") || "Seu Time";

  useEffect(() => { document.title = `${teamName} - Painel | Gerenciador`; }, [teamName]);

  const [showTransferMarket, setShowTransferMarket] = useState(false);
  const [showReceivedOffers, setShowReceivedOffers] = useState(false);
  const [showFinances, setShowFinances] = useState(false);
  const [offersCount, setOffersCount] = useState(0);
  const [adminSquadReady, setAdminSquadReady] = useState(false);

  // Process CPU offers + generate active CPU offers on mount
  useEffect(() => {
    if (!adminSquadReady) return;
    const brazilianTeams = teams.filter(t => t.league === "brasileiro").map(t => t.name);
    processCpuOffers([teamName]);
    generateCpuOffers([teamName], brazilianTeams);
    setOffersCount(countPendingOffers(teamName));
  }, [teamName, adminSquadReady]);

  const refreshOffersCount = () => setOffersCount(countPendingOffers(teamName));
  const [totalSales, setTotalSales] = useState(0);
  const [hasActiveInvestment, setHasActiveInvestment] = useState(() => {
    return localStorage.getItem(`investment_${teamName}`) === 'true';
  });
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [selectedPlayerForValue, setSelectedPlayerForValue] = useState<Player | null>(null);

  // Swipe horizontal entre tela principal e gerenciamento de elenco
  const swipe = useSwipePages({ threshold: 0.3 });
  
  
  // Initialize players state - always prefer localStorage (preserves energy state)
  const getInitialPlayers = () => {
    const rosterPlayers = getTeamRosterPlayers(teamName);
    const { players: optimized, starterOrder } = optimizeStartersDefault(rosterPlayers);
    saveTeamRosterPlayers(teamName, optimized);
    localStorage.setItem(`starter_order_${teamName}`, JSON.stringify(starterOrder));
    return optimized;
  };
  const [players, setPlayers] = useState<Player[]>(getInitialPlayers);

  // Load admin overrides from DB — always merge admin info (name, age, overall, etc.)
  // while preserving runtime state (energy, consecutiveMatches, season stats)
  useEffect(() => {
    let active = true;
    setAdminSquadReady(false);

    (async () => {
      const [adminPlayers] = await Promise.all([fetchAdminPlayers(true), fetchAdminLogos()]);
      if (!active) return;

      const team = teams.find(t => t.name === teamName);
      const teamId = team?.id ?? teamName;
      if (adminPlayers[teamId] && adminPlayers[teamId].length > 0) {
        const adminList = adminPlayers[teamId];
        setPlayers(prev => {
          // Build set of admin IDs for lookup
          const adminIds = new Set(adminList.map(p => p.id));
          // Detect truly transferred players: not in admin list AND not a generic generated player for this team
          const teamPrefixLower = teamId.toLowerCase() + '_';
          const teamPrefixName = teamName + '_';
          const transferredPlayers = prev.filter(p => 
            !adminIds.has(p.id) && 
            !p.id.toLowerCase().startsWith(teamPrefixLower) &&
            !p.id.startsWith(teamPrefixName)
          );
          // Merge: use admin data as base, overlay runtime fields from existing players
          const merged = adminList.map((adminP) => {
            const existing = prev.find(p => p.id === adminP.id);
            if (existing) {
              return {
                ...adminP,
                isStarter: existing.isStarter,
                isListed: existing.isListed,
                energy: existing.energy,
                matchEnergy: existing.matchEnergy,
                consecutiveMatches: existing.consecutiveMatches,
                seasonStarterMatches: existing.seasonStarterMatches,
                seasonBenchMatches: existing.seasonBenchMatches,
                ovrChange: existing.ovrChange,
                accumulatedYellows: existing.accumulatedYellows,
                suspensionMatches: existing.suspensionMatches,
                matchYellowCards: 0,
                matchRedCard: false,
              };
            }
            return { ...adminP, energy: adminP.energy ?? 100, consecutiveMatches: 0 };
          });
          const allPlayers = [...merged, ...transferredPlayers];
          // Ensure exactly 11 starters and optimize positions for current formation
          const { players: optimized, starterOrder } = optimizeStartersDefault(allPlayers);
          saveTeamRosterPlayers(teamName, optimized);
          localStorage.setItem(`starter_order_${teamName}`, JSON.stringify(starterOrder));
          return optimized;
        });
      } else {
        // No admin data — still ensure 11 starters
        setPlayers(prev => {
          const starterCount = prev.filter(p => p.isStarter).length;
          if (starterCount !== 11) {
            const { players: optimized, starterOrder } = optimizeStartersDefault(prev);
            saveTeamRosterPlayers(teamName, optimized);
            localStorage.setItem(`starter_order_${teamName}`, JSON.stringify(starterOrder));
            return optimized;
          }
          return prev;
        });
      }

      if (active) setAdminSquadReady(true);
    })();
    return () => { active = false; };
  }, [teamName]);

  // Atualizar jogadores (NÃO salva automaticamente - apenas via save explícito)
  const updatePlayers = (updatedPlayers: Player[]) => {
    setPlayers(updatedPlayers);
    saveTeamRosterPlayers(teamName, updatedPlayers);
  };

  // Find the selected team
  const selectedTeam = teams.find(t => t.name === teamName);
  
  // Get championship data
  const { championship, nextMatch, loading, isChampionComplete, userWonChampionship, resetChampionship, refreshChampionship } = useChampionship(teamName);

  
  // Dynamic Libertadores team lists
  const PRE_LIBERTADORES_TEAMS = (() => {
    const stored = localStorage.getItem('lib_prelib_teams');
    if (stored) return JSON.parse(stored) as string[];
    return ["Botafogo", "Bahia"];
  })();
  
  // Libertadores data
  const { 
    nextLibertadoresMatch, 
    nextLibertadoresChampionshipId,
    libertadoresId,
    loading: libertadoresLoading 
  } = useLibertadores(teamName, championship?.id);

  // Alternation logic: Lib group stage rounds map to BR round thresholds
  // Fase de grupos começa a partir da rodada 5: BR5, Lib1, BR6, Lib2, ..., BR10, Lib6
  const LIB_ROUND_AFTER_BR = [5, 6, 7, 8, 9, 10];

  const shouldShowLibertadoresMatch = (): boolean => {
    if (!nextLibertadoresMatch) return false;
    // Pre-Libertadores always plays first (before Brasileirão starts)
    const isPreLibMatch = PRE_LIBERTADORES_TEAMS.includes(teamName) && !libertadoresId;
    if (isPreLibMatch) return true;
    // Group stage: show when BR round has passed the threshold
    if (!nextMatch) return true;
    const libRound = nextLibertadoresMatch.round;
    const brRound = nextMatch.round;
    if (libRound <= LIB_ROUND_AFTER_BR.length) {
      return brRound > LIB_ROUND_AFTER_BR[libRound - 1];
    }
    return false;
  };

  const showLibMatch = shouldShowLibertadoresMatch();
  
  // Determine if user is home or away based on match data
  const isHome = nextMatch ? nextMatch.home_team_name === teamName : false;
  const opponentName = nextMatch 
    ? (isHome ? nextMatch.away_team_name : nextMatch.home_team_name)
    : "";
  const opponentLogo = nextMatch
    ? (isHome ? nextMatch.away_team_logo : nextMatch.home_team_logo)
    : "";

  // Get real standings positions
  const standings = getLocalStandings(teamName);
  const sortedStandings = [...standings].sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference || b.goals_for - a.goals_for);
  const userStanding = sortedStandings.findIndex(s => s.team_name === teamName);
  const opponentStanding = sortedStandings.findIndex(s => s.team_name === opponentName);
  const userPositionStr = userStanding >= 0 ? `${userStanding + 1}º` : "";
  const opponentPositionStr = opponentStanding >= 0 ? `${opponentStanding + 1}º` : "";

  // Buscar os últimos 5 resultados reais de cada time
  const { form: userForm, loading: userFormLoading } = useTeamForm(teamName, championship?.id);
  const { form: opponentForm, loading: opponentFormLoading } = useTeamForm(opponentName, championship?.id);
  
  // Buscar o budget do time
  const { budget, setBudget, loading: budgetLoading } = useTeamBudget(teamName, championship?.id);

  // Refresh all data after instant simulation (no page reload)
  const handleSimulated = useCallback(() => {
    const savedPlayers = localStorage.getItem(`players_${teamName}`);
    if (savedPlayers) setPlayers(JSON.parse(savedPlayers));
    refreshChampionship();
    setBudget(getLocalBudget(teamName));
    // Process transfers after match
    const brazilianTeams = teams.filter(t => t.league === "brasileiro").map(t => t.name);
    processCpuOffers([teamName]);
    generateCpuOffers([teamName], brazilianTeams);
    refreshOffersCount();
  }, [teamName, refreshChampionship, setBudget]);

  const [selectedReserve, setSelectedReserve] = useState<Player | null>(null);
  const [selectedStarter, setSelectedStarter] = useState<Player | null>(null);

  const starters = players.filter((p) => p.isStarter);
  const allNonStarters = players.filter((p) => !p.isStarter);
  const reserves = sortPlayersByReserveOrder(allNonStarters.filter((p) => p.isListed !== false));
  const unlisted = sortPlayersByReserveOrder(allNonStarters.filter((p) => p.isListed === false));

  // Ordenação dos titulares baseada na ordem salva (para manter posições trocadas)
  const getStarterOrder = () => {
    const savedOrder = localStorage.getItem(`starter_order_${teamName}`);
    if (savedOrder) {
      const orderIds = JSON.parse(savedOrder) as string[];
      return starters.sort((a, b) => {
        const indexA = orderIds.indexOf(a.id);
        const indexB = orderIds.indexOf(b.id);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
    return starters;
  };

  const orderedStarters = getStarterOrder();

  const saveStarterOrder = (newOrder: Player[]) => {
    const orderIds = newOrder.map(p => p.id);
    localStorage.setItem(`starter_order_${teamName}`, JSON.stringify(orderIds));
  };

  const handleReserveClick = (player: Player) => {
    // Se tiver um titular selecionado, troca titular <-> reserva/não-relacionado
    if (selectedStarter) {
      if ((player.suspensionMatches || 0) > 0) {
        toast.error("Jogador suspenso! Deve ficar em Não relacionados.");
        return;
      }
      const updatedPlayers = players.map((p) => {
        if (p.id === selectedStarter.id) return { ...p, isStarter: false, isListed: true };
        if (p.id === player.id) return { ...p, isStarter: true, isListed: true };
        return p;
      });
      const newOrder = orderedStarters.map(p =>
        p.id === selectedStarter.id ? { ...player, isStarter: true } : p
      );
      saveStarterOrder(newOrder);
      updatePlayers(updatedPlayers);
      setSelectedStarter(null);
      return;
    }

    // Se já tem um reserva/não-relacionado selecionado
    if (selectedReserve) {
      if (selectedReserve.id === player.id) {
        setSelectedReserve(null);
        return;
      }
      // Swap listed status between the two players
      const updatedPlayers = players.map((p) => {
        if (p.id === selectedReserve.id) return { ...p, isListed: player.isListed };
        if (p.id === player.id) return { ...p, isListed: selectedReserve.isListed };
        return p;
      });
      updatePlayers(updatedPlayers);
      setSelectedReserve(null);
      toast.success(`${selectedReserve.name} ↔ ${player.name}`);
      return;
    }

    setSelectedReserve(player);
  };


  const handleReserveLongPress = (player: Player) => {
    setSelectedPlayerForValue(player);
  };

  const handleStarterClick = (starter: Player) => {
    // Se tiver um reserva selecionado, troca reserva <-> titular
    if (selectedReserve) {
      const updatedPlayers = players.map((p) => {
        if (p.id === starter.id) {
          return { ...p, isStarter: false };
        }
        if (p.id === selectedReserve.id) {
          return { ...p, isStarter: true };
        }
        return p;
      });
      
      // Atualizar ordem: colocar o novo titular na posição do antigo
      const newOrder = orderedStarters.map(p => 
        p.id === starter.id ? { ...selectedReserve, isStarter: true } : p
      );
      saveStarterOrder(newOrder);
      
      updatePlayers(updatedPlayers);
      setSelectedReserve(null);
      return;
    }

    // Se já tem um titular selecionado, troca posições entre eles
    if (selectedStarter) {
      if (selectedStarter.id === starter.id) {
        // Clicou no mesmo, abre modal de valor
        setSelectedPlayerForValue(starter);
        setSelectedStarter(null);
        return;
      }
      
      // Trocar posições no campo (swap na ordem)
      const newOrder = orderedStarters.map(p => {
        if (p.id === selectedStarter.id) return starter;
        if (p.id === starter.id) return selectedStarter;
        return p;
      });
      saveStarterOrder(newOrder);
      
      setSelectedStarter(null);
      // Forçar re-render
      setPlayers([...players]);
      return;
    }

    // Nenhum selecionado ainda - selecionar este titular
    setSelectedStarter(starter);
  };

  const handleSellPlayer = (player: Player) => {
    const sellValue = Math.floor(calculateMarketValue(player.overall) * 0.8);
    const { updatedPlayers, replacement } = removePlayerFromTeamRoster(teamName, player.id);

    updatePlayers(updatedPlayers);
    setBudget(budget + sellValue);
    setTotalSales(prev => prev + sellValue);
    setSelectedPlayerForValue(null);

    if (replacement) {
      toast.success(`${replacement.name} assumiu a vaga de titular!`);
    }

    toast.success(`${player.name} vendido por ${formatMarketValue(sellValue)}!`);
  };

  const handleOfferAccepted = () => {
    setPlayers(getTeamRosterPlayers(teamName));
    refreshOffersCount();
  };

  const handleInvest = () => {
    const investmentCost = 4000000;
    if (budget >= investmentCost) {
      setBudget(budget - investmentCost);
      setHasActiveInvestment(true);
      localStorage.setItem(`investment_${teamName}`, 'true');
      toast.success("Investimento realizado! Você ganhará $200 mil a cada jogo.");
    }
  };


  if (loading || userFormLoading || opponentFormLoading || budgetLoading || libertadoresLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00]" />
      </div>
    );
  }


  // Tela de fim de campeonato
  if (isChampionComplete && !loading) {
    if (userWonChampionship) {
      // Tela de celebração
      return (
        <div className="min-h-screen bg-gradient-to-b from-yellow-500/20 via-black to-black flex items-center justify-center">
          <div className="text-center px-4 max-w-2xl">
            <div className="mb-8 animate-bounce">
              <div className="text-8xl mb-4">🏆</div>
              <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4">
                CAMPEÃO!
              </h1>
              <p className="text-2xl md:text-3xl text-white font-bold mb-2">
                {teamName}
              </p>
              <p className="text-lg text-muted-foreground">
                Parabéns! Você conquistou o Brasileirão 2024!
              </p>
            </div>
            
            <button
              onClick={resetChampionship}
              className="bg-white hover:bg-gray-100 text-black font-bold text-xl py-4 px-12 rounded-lg transition-all transform hover:scale-105"
            >
              Avançar
            </button>
          </div>
        </div>
      );
    } else {
      // Botão de avançar simples
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-3xl font-bold text-white mb-4">Campeonato Finalizado</h2>
            <p className="text-muted-foreground mb-8">O campeonato chegou ao fim.</p>
            
            <button
              onClick={resetChampionship}
              className="bg-white hover:bg-gray-100 text-black font-bold text-xl py-4 px-12 rounded-lg transition-colors"
            >
              Avançar
            </button>
          </div>
        </div>
      );
    }
  }

  if (!nextMatch && !nextLibertadoresMatch && !loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00] mb-4 mx-auto" />
          <p className="text-muted-foreground">Preparando próxima partida...</p>
        </div>
      </div>
    );
  }

  if (!nextMatch && !nextLibertadoresMatch) {
    return null;
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Header fixo */}
      <header className="border-b border-[#1a2c4a] bg-black fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center p-1.5">
              <img src={selectedTeam?.logo} alt={teamName} className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">{teamName}</span>
              <span className="text-xs text-green-400 font-medium">$ {(budget / 1000000).toFixed(1)} M</span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/loja?from=/jogo?time=${encodeURIComponent(teamName)}`)}
            className="p-2 rounded-lg hover:bg-white/5 active:scale-95 transition-all"
          >
            <ShoppingCart className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* FAB Menu flutuante */}
      <GameMenu 
        teamName={teamName} 
        onManageSquad={() => swipe.goToPage(1)} 
        onTransferMarket={() => setShowTransferMarket(true)}
        onFinances={() => setShowFinances(true)}
        offersCount={offersCount}
        onReceivedOffers={() => setShowReceivedOffers(true)}
        onExit={() => {
          // Limpar dados de todos os times do campeonato
          const brazilianTeams = teams.filter(t => t.league === "brasileiro").map(t => t.name);
          brazilianTeams.forEach(t => {
            localStorage.removeItem(`players_${t}`);
            localStorage.removeItem(`starter_order_${t}`);
            localStorage.removeItem(`investment_${t}`);
            localStorage.removeItem(`local_budget_${t}`);
          });
          deleteLocalChampionship(teamName);
          localStorage.removeItem(`lib_championship_${teamName}`);
          localStorage.removeItem(`lib_matches_${teamName}`);
          localStorage.removeItem(`lib_standings_${teamName}`);
          localStorage.removeItem(`lib_prelib_teams`);
          localStorage.removeItem(`lib_direct_qualifiers`);
          // Limpar todas as ofertas de transferência
          clearAllOffers();
          navigate("/");
        }}
      />

      {/* Swipeable pages container */}
      <div
        className="flex h-full w-[200vw] pt-16"
        style={{
          transform: `translateX(${swipe.translateX}vw)`,
          transition: swipe.isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          touchAction: 'pan-y',
        }}
        onTouchStart={swipe.handleTouchStart}
        onTouchMove={swipe.handleTouchMove}
        onTouchEnd={swipe.handleTouchEnd}
      >
        {/* Page 0: Tela Principal */}
        <div className="w-screen h-full overflow-y-auto">
          {/* Libertadores Match Section */}
          {showLibMatch && nextLibertadoresMatch && (
            <div className="container mx-auto px-4 pt-6">
              <h3 className="text-sm font-bold text-[#c8ff00] mb-3">
                {nextLibertadoresChampionshipId && nextLibertadoresMatch.championship_id ? 
                  (nextLibertadoresMatch.round <= 4 && PRE_LIBERTADORES_TEAMS.includes(teamName) && !libertadoresId
                    ? `Pré-Libertadores - Fase ${nextLibertadoresMatch.round <= 2 ? 1 : 2} (${nextLibertadoresMatch.round % 2 === 1 ? "Ida" : "Volta"})`
                    : `Quarta-feira • Libertadores - ${nextLibertadoresMatch.round}ª Rodada`) 
                  : "Libertadores"}
              </h3>
              <MatchCard
                userTeam={teamName}
                userLogo={getTeamLogo(teamName, selectedTeam?.logo || "")}
                userPosition=""
                opponentTeam={nextLibertadoresMatch.home_team_name === teamName ? nextLibertadoresMatch.away_team_name : nextLibertadoresMatch.home_team_name}
                opponentLogo={getTeamLogo(
                  nextLibertadoresMatch.home_team_name === teamName ? nextLibertadoresMatch.away_team_name : nextLibertadoresMatch.home_team_name,
                  nextLibertadoresMatch.home_team_name === teamName ? nextLibertadoresMatch.away_team_logo : nextLibertadoresMatch.home_team_logo
                )}
                opponentPosition=""
                round={nextLibertadoresMatch.round <= 4 && PRE_LIBERTADORES_TEAMS.includes(teamName) && !libertadoresId
                  ? `Pré-Lib Fase ${nextLibertadoresMatch.round <= 2 ? 1 : 2} - ${nextLibertadoresMatch.round % 2 === 1 ? "Ida" : "Volta"}`
                  : `Libertadores - ${nextLibertadoresMatch.round}ª Rodada`}
                userForm={[]}
                opponentForm={[]}
                isHome={nextLibertadoresMatch.home_team_name === teamName}
                championshipId={nextLibertadoresChampionshipId || undefined}
                onSimulated={handleSimulated}
              />
            </div>
          )}

          {/* Match Section - Brasileirão */}
          {!showLibMatch && nextMatch && (
            <div className="container mx-auto px-4 py-8">
              <h3 className="text-sm font-bold text-white/60 mb-3">
                Sábado • Brasileirão - {nextMatch.round}ª Rodada
              </h3>
              <MatchCard
                userTeam={teamName}
                userLogo={getTeamLogo(teamName, selectedTeam?.logo || "")}
                userPosition={userPositionStr}
                opponentTeam={opponentName}
                opponentLogo={getTeamLogo(opponentName, opponentLogo)}
                opponentPosition={opponentPositionStr}
                round={`${nextMatch.round}ª Rodada`}
                userForm={userForm}
                opponentForm={opponentForm}
                isHome={isHome}
                onSimulated={handleSimulated}
              />
            </div>
          )}

          {/* Tactics Manager Section */}
          <div className="container mx-auto px-4 pb-12 pt-8 space-y-6">
            <TacticsManager
              teamName={teamName}
              players={orderedStarters}
              onStarterClick={handleStarterClick}
              canSubstitute={!!selectedReserve}
              selectedStarterId={selectedStarter?.id}
              allPlayers={players}
              onPlayersChanged={(updated) => { setPlayers(updated); saveTeamRosterPlayers(teamName, updated); }}
            />

            <div className="bg-zinc-900 rounded-lg p-4">
              {/* Tabs */}
              <div className="flex mb-4 bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => setRosterTab('reserves')}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${
                    rosterTab === 'reserves' ? 'bg-[#c8ff00] text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Reservas ({reserves.length})
                </button>
                <button
                  onClick={() => setRosterTab('unlisted')}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${
                    rosterTab === 'unlisted' ? 'bg-[#c8ff00] text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Não Relacionados ({unlisted.length})
                </button>
              </div>

              {rosterTab === 'reserves' && (
                <>
                  <p className="text-xs text-zinc-400 mb-3">Clique para selecionar e trocar com um titular.</p>
                  <div className="space-y-2">
                    {reserves.map((player) => {
                      const energy = player.energy ?? 100;
                      const energyColor = energy >= 80 ? 'hsl(142 70% 50%)' : energy >= 60 ? 'hsl(45 100% 50%)' : 'hsl(0 80% 55%)';
                      const isSuspended = (player.suspensionMatches || 0) > 0;
                      const isSelected = selectedReserve?.id === player.id;
                      return (
                        <div key={player.id} className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleReserveClick(player)}
                            className={`flex-1 flex items-center justify-between p-3 rounded-lg transition-colors ${
                              isSelected
                                ? "bg-[#c8ff00] text-black"
                                : isSuspended
                                ? "bg-red-900/30 text-white/50 border border-red-500/40"
                                : "bg-zinc-800 text-white hover:bg-zinc-700"
                            }`}
                            style={isSuspended ? { opacity: 0.6 } : {}}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`font-bold text-lg w-8 ${isSelected ? 'text-black' : isSuspended ? 'text-red-400' : 'text-blue-800'}`}>{player.overall}</span>
                              <div className="text-left">
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-medium ${isSuspended ? 'line-through' : ''}`}>{player.name}</span>
                                  {isSuspended && (
                                    <span className="text-[9px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded font-bold">SUSPENSO</span>
                                  )}
                                </div>
                                <span className="text-sm opacity-70">{player.position}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5" style={{ color: isSelected ? 'black' : energyColor }} />
                              <span className="text-[12px] font-bold" style={{ color: isSelected ? 'black' : energyColor }}>{energy}%</span>
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (reserves.length <= 7) {
                                toast.error("Mínimo de 7 reservas!");
                                return;
                              }
                              const updatedPlayers = players.map((p) =>
                                p.id === player.id ? { ...p, isListed: false } : p
                              );
                              updatePlayers(updatedPlayers);
                              toast.success(`${player.name} movido para Não Relacionados`);
                            }}
                            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors shrink-0"
                            title="Mover para Não Relacionados"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                    {reserves.length === 0 && (
                      <p className="text-zinc-500 text-xs text-center py-2">Nenhum reserva</p>
                    )}
                  </div>
                  {selectedReserve && (
                    <p className="mt-3 text-xs text-[#c8ff00]">
                      Selecione um titular no campo para substituir.
                    </p>
                  )}
                </>
              )}

              {rosterTab === 'unlisted' && (
                <>
                  <p className="text-xs text-zinc-400 mb-3">Jogadores fora da lista de relacionados para a partida.</p>
                  <div className="space-y-2">
                    {unlisted.map((player) => {
                      const energy = player.energy ?? 100;
                      const energyColor = energy >= 80 ? 'hsl(142 70% 50%)' : energy >= 60 ? 'hsl(45 100% 50%)' : 'hsl(0 80% 55%)';
                      const isSuspended = (player.suspensionMatches || 0) > 0;
                      const isSelected = selectedReserve?.id === player.id;
                      return (
                        <div key={player.id} className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleReserveClick(player)}
                            className={`flex-1 flex items-center justify-between p-3 rounded-lg transition-colors ${
                              isSelected
                                ? "bg-[#c8ff00] text-black"
                                : isSuspended
                                ? "bg-red-900/20 text-white/40 border border-red-500/30"
                                : "bg-zinc-800/50 text-white/60 hover:bg-zinc-700/60"
                            }`}
                            style={isSuspended ? { opacity: 0.5 } : {}}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`font-bold text-lg w-8 ${isSelected ? 'text-black' : isSuspended ? 'text-red-400/60' : 'text-zinc-500'}`}>{player.overall}</span>
                              <div className="text-left">
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-medium ${isSuspended ? 'line-through' : ''}`}>{player.name}</span>
                                  {isSuspended && (
                                    <span className="text-[9px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded font-bold">SUSPENSO ({player.suspensionMatches})</span>
                                  )}
                                </div>
                                <span className="text-sm opacity-70">{player.position}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5" style={{ color: isSelected ? 'black' : energyColor }} />
                              <span className="text-[12px] font-bold" style={{ color: isSelected ? 'black' : energyColor }}>{energy}%</span>
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (reserves.length >= 10) {
                                toast.error("Máximo de 10 reservas!");
                                return;
                              }
                              if ((player.suspensionMatches || 0) > 0) {
                                toast.error("Jogador suspenso! Não pode ir para Reservas.");
                                return;
                              }
                              const updatedPlayers = players.map((p) =>
                                p.id === player.id ? { ...p, isListed: true } : p
                              );
                              updatePlayers(updatedPlayers);
                              toast.success(`${player.name} movido para Reservas`);
                            }}
                            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-[#c8ff00] transition-colors shrink-0"
                            title="Mover para Reservas"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                    {unlisted.length === 0 && (
                      <p className="text-zinc-500 text-xs text-center py-2">Nenhum jogador não relacionado</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Page 1: Gerenciar Elenco */}
        <div className="relative w-screen h-full overflow-y-auto overflow-x-hidden">
          <SquadManager
            players={players}
            onClose={() => swipe.goToPage(0)}
            onSquadChange={(updatedPlayers) => updatePlayers(updatedPlayers)}
            onSellPlayer={handleSellPlayer}
            userTeamName={teamName}
            budget={budget}
            onOfferSent={refreshOffersCount}
            onBudgetChanged={(newBudget) => setBudget(newBudget)}
          />
        </div>
      </div>

      {/* Player Value Modal - only on main page */}
      {selectedPlayerForValue && swipe.currentPage === 0 && (
        <PlayerValueModal
          player={selectedPlayerForValue}
          onClose={() => setSelectedPlayerForValue(null)}
          canSell={true}
          onSell={handleSellPlayer}
        />
      )}

      {/* Transfer Market */}
      {showTransferMarket && (
        <TransferMarket
          budget={budget}
          userTeamName={teamName}
          onClose={() => setShowTransferMarket(false)}
          onOpenOffers={() => setShowReceivedOffers(true)}
          onOfferSent={refreshOffersCount}
          onBudgetChanged={(newBudget) => setBudget(newBudget)}
        />
      )}

      {/* Received Offers */}
      {showReceivedOffers && (
        <ReceivedOffersModal
          teamName={teamName}
          onClose={() => setShowReceivedOffers(false)}
          onAccepted={handleOfferAccepted}
          onBudgetChanged={(newBudget) => setBudget(newBudget)}
        />
      )}

      {/* Finances Modal */}
      {showFinances && (
        <FinancesModal
          budget={budget}
          totalSales={totalSales}
          totalPurchases={totalPurchases}
          onClose={() => setShowFinances(false)}
          onInvest={handleInvest}
          hasActiveInvestment={hasActiveInvestment}
        />
      )}
    </div>
  );
};

export default Game;