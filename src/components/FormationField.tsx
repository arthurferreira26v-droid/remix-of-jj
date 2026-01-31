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

  // Verifica se o jogador está fora de posição
  const isOutOfPosition = (player: Player, role: string): boolean => {
    // Goleiro só no gol
    if (role === "GOL") {
      return player.position !== "GOL";
    }

    if (player.position === "GOL") {
      return true;
    }

    const playerPositions = player.position.split("|");

    // Se o jogador TEM a posição, está OK
    return !playerPositions.includes(role);
  };

  // Escolhe jogador para a posição
  const getPlayerForPosition = (role: string): Player | null => {
    // 1️⃣ prioridade: jogador com a posição exata
    let player = players.find(
      (p) =>
        !usedPlayers.has(p.id) &&
        p.position.split("|").includes(role)
    );

    if (player) {
      usedPlayers.add(player.id);
      return player;
    }

    // 2️⃣ qualquer jogador de linha (menos GOL)
    player = players.find(
      (p) => !usedPlayers.has(p.id) && p.position !== "GOL"
    );

    if (player) {
      usedPlayers.add(player.id);
      return player;
    }

    return null;
  };

  // 🔒 Define a escalação ANTES do render
  const lineup: (Player | null)[] = [];
  formation.positions.forEach((pos) => {
    lineup.push(getPlayerForPosition(pos.role));
  });

  return (
    <div className="relative w-full aspect-[3/4] bg-gradient-to-b from-green-800 to-green-900 rounded-lg overflow-hidden border-2 border-white/20">
      
      {/* CAMPO DE FUTEBOL */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30"
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

      {/* JOGADORES */}
      {formation.positions.map((pos, index) => {
        const player = lineup[index];
        if (!player) return null;

        const outOfPosition = isOutOfPosition(player, pos.role);
        const playerPositionsLabel = player.position.replace(/\|/g, " / ");

       return (
  <div className="relative w-full aspect-[3/4] bg-green-700 rounded-lg overflow-hidden border-2 border-white/30">

    {/* LINHA CENTRAL */}
    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/40" />

    {/* CÍRCULO CENTRAL */}
    <div className="absolute top-1/2 left-1/2 w-28 h-28 border-2 border-white/40 rounded-full -translate-x-1/2 -translate-y-1/2" />
    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />

    {/* ÁREA SUPERIOR */}
    <div className="absolute top-2 left-1/4 w-1/2 h-[18%] border-2 border-white/40" />
    <div className="absolute top-2 left-[35%] w-[30%] h-[10%] border-2 border-white/40" />

    {/* ÁREA INFERIOR */}
    <div className="absolute bottom-2 left-1/4 w-1/2 h-[18%] border-2 border-white/40" />
    <div className="absolute bottom-2 left-[35%] w-[30%] h-[10%] border-2 border-white/40" />

    {/* JOGADORES */}
    {formation.positions.map((pos, index) => {
      const player = lineup[index];
      if (!player) return null;

      const outOfPosition = isOutOfPosition(player, pos.role);
      const playerPositionsLabel = player.position.replace(/\|/g, " / ");

      return (
        <div
          key={`${player.id}-${index}`}
          className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 ${
            onPlayerClick ? "cursor-pointer" : ""
          }`}
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
          }}
          onClick={onPlayerClick ? () => onPlayerClick(player) : undefined}
        >
          <div className="relative">
            <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold z-10">
              {player.overall}
            </div>

            {outOfPosition && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 border border-yellow-600 z-20" />
            )}

            <div className="w-10 h-10 bg-black border-2 border-white rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {player.number}
              </span>
            </div>
          </div>

          <div className="bg-black/70 px-2 py-0.5 rounded text-white text-[10px]">
            {player.name}
          </div>

          <div className="text-[9px] text-white/80">
            {playerPositionsLabel}
          </div>
        </div>
      );
    })}
  </div>
);