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
import { SaveLoadModal } from "@/components/SaveLoadModal";
import { teams } from "@/data/teams";
import { botafogoPlayers, flamengoPlayers, generateTeamPlayers, Player } from "@/data/players";
import { Loader2 } from "lucide-react";
import { useChampionship } from "@/hooks/useChampionship";
import { useTeamForm } from "@/hooks/useTeamForm";
import { useTeamBudget } from "@/hooks/useTeamBudget";
import { useAuth } from "@/hooks/useAuth";
import { useSaveLoad } from "@/hooks/useSaveLoad";
import { getTeamLogo } from "@/utils/teamLogos";
import { calculateMarketValue, formatMarketValue } from "@/utils/marketValue";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GameSaveData } from "@/types/gameState";

const Game = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamName = searchParams.get("time") || "Seu Time";
  const [showSquadManager, setShowSquadManager] = useState(false);
  const [showTransferMarket, setShowTransferMarket] = useState(false);
  const [showFinances, setShowFinances] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [totalSales, setTotalSales] = useState(0);
  const [hasActiveInvestment, setHasActiveInvestment] = useState(() => {
    return localStorage.getItem(`investment_${teamName}`) === 'true';
  });
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [selectedPlayerForValue, setSelectedPlayerForValue] = useState<Player | null>(null);
  
  // Save/Load hook
  const { autoSave } = useSaveLoad();
  
  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);
  
  // Initialize players state - carregar do localStorage se existir
  const getInitialPlayers = () => {
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
  const [players, setPlayers] = useState<Player[]>(getInitialPlayers);

  // Salvar jogadores no localStorage quando mudar
  const updatePlayers = (updatedPlayers: Player[]) => {
    setPlayers(updatedPlayers);
    localStorage.setItem(`players_${teamName}`, JSON.stringify(updatedPlayers));
  };

  // Find the selected team
  const selectedTeam = teams.find(t => t.name === teamName);
  
  // Get championship data
  const { championship, nextMatch, loading, isChampionComplete, userWonChampionship, resetChampionship } = useChampionship(teamName);
  
  // Determine if user is home or away based on match data
  const isHome = nextMatch ? nextMatch.home_team_name === teamName : false;
  const opponentName = nextMatch 
    ? (isHome ? nextMatch.away_team_name : nextMatch.home_team_name)
    : "";
  const opponentLogo = nextMatch
    ? (isHome ? nextMatch.away_team_logo : nextMatch.home_team_logo)
    : "";

  // Buscar os últimos 5 resultados reais de cada time
  const { form: userForm, loading: userFormLoading } = useTeamForm(teamName, championship?.id);
  const { form: opponentForm, loading: opponentFormLoading } = useTeamForm(opponentName, championship?.id);
  
  // Buscar o budget do time
  const { budget, setBudget, loading: budgetLoading } = useTeamBudget(teamName, championship?.id);

  const [selectedReserve, setSelectedReserve] = useState<Player | null>(null);

  const starters = players.filter((p) => p.isStarter);
  const reserves = players.filter((p) => !p.isStarter);

  const handleReserveClick = (player: Player) => {
    if (selectedReserve?.id === player.id) {
      // Se clicar no mesmo jogador, abre o modal de valor
      setSelectedPlayerForValue(player);
      setSelectedReserve(null);
    } else {
      setSelectedReserve(player);
    }
  };

  const handleReserveLongPress = (player: Player) => {
    setSelectedPlayerForValue(player);
  };

  const handleStarterClick = (starter: Player) => {
    if (!selectedReserve) {
      // Se não tiver reserva selecionado, mostra o valor
      setSelectedPlayerForValue(starter);
      return;
    }


    const updatedPlayers = players.map((p) => {
      if (p.id === starter.id) {
        return { ...p, isStarter: false };
      }
      if (p.id === selectedReserve.id) {
        return { ...p, isStarter: true };
      }
      return p;
    });

    updatePlayers(updatedPlayers);
    setSelectedReserve(null);
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

  // Prepare save data for save modal
  const getCurrentGameData = useCallback(() => ({
    clubName: teamName,
    season: '2024',
    budget,
    totalSales,
    totalPurchases,
    hasActiveInvestment,
    players,
    championshipId: championship?.id,
    currentRound: championship?.current_round,
    seasonStats: {
      matchesPlayed: championship?.current_round ? championship.current_round - 1 : 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0
    }
  }), [teamName, budget, totalSales, totalPurchases, hasActiveInvestment, players, championship]);

  // Handle loading a save
  const handleLoadComplete = useCallback((saveData: GameSaveData) => {
    // Update players from save
    const loadedPlayers = saveData.players.map(p => ({
      ...p,
      isStarter: p.status === 'titular'
    }));
    updatePlayers(loadedPlayers);
    
    // Update financial data
    setTotalSales(saveData.totalSales);
    setTotalPurchases(saveData.totalPurchases);
    setHasActiveInvestment(saveData.hasActiveInvestment);
    localStorage.setItem(`investment_${teamName}`, saveData.hasActiveInvestment.toString());
    
    // Update budget in database
    if (saveData.budget !== budget) {
      setBudget(saveData.budget);
    }
    
    toast.success(`Jogo carregado: ${saveData.clubName}`);
  }, [teamName, budget, setBudget, updatePlayers]);

  if (loading || userFormLoading || opponentFormLoading || budgetLoading || authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00]" />
      </div>
    );
  }

  if (!user) {
    return null;
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

  if (!nextMatch && !loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00] mb-4 mx-auto" />
          <p className="text-muted-foreground">Preparando próxima partida...</p>
        </div>
      </div>
    );
  }

  if (!nextMatch) {
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
              <span className="text-xs text-muted-foreground">Jj</span>
            </div>
          </div>

          {/* Menu hamburguer - direita */}
          <GameMenu 
            teamName={teamName} 
            onManageSquad={() => setShowSquadManager(true)} 
            onTransferMarket={() => setShowTransferMarket(true)}
            onFinances={() => setShowFinances(true)}
            onSaveGame={() => setShowSaveModal(true)}
            onLoadGame={() => setShowLoadModal(true)}
          />
        </div>
      </header>

      {/* Spacer para compensar o header fixo */}
      <div className="h-16" />

      {/* Caixa do Time - Fora do header, não acompanha scroll */}
      <TeamBudget budget={budget} />

      {/* Match Section */}
      <div className="container mx-auto px-4 py-8">
        <MatchCard
          userTeam={teamName}
          userLogo={getTeamLogo(teamName, selectedTeam?.logo || "")}
          userPosition="1º"
          opponentTeam={opponentName}
          opponentLogo={getTeamLogo(opponentName, opponentLogo)}
          opponentPosition="8º"
          round={`${nextMatch.round}ª Rodada`}
          userForm={userForm}
          opponentForm={opponentForm}
          isHome={isHome}
        />
      </div>

      {/* Tactics Manager Section */}
      <div className="container mx-auto px-4 pb-12 pt-8 space-y-6">
        <TacticsManager
          teamName={teamName}
          players={starters}
          onStarterClick={handleStarterClick}
          canSubstitute={!!selectedReserve}
        />

        <div className="bg-zinc-900 rounded-lg p-4">
          <h3 className="text-white text-xl font-bold mb-4">Reservas</h3>
          <p className="text-xs text-zinc-400 mb-3">Clique para selecionar. Clique novamente para ver valor de mercado.</p>
          <div className="space-y-2">
            {reserves.map((player) => (
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
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${selectedReserve?.id === player.id ? 'text-black' : 'text-green-400'}`}>
                    {formatMarketValue(calculateMarketValue(player.overall))}
                  </span>
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

      {/* Squad Manager Modal */}
      {showSquadManager && (
        <SquadManager
          players={players}
          onClose={() => setShowSquadManager(false)}
          onSquadChange={(updatedPlayers) => setPlayers(updatedPlayers)}
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

      {/* Save Modal */}
      <SaveLoadModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        mode="save"
        currentGameData={getCurrentGameData()}
      />

      {/* Load Modal */}
      <SaveLoadModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        mode="load"
        onLoadComplete={handleLoadComplete}
      />
    </div>
  );
};

export default Game;