import { Player } from "@/data/players";
import { Formation } from "@/data/formations";

interface FormationFieldProps {
  formation: Formation;
  players: Player[];
  onPlayerClick?: (player: Player) => void;
  canSubstitute?: boolean;
}

export const FormationField = ({
  formation,
  players,
  onPlayerClick,
  canSubstitute = false,
}: FormationFieldProps) => {
  const usedPlayers = new Set<string>();

  const getPlayerForPosition = (): Player | null => {
    const player = players.find(p => !usedPlayers.has(p.id));
    if (player) {
      usedPlayers.add(player.id);
      return player;
    }
    return null;
  };

  return (
    <div className="relative w-full aspect-[3/4] bg-gradient-to-b from-green-800 to-green-900 rounded-lg overflow-hidden border-2 border-white/20">

      {/* 🔥 CAMPO DE FUTEBOL (SVG) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-40"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Linha do meio */}
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="white" strokeWidth="2" />

        {/* Círculo central */}
        <circle cx="50%" cy="50%" r="60" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="50%" cy="50%" r="4" fill="white" />

        {/* Área superior */}
        <rect x="25%" y="2%" width="50%" height="18%" fill="none" stroke="white" strokeWidth="2" />
        <rect x="35%" y="2%" width="30%" height="10%" fill="none" stroke="white" strokeWidth="2" />

        {/* Área inferior */}
        <rect x="25%" y="80%" width="50%" height="18%" fill="none" stroke="white" strokeWidth="2" />
        <rect x="35%" y="88%" width="30%" height="10%" fill="none" stroke="white" strokeWidth="2" />
      </svg>

      {/* ⚽ JOGADORES */}
      {formation.positions.map((pos, index) => {
        const player = getPlayerForPosition();
        if (!player) return null;

        return (
          <div
            key={`${player.id}-${index}`}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 ${
              onPlayerClick ? "cursor-pointer" : ""
            }`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
            onClick={onPlayerClick ? () => onPlayerClick(player) : undefined}
          >
            <div className="w-10 h-10 bg-black border-2 border-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-xs font-bold">{player.number}</span>
            </div>

            <div className="bg-black/70 px-2 py-0.5 rounded text-white text-[10px] font-medium whitespace-nowrap">
              {player.name}
            </div>
          </div>
        );
      })}
    </div>
  );
};









