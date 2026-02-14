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
import {
  botafogoPlayers,
  flamengoPlayers,
  generateTeamPlayers,
  type Player,
} from "@/data/players";
import { Loader2 } from "lucide-react";
import { useChampionship } from "@/hooks/useChampionship";
import { useLibertadores } from "@/hooks/useLibertadores";
import { useTeamForm } from "@/hooks/useTeamForm";
import { useTeamBudget } from "@/hooks/useTeamBudget";
import { useAuth } from "@/hooks/useAuth";
import { useCloudSaveLoad, type CloudSaveData } from "@/hooks/useCloudSaveLoad";
import { getTeamLogo } from "@/utils/teamLogos";
import { calculateMarketValue, formatMarketValue } from "@/utils/marketValue";
import { toast } from "sonner";

const Game = () => {
  const { user, loading: authLoading } = useAuth();
  const { loadGame: loadCloudGame } = useCloudSaveLoad();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamName = searchParams.get("time") || "Seu Time";
  const loadSlotParam = searchParams.get("loadSlot");

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
  
  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);
  
  // Initialize players state - gerar novos ou carregar de save
  const getInitialPlayers = () => {
    // Verificar se há jogadores salvos de um save carregado
    const savedPlayers = localStorage.getItem(`players_${teamName}`);
    const isLoadedFromSave = sessionStorage.getItem(`loaded_save_${teamName}`) === 'true';
    
    if (savedPlayers && isLoadedFromSave) {
      return JSON.parse(savedPlayers);
    }
    
    // Sempre gerar novos jogadores se não veio de um save
    return teamName === "Botafogo" 
      ? botafogoPlayers 
      : teamName === "Flamengo"
      ? flamengoPlayers
      : generateTeamPlayers(teamName);
  };
  const [players, setPlayers] = useState<Player[]>(getInitialPlayers);

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
  
  const PRE_LIBERTADORES_TEAMS = ["Botafogo", "Bahia"];
  
  // Libertadores data
  const { 
    nextLibertadoresMatch, 
    nextLibertadoresChampionshipId,
    libertadoresId,
    loading: libertadoresLoading 
  } = useLibertadores(teamName, championship?.id);
  
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
    // Limpar seleção de titular se houver
    setSelectedStarter(null);
    
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

  // Handle loading a save (Cloud)
  const handleLoadComplete = useCallback(
    (save: CloudSaveData) => {
      // Marcar que este jogo veio de um save carregado
      sessionStorage.setItem(`loaded_save_${save.club_name}`, "true");
      
      // Salvar o championship_id para que useChampionship restaure o campeonato correto
      if (save.championship_id) {
        sessionStorage.setItem(`loaded_championship_${save.club_name}`, save.championship_id);
      }

      const loadedPlayers = (save.players as unknown as Player[]) ?? [];
      localStorage.setItem(`players_${save.club_name}`, JSON.stringify(loadedPlayers));
      setPlayers(loadedPlayers);

      setTotalSales(save.total_sales ?? 0);
      setTotalPurchases(save.total_purchases ?? 0);
      setHasActiveInvestment(!!save.has_active_investment);
      localStorage.setItem(
        `investment_${save.club_name}`,
        (!!save.has_active_investment).toString(),
      );

      if (typeof save.budget === "number" && save.budget !== budget) {
        setBudget(save.budget);
      }

      window.location.reload();
    },
    [budget, setBudget],
  );

  // Se veio da tela inicial com loadSlot, carregar o save do slot automaticamente
  useEffect(() => {
    if (!user) return;
    if (!loadSlotParam) return;

    const slot = Number(loadSlotParam);
    if (!Number.isFinite(slot) || slot < 1) return;

    let isActive = true;
    (async () => {
      const data = await loadCloudGame(slot);
      if (!isActive) return;

      if (!data) {
        toast.error("Nenhum save encontrado neste slot");
        return;
      }

      // limpar query param para evitar loop
      navigate(`/jogo?time=${encodeURIComponent(data.club_name)}`, {
        replace: true,
      });

      handleLoadComplete(data);
    })();

    return () => {
      isActive = false;
    };
  }, [user, loadSlotParam, loadCloudGame, navigate, handleLoadComplete]);

  if (loading || userFormLoading || opponentFormLoading || budgetLoading || authLoading || libertadoresLoading) {
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

      {/* Libertadores Match Section */}
      {nextLibertadoresMatch && (
        <div className="container mx-auto px-4 pt-6">
          <h3 className="text-sm font-bold text-[#c8ff00] mb-3">
            {nextLibertadoresChampionshipId && nextLibertadoresMatch.championship_id ? 
              (nextLibertadoresMatch.round <= 4 && PRE_LIBERTADORES_TEAMS.includes(teamName) && !libertadoresId
                ? `Pré-Libertadores - Jogo ${nextLibertadoresMatch.round}/4`
                : `Libertadores - ${nextLibertadoresMatch.round}ª Rodada`) 
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
              ? `Pré-Libertadores - Jogo ${nextLibertadoresMatch.round}`
              : `Libertadores - ${nextLibertadoresMatch.round}ª Rodada`}
            userForm={[]}
            opponentForm={[]}
            isHome={nextLibertadoresMatch.home_team_name === teamName}
            championshipId={nextLibertadoresChampionshipId || undefined}
          />
        </div>
      )}

      {/* Match Section - Brasileirão (only shows when no Libertadores/Pré-Lib match is pending) */}
      {!nextLibertadoresMatch && nextMatch && (
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