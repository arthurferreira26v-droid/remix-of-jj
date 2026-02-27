import { Player } from "@/data/players";
import { Formation } from "@/data/formations";

interface FormationFieldProps {
  formation: Formation;
  players: Player[];
  orderedPlayers?: (Player | null)[];
  onPlayerClick?: (player: Player) => void;
  canSubstitute?: boolean;
  selectedPlayerId?: string;
}

export const FormationField = ({
  formation,
  players,
  orderedPlayers,
  onPlayerClick,
  canSubstitute = false,
  selectedPlayerId,
}: FormationFieldProps) => {
  // Use orderedPlayers if provided, otherwise compute assignments
  const assignedPlayers = (() => {
    if (orderedPlayers && orderedPlayers.length === formation.positions.length) {
      return orderedPlayers;
    }

    const available = [...players];
    const assignments: (Player | null)[] = new Array(formation.positions.length).fill(null);

    // Pass 1: primary position
    for (let i = 0; i < formation.positions.length; i++) {
      const role = formation.positions[i].role;
      const idx = available.findIndex(p => p.position === role);
      if (idx !== -1) {
        assignments[i] = available[idx];
        available.splice(idx, 1);
      }
    }

    // Pass 2: alt positions
    for (let i = 0; i < formation.positions.length; i++) {
      if (assignments[i]) continue;
      const role = formation.positions[i].role;
      const idx = available.findIndex(p => p.altPositions?.includes(role));
      if (idx !== -1) {
        assignments[i] = available[idx];
        available.splice(idx, 1);
      }
    }

    // Pass 3: fill remaining
    for (let i = 0; i < formation.positions.length; i++) {
      if (assignments[i]) continue;
      if (available.length > 0) {
        assignments[i] = available.shift()!;
      }
    }

    return assignments;
  })();

  return (
    <div className="relative w-full aspect-[3/4] bg-gradient-to-b from-green-800 to-green-900 rounded-lg overflow-hidden border-2 border-white/20">

      {/* 🔥 CAMPO DE FUTEBOL (SVG) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="white" strokeWidth="2" />
        <circle cx="50%" cy="50%" r="60" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="50%" cy="50%" r="4" fill="white" />
        <rect x="25%" y="2%" width="50%" height="18%" fill="none" stroke="white" strokeWidth="2" />
        <rect x="35%" y="2%" width="30%" height="10%" fill="none" stroke="white" strokeWidth="2" />
        <rect x="25%" y="80%" width="50%" height="18%" fill="none" stroke="white" strokeWidth="2" />
        <rect x="35%" y="88%" width="30%" height="10%" fill="none" stroke="white" strokeWidth="2" />
      </svg>

      {/* ⚽ JOGADORES */}
      {formation.positions.map((pos, index) => {
        const player = assignedPlayers[index];
        if (!player) return null;

        const playerPositions = player.position.split("|");
        const altPositions = player.altPositions || [];
        const allValidPositions = [...playerPositions, ...altPositions];
        const isInPosition = allValidPositions.includes(pos.role);
        const isSelected = player.id === selectedPlayerId;

        return (
          <div
            key={`${player.id}-${index}`}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 ${
              onPlayerClick ? "cursor-pointer" : ""
            } ${isSelected ? "scale-110 z-10" : ""}`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
            onClick={onPlayerClick ? () => onPlayerClick(player) : undefined}
          >
          <div className="relative">
              <div className={`w-10 h-10 border-2 rounded-full flex items-center justify-center shadow-lg ${
                isSelected 
                  ? "bg-[#c8ff00] border-[#c8ff00]" 
                  : "bg-black/90 border-white/80"
              }`}>
                <span className={`text-sm font-bold ${isSelected ? "text-black" : "text-white"}`}>{player.overall}</span>
              </div>

              {!isInPosition && (
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center shadow-md border border-white">
                  <span className="text-black text-[9px] font-bold">!</span>
                </div>
              )}
            </div>

            <div className="bg-black/70 px-1.5 py-0.5 rounded text-white text-[8px] font-medium whitespace-nowrap">
              {player.name}
            </div>
            <div className={`px-1.5 py-0 rounded text-[7px] font-bold whitespace-nowrap ${
              isInPosition ? 'bg-white/20 text-white/80' : 'bg-yellow-500/30 text-yellow-300'
            }`}>
              {pos.role}
            </div>
          </div>
        );
      })}
    </div>
  );
};
