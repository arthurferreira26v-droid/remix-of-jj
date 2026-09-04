import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getTeamLogo } from "@/utils/teamLogos";
import { MatchResult } from "@/hooks/useTeamForm";
import { instantaneo } from "@/config/gameSettings";
import { toast } from "sonner";
import { getSuspendedStarters } from "@/utils/cardSystem";
import { getTeamRosterPlayers, saveTeamRosterPlayers } from "@/utils/teamRoster";

interface MatchCardProps {
  userTeam: string;
  userLogo: string;
  userPosition: string;
  opponentTeam: string;
  opponentLogo: string;
  opponentPosition: string;
  round: string;
  userForm: MatchResult[];
  opponentForm: MatchResult[];
  isHome: boolean;
  championshipId?: string;
  mode2p?: boolean;
  onPlay2P?: () => void;
  turn2PLabel?: string;
  onSimulated?: () => void;
}

export const MatchCard = ({
  userTeam,
  userLogo,
  userPosition,
  opponentTeam,
  opponentLogo,
  opponentPosition,
  round,
  userForm,
  opponentForm,
  isHome,
  championshipId,
  mode2p,
  onPlay2P,
  turn2PLabel,
  onSimulated,
}: MatchCardProps) => {
  const navigate = useNavigate();
  const [isSimulating, setIsSimulating] = useState(false);

  const handlePlayMatch = () => {
    const savedPlayers = localStorage.getItem(`players_${userTeam}`);
    if (savedPlayers) {
      const players = JSON.parse(savedPlayers);
      // Check suspended starters
      const suspended = getSuspendedStarters(players);
      if (suspended.length > 0) {
        const names = suspended.map((p: any) => p.name).join(', ');
        toast.error(`Jogador(es) suspenso(s): ${names}. Mova para Não relacionados!`);
        return;
      }
      // Check suspended players in reserves (isListed !== false and not starter)
      const suspendedReserves = players.filter((p: any) => !p.isStarter && p.isListed !== false && (p.suspensionMatches || 0) > 0);
      if (suspendedReserves.length > 0) {
        const names = suspendedReserves.map((p: any) => p.name).join(', ');
        toast.error(`Jogador(es) suspenso(s) nos reservas: ${names}. Mova para Não relacionados!`);
        return;
      }
      localStorage.setItem('match_players', savedPlayers);
    }
    let url = `/partida?time=${userTeam}&adversario=${opponentTeam}`;
    if (championshipId) {
      url += `&campeonatoId=${championshipId}`;
    }
    navigate(url);
  };

  const handleSimulateMatch = async () => {
    if (isSimulating) return;
    setIsSimulating(true);

    try {
      const {
        getNextUserMatch,
        saveMatchResultLocal,
        flushPendingWrites,
        getLocalBudget,
        saveLocalBudget,
      } = await import("@/utils/localChampionship");
      const nextMatch = getNextUserMatch(userTeam);
      if (!nextMatch) {
        toast.error("Partida não encontrada");
        setIsSimulating(false);
        return;
      }

      // Load players for simulation
      const userPlayers = getTeamRosterPlayers(userTeam);
      const userStarters = userPlayers.filter((p: any) => p.isStarter);

      const oppPlayers = getTeamRosterPlayers(opponentTeam);
      const oppStarters = oppPlayers.filter((p: any) => p.isStarter);

      // Calculate result based on OVR difference
      const userAvg = userStarters.length > 0
        ? userStarters.reduce((s: number, p: any) => s + p.overall, 0) / userStarters.length : 75;
      const oppAvg = oppStarters.length > 0
        ? oppStarters.reduce((s: number, p: any) => s + p.overall, 0) / oppStarters.length : 75;

      const diff = userAvg - oppAvg;
      const userGoalBase = 1.2 + diff * 0.03;
      const oppGoalBase = 1.2 - diff * 0.03;

      const userScore = Math.max(0, Math.round(userGoalBase + (Math.random() - 0.4) * 2));
      const oppScore = Math.max(0, Math.round(oppGoalBase + (Math.random() - 0.4) * 2));

      // Map to home/away based on match data
      const userIsHome = nextMatch.home_team_name === userTeam;
      const dbHomeScore = userIsHome ? userScore : oppScore;
      const dbAwayScore = userIsHome ? oppScore : userScore;

      saveMatchResultLocal(userTeam, nextMatch.id, dbHomeScore, dbAwayScore);

      // Investment earnings
      const hasInvestment = localStorage.getItem(`investment_${userTeam}`) === 'true';
      if (hasInvestment) {
        const currentBudget = getLocalBudget(userTeam);
        saveLocalBudget(userTeam, currentBudget + 200000);
      }

      // Energy update
      if (userPlayers.length > 0) {
        const { finalizeMatchEnergy } = await import("@/utils/energySystem");
        const { finalizeCardsAfterMatch } = await import("@/utils/cardSystem");
        const withMatchEnergy = userPlayers.map((p: any) => ({
          ...p,
          matchEnergy: p.isStarter ? Math.max(0, (p.energy ?? 100) - (Math.floor(Math.random() * 20) + 30)) : p.energy,
        }));
        const withEnergy = finalizeMatchEnergy(withMatchEnergy);
        const withCards = finalizeCardsAfterMatch(withEnergy);
        saveTeamRosterPlayers(userTeam, withCards);
      }

      flushPendingWrites();

      toast.success(`${userTeam} ${userScore} x ${oppScore} ${opponentTeam}`);
      setIsSimulating(false);
      onSimulated?.();
    } catch (error) {
      console.error("Erro ao simular:", error);
      toast.error("Erro ao simular partida");
      setIsSimulating(false);
    }
  };

  // Define which team goes on left and right based on home/away
  const leftTeam = isHome ? userTeam : opponentTeam;
  const leftLogo = isHome ? userLogo : opponentLogo;
  const leftPosition = isHome ? userPosition : opponentPosition;
  const leftForm = isHome ? userForm : opponentForm;
  
  const rightTeam = isHome ? opponentTeam : userTeam;
  const rightLogo = isHome ? opponentLogo : userLogo;
  const rightPosition = isHome ? opponentPosition : userPosition;
  const rightForm = isHome ? opponentForm : userForm;

  return (
    <Card className="bg-[#111113] border-zinc-800/80 rounded-2xl p-5 sm:p-7 max-w-2xl mx-auto">
      <div className="text-center mb-5">
        <p className="text-[11px] sm:text-xs font-semibold text-white/50 mb-1">{round}</p>
        <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
          {leftTeam.toUpperCase()} VS {rightTeam.toUpperCase()}
        </h2>
      </div>

      <div className="flex justify-center mb-3">
        <span
          className={`text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full ${
            isHome ? "bg-green-500/15 text-green-400" : "bg-blue-500/15 text-blue-400"
          }`}
        >
          {isHome ? "CASA" : "FORA"}
        </span>
      </div>

      <div className="flex items-center justify-center gap-8 sm:gap-14 mb-7">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center p-3">
          <img src={getTeamLogo(leftTeam, leftLogo)} alt={leftTeam} className="w-full h-full object-contain" />
        </div>

        <Swords className="w-6 h-6 sm:w-7 sm:h-7 text-white/70" strokeWidth={2} />

        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center p-3">
          <img src={getTeamLogo(rightTeam, rightLogo)} alt={rightTeam} className="w-full h-full object-contain" />
        </div>
      </div>

      <Button
        onClick={mode2p && onPlay2P ? onPlay2P : handlePlayMatch}
        className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-white hover:bg-white/90 text-black rounded-xl"
      >
        {mode2p && turn2PLabel ? turn2PLabel : "JOGAR"}
      </Button>

      {instantaneo && (
        <Button
          onClick={handleSimulateMatch}
          disabled={isSimulating}
          className="w-full h-10 sm:h-12 text-sm sm:text-base font-bold bg-[#c8ff00] hover:bg-[#b8ef00] text-black rounded-xl mt-2"
        >
          {isSimulating ? "SIMULANDO..." : "SIMULAR AGORA"}
        </Button>
      )}
    </Card>
  );
};

