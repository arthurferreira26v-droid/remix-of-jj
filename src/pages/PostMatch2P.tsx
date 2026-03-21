import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { teams } from "@/data/teams";
import { getTeamLogo } from "@/utils/teamLogos";

interface PostMatchData {
  teamName: string;
  opponentName: string;
  homeScore: number;
  awayScore: number;
  matchEvents: Array<{
    minute: number;
    type: 'goal' | 'yellow_card' | 'red_card' | 'penalty' | 'penalty_missed' | 'substitution';
    team: 'home' | 'away';
    playerName: string;
    substituteOut?: string;
  }>;
}

const getEventIcon = (type: string) => {
  switch (type) {
    case 'goal': case 'penalty': return '⚽';
    case 'penalty_missed': return '🔴';
    case 'yellow_card': return '🟨';
    case 'red_card': return '🟥';
    case 'substitution': return '🔄';
    default: return '';
  }
};

const getEventText = (event: PostMatchData['matchEvents'][0]) => {
  if (event.type === 'substitution') return `${event.playerName} → ${event.substituteOut || ''}`;
  return event.playerName;
};

const PostMatch2P = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const player1Team = searchParams.get("time") || "";
  const player2Team = searchParams.get("time2") || "";
  const [showingPlayer, setShowingPlayer] = useState(1);

  const p1Data: PostMatchData | null = (() => {
    try { return JSON.parse(localStorage.getItem('2p_postmatch_p1') || 'null'); } catch { return null; }
  })();
  const p2Data: PostMatchData | null = (() => {
    try { return JSON.parse(localStorage.getItem('2p_postmatch_p2') || 'null'); } catch { return null; }
  })();

  const currentData = showingPlayer === 1 ? p1Data : p2Data;

  if (!currentData) {
    navigate(`/jogo?time=${encodeURIComponent(player1Team)}&time2=${encodeURIComponent(player2Team)}&modo=2p`);
    return null;
  }

  const opponentTeam = teams.find(t => t.name === currentData.opponentName);
  const userTeam = teams.find(t => t.name === currentData.teamName);
  const opponentLogo = getTeamLogo(currentData.opponentName, opponentTeam?.logo || "");
  const userLogo = getTeamLogo(currentData.teamName, userTeam?.logo || "");

  const handleContinue = () => {
    if (showingPlayer === 1) {
      setShowingPlayer(2);
    } else {
      localStorage.removeItem('2p_postmatch_p1');
      localStorage.removeItem('2p_postmatch_p2');
      navigate(`/jogo?time=${encodeURIComponent(player1Team)}&time2=${encodeURIComponent(player2Team)}&modo=2p`);
    }
  };

  const { homeScore, awayScore } = currentData;
  const userWon = awayScore > homeScore;
  const userLost = homeScore > awayScore;

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
      {/* Player indicator */}
      <div className="bg-zinc-950 py-2 text-center">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
          Jogador {showingPlayer} — {currentData.teamName}
        </span>
      </div>

      {/* Score header */}
      <div className="bg-zinc-900 py-6 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <img src={opponentLogo} alt={currentData.opponentName} className="w-12 h-12 object-contain" />
            <span className="text-4xl font-bold text-white">{homeScore}</span>
          </div>
          <div className="flex items-center justify-center">
            {userWon ? (
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl">✓</span>
              </div>
            ) : userLost ? (
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
            <img src={userLogo} alt={currentData.teamName} className="w-12 h-12 object-contain" />
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="px-4 py-6 max-w-md mx-auto space-y-3 pb-28">
        {currentData.matchEvents.slice().reverse().map((event, index) => {
          const teamLogo = event.team === 'home' ? opponentLogo : userLogo;
          return (
            <div key={index} className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3">
              <span className="text-sm text-zinc-500 font-medium min-w-[30px]">{event.minute}'</span>
              <span className="text-lg">{getEventIcon(event.type)}</span>
              <img src={teamLogo} alt="" className="w-6 h-6 object-contain" />
              <span className="text-white text-sm font-medium truncate">{getEventText(event)}</span>
            </div>
          );
        })}
        {currentData.matchEvents.length === 0 && (
          <div className="text-center py-8">
            <span className="text-zinc-500">Nenhum evento na partida</span>
          </div>
        )}
      </div>

      {/* Continue button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-2 bg-gradient-to-t from-black via-black to-transparent">
        <button
          onClick={handleContinue}
          className="w-full max-w-md mx-auto block bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 px-6 rounded-xl transition-colors text-lg"
        >
          CONTINUAR
        </button>
      </div>
    </div>
  );
};

export default PostMatch2P;
