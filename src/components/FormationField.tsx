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

  // Verifica se está fora de posição
  const isOutOfPosition = (player: Player, role: string): boolean => {
    // Goleiro só no gol
    if (role === "GOL") {
      return player.position !== "GOL";
    }

    if (player.position === "GOL") {
      return true;
    }

    const playerPositions = player.position.split("|");

    // Se o jogador TEM a posição, não está fora
    return !playerPositions.includes(role);
  };

  // Escolhe jogador para a posição
  const getPlayerForPosition = (role: string): Player | null => {
    // 1️⃣ Prioridade absoluta: jogador que tenha essa posição
    let player = players.find(
      (p) =>
        !usedPlayers.has(p.id) &&
        p.position.split("|").includes(role)
    );

    if (player) {
      usedPlayers.add(player.id);
      return player;
    }

    // 2️⃣ Jogador de linha em qualquer posição (menos GOL)
    player = players.find(
      (p) => !usedPlayers.has(p.id) && p.position !== "GOL"
    );

    if (player) {
      usedPlayers.add(player.id);
      return player;
    }

    return null;
  };

  // 🔒 Cria a escalação antes do render (evita bugs)
  const lineup: (Player | null)[] = [];

  formation.positions.forEach((pos) => {
    lineup.push(getPlayerForPosition(pos.role));
  });

  return (
    <div className="relative w-full aspect-[3/4] bg-gradient-to-b from-green-800 to-green-900 rounded-lg overflow-hidden border-2 border-white/20">
      {formation.positions.map((pos, index) => {
        const player = lineup[index];
        if (!player) return null;

        const outOfPosition = isOutOfPosition(player, pos.role);
        const playerPositionsLabel = player.position.replace(/\|/g, " / ");

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
            <div className="relative">
              <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-[hsl(var(--overall-blue))] flex items-center justify-center text-white text-[10px] font-bold z-10">
                {player.overall}
              </div>

              {outOfPosition && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 border border-yellow-600 z-20"
                  title="Jogador fora de posição"
                />
              )}

              <div
                className={`w-10 h-10 bg-black border-2 ${
                  canSubstitute ? "border-[#c8ff00]" : "border-white"
                } rounded-full flex items-center justify-center shadow-lg`}
              >
                <span className="text-white text-xs font-bold">
                  {player.number}
                </span>
              </div>
            </div>

            {/* Nome */}
            <div className="bg-black/70 px-2 py-0.5 rounded text-white text-[10px] font-medium whitespace-nowrap">
              {player.name}
            </div>

            {/* POSIÇÕES (LE / ZAG) */}
            <div className="text-[9px] text-white/80">
              {playerPositionsLabel}
            </div>
          </div>
        );
      })}
    </div>
  );
};