import { Player } from "@/data/players";
import { Formation } from "@/data/formations";

interface FormationFieldProps {
  formation: Formation;
  players: Player[];
  onPlayerClick?: (player: Player) => void;
  canSubstitute?: boolean;
  selectedPlayerId?: string;
}

export const FormationField = ({
  formation,
  players,
  onPlayerClick,
  canSubstitute = false,
  selectedPlayerId,
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

        // Verifica se jogador está na posição correta
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
            {/* Container do número + OVR + Aviso */}
            <div className="relative">
              {/* Número do jogador - verde se selecionado */}
              <div className={`w-9 h-9 border-2 rounded-full flex items-center justify-center shadow-lg ${
                isSelected 
                  ? "bg-[#c8ff00] border-[#c8ff00]" 
                  : "bg-black border-white"
              }`}>
                <span className={`text-xs font-bold ${isSelected ? "text-black" : "text-white"}`}>{player.number}</span>
              </div>

              {/* OVR azul no canto superior direito */}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow-md border border-white">
                <span className="text-white text-[8px] font-bold">{player.overall}</span>
              </div>

              {/* Aviso amarelo se fora de posição */}
              {!isInPosition && (
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center shadow-md border border-white">
                  <span className="text-black text-[9px] font-bold">!</span>
                </div>
              )}
            </div>

            {/* Posição do jogador */}
            <div className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
              isInPosition ? "bg-black/80 text-white" : "bg-yellow-500/90 text-black"
            }`}>
              {pos.role}
            </div>

            {/* Nome do jogador */}
            <div className="bg-black/60 px-1.5 py-0.5 rounded text-white text-[8px] font-medium whitespace-nowrap">
              {player.name}
            </div>
          </div>
        );
      })}
    </div>
  );
};









