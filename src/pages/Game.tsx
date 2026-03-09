import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { GameMenu } from "@/components/GameMenu";
import { MatchCard } from "@/components/MatchCard";
import { TacticsManager } from "@/components/TacticsManager";
import { SquadManager } from "@/components/SquadManager";
import { TeamBudget } from "@/components/TeamBudget";
import { PlayerValueModal } from "@/components/PlayerValueModal";
import { TransferMarket } from "@/components/TransferMarket";
import { FinancesModal } from "@/components/FinancesModal";

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
import { getLocalStandings, deleteLocalChampionship } from "@/utils/localChampionship";
import { calculateMarketValue, formatMarketValue } from "@/utils/marketValue";
import { fetchAdminPlayers, fetchAdminLogos } from "@/hooks/useAdminData";
import { optimizeStartersDefault } from "@/utils/formationOptimizer";
import { toast } from "sonner";

const Game = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamName = searchParams.get("time") || "Seu Time";

  useEffect(() => { document.title = `${teamName} - Painel | Gerenciador`; }, [teamName]);

  const [showSquadManager, setShowSquadManager] = useState(false);
  const [showTransferMarket, setShowTransferMarket] = useState(false);
  const [showFinances, setShowFinances] = useState(false);
  const [totalSales, setTotalSales] = useState(0);
  const [hasActiveInvestment, setHasActiveInvestment] = useState(() => {
    return localStorage.getItem(`investment_${teamName}`) === 'true';
  });
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [selectedPlayerForValue, setSelectedPlayerForValue] = useState<Player | null>(null);
  
  
  // Initialize players state - always prefer localStorage (preserves energy state)
  const getInitialPlayers = () => {
    const savedPlayers = localStorage.getItem(`players_${teamName}`);
    
    if (savedPlayers) {
      return JSON.parse(savedPlayers);
    }
    
    const raw = generateTeamPlayers(teamName);
    
    // Optimize starters to fit the default formation (4-3-3)
    const { players: optimized, starterOrder } = optimizeStartersDefault(raw);
    localStorage.setItem(`players_${teamName}`, JSON.stringify(optimized));
    localStorage.setItem(`starter_order_${teamName}`, JSON.stringify(starterOrder));
    return optimized;
  };
  const [players, setPlayers] = useState<Player[]>(getInitialPlayers);

  // Load admin overrides from DB (only if no existing player data in localStorage)
  useEffect(() => {
    const savedPlayers = localStorage.getItem(`players_${teamName}`);
    if (savedPlayers) return; // don't override existing player data (preserves energy)

    (async () => {
      const [adminPlayers] = await Promise.all([fetchAdminPlayers(true), fetchAdminLogos()]);
      const team = teams.find(t => t.name === teamName);
      const teamId = team?.id ?? teamName;
      if (adminPlayers[teamId]) {
        setPlayers(adminPlayers[teamId]);
        localStorage.setItem(`players_${teamName}`, JSON.stringify(adminPlayers[teamId]));
      }
    })();
  }, [teamName]);

  // Atualizar jogadores (NÃO salva automaticamente - apenas via save explícito)
  const updatePlayers = (updatedPlayers: Player[]) => {
    setPlayers(updatedPlayers);
    // Salvar no localStorage apenas para manter estado durante a sessão
    // Será limpo ao escolher novo time se não vier de um save
    localStorage.setItem(`players_${teamName}`, JSON.stringify(updatedPlayers));
  };

  // Find the selected team
  const selectedTeam = teams.find(t => t.name === teamName);
  
  // Get championship data
  const { championship, nextMatch, loading, isChampionComplete, userWonChampionship, resetChampionship } = useChampionship(teamName);
  
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

  const [selectedReserve, setSelectedReserve] = useState<Player | null>(null);
  const [selectedStarter, setSelectedStarter] = useState<Player | null>(null);

  const starters = players.filter((p) => p.isStarter);
  const reserves = players.filter((p) => !p.isStarter);

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
    // Se tiver um titular selecionado, troca titular <-> reserva
    if (selectedStarter) {
      const updatedPlayers = players.map((p) => {
        if (p.id === selectedStarter.id) return { ...p, isStarter: false };
        if (p.id === player.id) return { ...p, isStarter: true };
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

    if (selectedReserve?.id === player.id) {
      setSelectedReserve(null);
    } else {
      setSelectedReserve(player);
    }
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
    const wasStarter = player.isStarter;
    const soldPosition = player.position;
    
    // Remove o jogador da lista
    let updatedPlayers = players.filter(p => p.id !== player.id);
    
    // Se era titular, promove um reserva da mesma posição automaticamente
    if (wasStarter) {
      const reserveReplacement = updatedPlayers.find(p => !p.isStarter && p.position === soldPosition);
      if (reserveReplacement) {
        updatedPlayers = updatedPlayers.map(p => 
          p.id === reserveReplacement.id ? { ...p, isStarter: true } : p
        );
        toast.success(`${reserveReplacement.name} promovido a titular!`);
      }
    }
    
    updatePlayers(updatedPlayers);
    setBudget(budget + sellValue);
    setTotalSales(prev => prev + sellValue);
    setSelectedPlayerForValue(null);
    toast.success(`${player.name} vendido por ${formatMarketValue(sellValue)}!`);
  };

  const handleBuyPlayer = (player: Player, price: number) => {
    // Adiciona o jogador como reserva
    const newPlayer: Player = {
      ...player,
      id: `bought-${Date.now()}`,
      isStarter: false,
    };
    updatePlayers([...players, newPlayer]);
    setBudget(budget - price);
    setTotalPurchases(prev => prev + price);
    toast.success(`${player.name} contratado por ${formatMarketValue(price)}!`);
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
    <div className="min-h-screen bg-black">
      {/* Header fixo com info do time e menu */}
      <header className="border-b border-[#1a2c4a] bg-black fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Time selecionado - esquerda */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center p-1.5">
              <img src={selectedTeam?.logo} alt={teamName} className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">{teamName}</span>
              <span className="text-xs text-green-400 font-medium">$ {(budget / 1000000).toFixed(1)} M</span>
            </div>
          </div>

          {/* Loja - direita */}
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
        onManageSquad={() => setShowSquadManager(true)} 
        onTransferMarket={() => setShowTransferMarket(true)}
        onFinances={() => setShowFinances(true)}
        onExit={() => {
          deleteLocalChampionship(teamName);
          localStorage.removeItem(`players_${teamName}`);
          localStorage.removeItem(`starter_order_${teamName}`);
          localStorage.removeItem(`investment_${teamName}`);
          localStorage.removeItem(`lib_championship_${teamName}`);
          localStorage.removeItem(`lib_matches_${teamName}`);
          localStorage.removeItem(`lib_standings_${teamName}`);
          localStorage.removeItem(`lib_prelib_teams`);
          navigate("/");
        }}
      />

      {/* Spacer para compensar o header fixo */}
      <div className="h-16" />

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
        />

        <div className="bg-zinc-900 rounded-lg p-4">
          <h3 className="text-white text-xl font-bold mb-4">Reservas</h3>
          <p className="text-xs text-zinc-400 mb-3">Clique para selecionar e trocar com um titular.</p>
          <div className="space-y-2">
            {reserves.map((player) => {
              const energy = player.energy ?? 100;
              const energyColor = energy >= 80 ? 'hsl(142 70% 50%)' : energy >= 60 ? 'hsl(45 100% 50%)' : 'hsl(0 80% 55%)';
              return (
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
                    <span className={`font-bold text-lg w-8 ${selectedReserve?.id === player.id ? 'text-black' : 'text-blue-800'}`}>{player.overall}</span>
                    <div className="text-left">
                      <div className="font-medium">{player.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm opacity-70">{player.position}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" style={{ color: selectedReserve?.id === player.id ? 'black' : energyColor }} />
                    <span className="text-[12px] font-bold" style={{ color: selectedReserve?.id === player.id ? 'black' : energyColor }}>
                      {energy}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedReserve && (
            <p className="mt-3 text-xs text-[#c8ff00]">
              Selecione um titular no campo para substituir.
            </p>
          )}
        </div>
      </div>

      {/* Squad Manager Modal */}
      {showSquadManager && (
        <SquadManager
          players={players}
          onClose={() => setShowSquadManager(false)}
          onSquadChange={(updatedPlayers) => setPlayers(updatedPlayers)}
          onSellPlayer={handleSellPlayer}
        />
      )}

      {/* Player Value Modal */}
      {selectedPlayerForValue && (
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
          onClose={() => setShowTransferMarket(false)}
          onBuyPlayer={handleBuyPlayer}
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