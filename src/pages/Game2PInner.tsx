import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GameMenu } from "@/components/GameMenu";
import { MatchCard } from "@/components/MatchCard";
import { TacticsManager } from "@/components/TacticsManager";
import { SquadManager } from "@/components/SquadManager";
import { PlayerValueModal } from "@/components/PlayerValueModal";
import { TransferMarket } from "@/components/TransferMarket";
import { ReceivedOffersModal } from "@/components/ReceivedOffersModal";
import { FinancesModal } from "@/components/FinancesModal";
import { processCpuOffers, countPendingOffers, generateCpuOffers } from "@/utils/transferOffers";
import { teams } from "@/data/teams";
import { generateTeamPlayers, type Player } from "@/data/players";
import { Loader2, Zap, ShoppingCart, Users } from "lucide-react";
import { useChampionship } from "@/hooks/useChampionship";
import { useTeamForm } from "@/hooks/useTeamForm";
import { useTeamBudget } from "@/hooks/useTeamBudget";
import { getTeamLogo } from "@/utils/teamLogos";
import { getLocalStandings } from "@/utils/localChampionship";
import { calculateMarketValue, formatMarketValue } from "@/utils/marketValue";
import { fetchAdminPlayers, fetchAdminLogos } from "@/hooks/useAdminData";
import { optimizeStartersDefault } from "@/utils/formationOptimizer";
import { toast } from "sonner";
import { useSwipePages } from "@/hooks/useSwipePages";
import { getSuspendedStarters } from "@/utils/cardSystem";

interface Game2PInnerProps {
  activeTeam: string;
  currentTurn: number;
  onPlay: (opponentName: string) => void;
  onExit: () => void;
  turnLabel: string;
}

