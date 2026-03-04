import { Player } from "@/data/players";
import { Formation } from "@/data/formations";
import { PlayerBubble } from "@/components/PlayerBubble";

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
  const assignedPlayers = (() => {
    if (orderedPlayers && orderedPlayers.length === formation.positions.length) {
      return orderedPlayers;
    }

    const available = [...players];
    const assignments: (Player | null)[] = new Array(formation.positions.length).fill(null);

    for (let i = 0; i < formation.positions.length; i++) {
      const role = formation.positions[i].role;
      const idx = available.findIndex(p => p.position === role);
      if (idx !== -1) {
        assignments[i] = available[idx];
        available.splice(idx, 1);
      }
    }

    for (let i = 0; i < formation.positions.length; i++) {
      if (assignments[i]) continue;
      const role = formation.positions[i].role;
      const idx = available.findIndex(p => p.altPositions?.includes(role));
      if (idx !== -1) {
        assignments[i] = available[idx];
        available.splice(idx, 1);
      }
    }

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
      <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="white" strokeWidth="2" />
        <circle cx="50%" cy="50%" r="60" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="50%" cy="50%" r="4" fill="white" />
        <rect x="25%" y="2%" width="50%" height="18%" fill="none" stroke="white" strokeWidth="2" />
        <rect x="35%" y="2%" width="30%" height="10%" fill="none" stroke="white" strokeWidth="2" />
        <rect x="25%" y="80%" width="50%" height="18%" fill="none" stroke="white" strokeWidth="2" />
        <rect x="35%" y="88%" width="30%" height="10%" fill="none" stroke="white" strokeWidth="2" />
      </svg>

      {formation.positions.map((pos, index) => {
        const player = assignedPlayers[index];
        if (!player) return null;

        const allValid = [player.position, ...(player.altPositions || [])];
        const isInPosition = allValid.includes(pos.role);

        return (
          <div
            key={`${player.id}-${index}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <PlayerBubble
              player={player}
              variant="field"
              isSelected={player.id === selectedPlayerId}
              isInPosition={isInPosition}
              role={pos.role}
              onClick={onPlayerClick ? () => onPlayerClick(player) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
};
