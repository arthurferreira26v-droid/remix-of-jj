import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getTeamLogo } from "@/utils/teamLogos";
import { MatchResult } from "@/hooks/useTeamForm";

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
}: MatchCardProps) => {
  const navigate = useNavigate();

  const handlePlayMatch = () => {
    // Salvar jogadores no localStorage antes de navegar
    const savedPlayers = localStorage.getItem(`players_${userTeam}`);
    if (savedPlayers) {
      localStorage.setItem('match_players', savedPlayers);
    }
    let url = `/partida?time=${userTeam}&adversario=${opponentTeam}`;
    if (championshipId) {
      url += `&campeonatoId=${championshipId}`;
    }
    navigate(url);
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
    <Card className="bg-[#050B2B] border-[#0a1540] p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="text-center mb-4 sm:mb-6">
        <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">{round}</p>
        <h2 className="text-lg sm:text-2xl font-bold text-foreground">
          {leftTeam.toUpperCase()} VS {rightTeam.toUpperCase()}
        </h2>
      </div>

      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-2">
        {/* Left Team */}
        <div className="flex flex-col items-center gap-2 sm:gap-3 flex-1">
          <div className="relative">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-secondary rounded-full flex items-center justify-center p-2 sm:p-4">
              <img src={getTeamLogo(leftTeam, leftLogo)} alt={leftTeam} className="w-full h-full object-contain" />
            </div>
            <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-card rounded-full px-2 py-0.5 sm:px-3 sm:py-1 border-2 border-border">
              <span className="text-xs sm:text-sm font-bold">{leftPosition}</span>
            </div>
          </div>
          <div className="flex gap-0.5 sm:gap-1">
            {leftForm.map((result, i) => (
              <div 
                key={i} 
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${
                  result === 'V'
                    ? 'bg-green-600 text-white' 
                    : result === 'E'
                    ? 'bg-yellow-600 text-white'
                    : result === 'D'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700/50 text-gray-500'
                }`}
              >
                {result === 'V' ? '✓' : result === 'E' ? '−' : result === 'D' ? 'X' : ''}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 sm:gap-2 px-2">
          <span className={`text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${
            isHome 
              ? 'bg-green-600/20 text-green-400' 
              : 'bg-blue-600/20 text-blue-400'
          }`}>
            {isHome ? 'CASA' : 'FORA'}
          </span>
          <div className="text-2xl sm:text-4xl font-bold text-muted-foreground">VS</div>
        </div>

        {/* Right Team */}
        <div className="flex flex-col items-center gap-2 sm:gap-3 flex-1">
          <div className="relative">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-secondary rounded-full flex items-center justify-center p-2 sm:p-4">
              <img src={getTeamLogo(rightTeam, rightLogo)} alt={rightTeam} className="w-full h-full object-contain" />
            </div>
            <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-card rounded-full px-2 py-0.5 sm:px-3 sm:py-1 border-2 border-border">
              <span className="text-xs sm:text-sm font-bold">{rightPosition}</span>
            </div>
          </div>
          <div className="flex gap-0.5 sm:gap-1">
            {rightForm.map((result, i) => (
              <div 
                key={i} 
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${
                  result === 'V'
                    ? 'bg-green-600 text-white' 
                    : result === 'E'
                    ? 'bg-yellow-600 text-white'
                    : result === 'D'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700/50 text-gray-500'
                }`}
              >
                {result === 'V' ? '✓' : result === 'E' ? '−' : result === 'D' ? 'X' : ''}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button 
        onClick={handlePlayMatch}
        className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-white hover:bg-white/90 text-black rounded-xl"
      >
        JOGAR
      </Button>
    </Card>
  );
};