const Game2PInner = ({ activeTeam, currentTurn, onPlay, onExit, turnLabel }: Game2PInnerProps) => {
  const navigate = useNavigate();

  useEffect(() => { document.title = `Jogador ${currentTurn} - ${activeTeam} | Campanha 2P`; }, [currentTurn, activeTeam]);

  const [showTransferMarket, setShowTransferMarket] = useState(false);
  const [showReceivedOffers, setShowReceivedOffers] = useState(false);
  const [showFinances, setShowFinances] = useState(false);
  const [offersCount, setOffersCount] = useState(0);
  const [adminSquadReady, setAdminSquadReady] = useState(false);

  useEffect(() => {
    if (!adminSquadReady) return;
    const params = new URLSearchParams(window.location.search);
    const team2 = params.get("time2") || "";
    const humanTeams = [activeTeam, team2].filter(Boolean);
    const brazilianTeams = teams.filter(t => t.league === "brasileiro").map(t => t.name);
    processCpuOffers(humanTeams);
    generateCpuOffers([activeTeam], brazilianTeams);
    setOffersCount(countPendingOffers(activeTeam));
  }, [activeTeam, adminSquadReady]);

  const refreshOffersCount = () => setOffersCount(countPendingOffers(activeTeam));
  const [totalSales, setTotalSales] = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [hasActiveInvestment, setHasActiveInvestment] = useState(() =>
    localStorage.getItem(`investment_${activeTeam}`) === 'true'
  );
  const [selectedPlayerForValue, setSelectedPlayerForValue] = useState<Player | null>(null);
  const swipe = useSwipePages({ threshold: 0.3 });

  const getInitialPlayers = () => {
    const saved = localStorage.getItem(`players_${activeTeam}`);
    if (saved) return JSON.parse(saved);
    const raw = generateTeamPlayers(activeTeam);
    const { players: optimized, starterOrder } = optimizeStartersDefault(raw);
    localStorage.setItem(`players_${activeTeam}`, JSON.stringify(optimized));
    localStorage.setItem(`starter_order_${activeTeam}`, JSON.stringify(starterOrder));
    return optimized;
  };

  const [players, setPlayers] = useState<Player[]>(getInitialPlayers);

  useEffect(() => {
    let active = true;
    setAdminSquadReady(false);

    (async () => {
      const [adminPlayers] = await Promise.all([fetchAdminPlayers(true), fetchAdminLogos()]);
      if (!active) return;

      const team = teams.find(t => t.name === activeTeam);
      const teamId = team?.id ?? activeTeam;
      if (adminPlayers[teamId]?.length > 0) {
        setPlayers(prev => {
          const merged = adminPlayers[teamId].map((adminP: any) => {
            const existing = prev.find(p => p.id === adminP.id);
            if (existing) return { ...adminP, isStarter: existing.isStarter, energy: existing.energy, matchEnergy: existing.matchEnergy, consecutiveMatches: existing.consecutiveMatches, seasonStarterMatches: existing.seasonStarterMatches, seasonBenchMatches: existing.seasonBenchMatches, ovrChange: existing.ovrChange, accumulatedYellows: existing.accumulatedYellows, suspensionMatches: existing.suspensionMatches, matchYellowCards: 0, matchRedCard: false };
            return { ...adminP, energy: adminP.energy ?? 100, consecutiveMatches: 0 };
          });
          // Preservar jogadores transferidos de outros times (excluir genéricos)
          const adminIds = new Set(adminPlayers[teamId].map((p: any) => p.id));
          const teamPrefixLower = teamId.toLowerCase() + '_';
          const teamPrefixName = activeTeam + '_';
          const transferredPlayers = prev.filter(p => 
            !adminIds.has(p.id) && 
            !p.id.toLowerCase().startsWith(teamPrefixLower) &&
            !p.id.startsWith(teamPrefixName)
          );
          const allPlayers = [...merged, ...transferredPlayers];
          const { players: optimized, starterOrder } = optimizeStartersDefault(allPlayers);
          localStorage.setItem(`players_${activeTeam}`, JSON.stringify(optimized));
          localStorage.setItem(`starter_order_${activeTeam}`, JSON.stringify(starterOrder));
          return optimized;
        });
      }

      if (active) setAdminSquadReady(true);
    })();
    return () => { active = false; };
  }, [activeTeam]);

  const updatePlayers = (updatedPlayers: Player[]) => {
    setPlayers(updatedPlayers);
    localStorage.setItem(`players_${activeTeam}`, JSON.stringify(updatedPlayers));
  };

  const selectedTeam = teams.find(t => t.name === activeTeam);
  const { championship, nextMatch, loading, isChampionComplete, userWonChampionship, resetChampionship } = useChampionship(activeTeam);

  const isHome = nextMatch ? nextMatch.home_team_name === activeTeam : false;
  const opponentName = nextMatch ? (isHome ? nextMatch.away_team_name : nextMatch.home_team_name) : "";
  const opponentLogo = nextMatch ? (isHome ? nextMatch.away_team_logo : nextMatch.home_team_logo) : "";

  const standings = getLocalStandings(activeTeam);
  const sortedStandings = [...standings].sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference || b.goals_for - a.goals_for);
  const userStanding = sortedStandings.findIndex(s => s.team_name === activeTeam);
  const opponentStanding = sortedStandings.findIndex(s => s.team_name === opponentName);
  const userPositionStr = userStanding >= 0 ? `${userStanding + 1}º` : "";
  const opponentPositionStr = opponentStanding >= 0 ? `${opponentStanding + 1}º` : "";

  const { form: userForm, loading: userFormLoading } = useTeamForm(activeTeam, championship?.id);
  const { form: opponentForm, loading: opponentFormLoading } = useTeamForm(opponentName, championship?.id);
  const { budget, setBudget, loading: budgetLoading } = useTeamBudget(activeTeam, championship?.id);

  const [selectedReserve, setSelectedReserve] = useState<Player | null>(null);
  const [selectedStarter, setSelectedStarter] = useState<Player | null>(null);

  const starters = players.filter(p => p.isStarter);
  const reserves = players.filter(p => !p.isStarter);

  const getStarterOrder = () => {
    const savedOrder = localStorage.getItem(`starter_order_${activeTeam}`);
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
    localStorage.setItem(`starter_order_${activeTeam}`, JSON.stringify(newOrder.map(p => p.id)));
  };

  const handleReserveClick = (player: Player) => {
    if (selectedStarter) {
      const updatedPlayers = players.map(p => {
        if (p.id === selectedStarter.id) return { ...p, isStarter: false };
        if (p.id === player.id) return { ...p, isStarter: true };
        return p;
      });
      const newOrder = orderedStarters.map(p => p.id === selectedStarter.id ? { ...player, isStarter: true } : p);
      saveStarterOrder(newOrder);
      updatePlayers(updatedPlayers);
      setSelectedStarter(null);
      return;
    }
    setSelectedReserve(selectedReserve?.id === player.id ? null : player);
  };

  const handleStarterClick = (starter: Player) => {
    if (selectedReserve) {
      const updatedPlayers = players.map(p => {
        if (p.id === starter.id) return { ...p, isStarter: false };
        if (p.id === selectedReserve.id) return { ...p, isStarter: true };
        return p;
      });
      const newOrder = orderedStarters.map(p => p.id === starter.id ? { ...selectedReserve, isStarter: true } : p);
      saveStarterOrder(newOrder);
      updatePlayers(updatedPlayers);
      setSelectedReserve(null);
      return;
    }
    if (selectedStarter) {
      if (selectedStarter.id === starter.id) {
        setSelectedPlayerForValue(starter);
        setSelectedStarter(null);
        return;
      }
      const newOrder = orderedStarters.map(p => {
        if (p.id === selectedStarter.id) return starter;
        if (p.id === starter.id) return selectedStarter;
        return p;
      });
      saveStarterOrder(newOrder);
      setSelectedStarter(null);
      setPlayers([...players]);
      return;
    }
    setSelectedStarter(starter);
  };

  const handleSellPlayer = (player: Player) => {
    const sellValue = Math.floor(calculateMarketValue(player.overall) * 0.8);
    const wasStarter = player.isStarter;
    const soldPosition = player.position;
    let updatedPlayers = players.filter(p => p.id !== player.id);
    if (wasStarter) {
      const rep = updatedPlayers.find(p => !p.isStarter && p.position === soldPosition);
      if (rep) {
        updatedPlayers = updatedPlayers.map(p => p.id === rep.id ? { ...p, isStarter: true } : p);
        toast.success(`${rep.name} promovido a titular!`);
      }
    }
    updatePlayers(updatedPlayers);
    setBudget(budget + sellValue);
    setTotalSales(prev => prev + sellValue);
    setSelectedPlayerForValue(null);
    toast.success(`${player.name} vendido por ${formatMarketValue(sellValue)}!`);
  };

  const handleOfferAccepted = () => {
    const saved = localStorage.getItem(`players_${activeTeam}`);
    if (saved) setPlayers(JSON.parse(saved));
    refreshOffersCount();
  };

  const handleInvest = () => {
    if (budget >= 4000000) {
      setBudget(budget - 4000000);
      setHasActiveInvestment(true);
      localStorage.setItem(`investment_${activeTeam}`, 'true');
      toast.success("Investimento realizado!");
    }
  };

  const handlePlayClick = () => {
    const savedPlayers = localStorage.getItem(`players_${activeTeam}`);
    if (savedPlayers) {
      const pl = JSON.parse(savedPlayers);
      const suspended = getSuspendedStarters(pl);
      if (suspended.length > 0) {
        toast.error(`Suspenso(s): ${suspended.map((p: any) => p.name).join(', ')}. Substitua antes!`);
        return;
      }
    }
    onPlay(opponentName);
  };

  if (loading || userFormLoading || opponentFormLoading || budgetLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00]" />
      </div>
    );
  }

  if (isChampionComplete) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center px-4">
          {userWonChampionship ? (
            <>
              <div className="text-8xl mb-4 animate-bounce">🏆</div>
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4">CAMPEÃO!</h1>
              <p className="text-2xl text-white font-bold mb-2">{activeTeam}</p>
            </>
          ) : (
            <h2 className="text-3xl font-bold text-white mb-4">Campeonato Finalizado</h2>
          )}
          <button onClick={resetChampionship} className="bg-white hover:bg-gray-100 text-black font-bold text-xl py-4 px-12 rounded-lg transition-colors">Avançar</button>
        </div>
      </div>
    );
  }

  if (!nextMatch) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center p-1.5">
              <img src={selectedTeam?.logo} alt={activeTeam} className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">{activeTeam}</span>
              <span className="text-xs text-green-400 font-medium">$ {(budget / 1000000).toFixed(1)} M</span>
            </div>
          </div>
          <div className="bg-[#c8ff00] text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Users className="w-3 h-3" />
            Jogador {currentTurn}
          </div>
        </div>
      </header>

      <GameMenu
        teamName={activeTeam}
        onManageSquad={() => swipe.goToPage(1)}
        onTransferMarket={() => setShowTransferMarket(true)}
        onFinances={() => setShowFinances(true)}
        offersCount={offersCount}
        onReceivedOffers={() => setShowReceivedOffers(true)}
        onExit={onExit}
      />

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
        {/* Page 0 */}
        <div className="w-screen h-full overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <h3 className="text-sm font-bold text-white/60 mb-3">
              Sábado • Brasileirão - {nextMatch.round}ª Rodada
            </h3>
            <MatchCard
              userTeam={activeTeam}
              userLogo={getTeamLogo(activeTeam, selectedTeam?.logo || "")}
              userPosition={userPositionStr}
              opponentTeam={opponentName}
              opponentLogo={getTeamLogo(opponentName, opponentLogo)}
              opponentPosition={opponentPositionStr}
              round={`${nextMatch.round}ª Rodada`}
              userForm={userForm}
              opponentForm={opponentForm}
              isHome={isHome}
              mode2p={true}
              onPlay2P={handlePlayClick}
              turn2PLabel={turnLabel}
            />
          </div>

          <div className="container mx-auto px-4 pb-12 pt-8 space-y-6">
            <TacticsManager
              teamName={activeTeam}
              players={orderedStarters}
              onStarterClick={handleStarterClick}
              canSubstitute={!!selectedReserve}
              selectedStarterId={selectedStarter?.id}
              allPlayers={players}
              onPlayersChanged={(updated) => { setPlayers(updated); }}
            />
            <div className="bg-zinc-900 rounded-lg p-4">
              <h3 className="text-white text-xl font-bold mb-4">Reservas</h3>
              <p className="text-xs text-zinc-400 mb-3">Clique para selecionar e trocar com um titular.</p>
              <div className="space-y-2">
                {reserves.map(player => {
                  const energy = player.energy ?? 100;
                  const energyColor = energy >= 80 ? 'hsl(142 70% 50%)' : energy >= 60 ? 'hsl(45 100% 50%)' : 'hsl(0 80% 55%)';
                  return (
                    <button
                      key={player.id}
                      onClick={() => handleReserveClick(player)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        selectedReserve?.id === player.id ? "bg-[#c8ff00] text-black" : "bg-zinc-800 text-white hover:bg-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-lg w-8 ${selectedReserve?.id === player.id ? 'text-black' : 'text-blue-800'}`}>{player.overall}</span>
                        <div className="text-left">
                          <div className="font-medium">{player.name}</div>
                          <span className="text-sm opacity-70">{player.position}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" style={{ color: selectedReserve?.id === player.id ? 'black' : energyColor }} />
                        <span className="text-[12px] font-bold" style={{ color: selectedReserve?.id === player.id ? 'black' : energyColor }}>{energy}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedReserve && <p className="mt-3 text-xs text-[#c8ff00]">Selecione um titular no campo para substituir.</p>}
            </div>
          </div>
        </div>

        {/* Page 1: Squad */}
        <div className="relative w-screen h-full overflow-y-auto overflow-x-hidden">
          <SquadManager
            players={players}
            onClose={() => swipe.goToPage(0)}
            onSquadChange={up => setPlayers(up)}
            onSellPlayer={handleSellPlayer}
          />
        </div>
      </div>

      {selectedPlayerForValue && swipe.currentPage === 0 && (
        <PlayerValueModal player={selectedPlayerForValue} onClose={() => setSelectedPlayerForValue(null)} canSell onSell={handleSellPlayer} />
      )}

      {showTransferMarket && (
        <TransferMarket
          budget={budget}
          userTeamName={activeTeam}
          onClose={() => setShowTransferMarket(false)}
          onOpenOffers={() => setShowReceivedOffers(true)}
          onOfferSent={refreshOffersCount}
          onBudgetChanged={(newBudget) => setBudget(newBudget)}
        />
      )}

      {showReceivedOffers && (
        <ReceivedOffersModal
          teamName={activeTeam}
          onClose={() => setShowReceivedOffers(false)}
          onAccepted={handleOfferAccepted}
          onBudgetChanged={(newBudget) => setBudget(newBudget)}
        />
      )}

      {showFinances && (
        <FinancesModal budget={budget} totalSales={totalSales} totalPurchases={totalPurchases} onClose={() => setShowFinances(false)} onInvest={handleInvest} hasActiveInvestment={hasActiveInvestment} />
      )}
    </div>
  );
};

export default Game2PInner;
