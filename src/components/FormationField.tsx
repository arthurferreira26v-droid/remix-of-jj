import { Player } from "@/data/players";
import { Formation } from "@/data/formations";
import { calculateMarketValue, formatMarketValue } from "@/utils/marketValue";

interface FormationFieldProps {
  formation: Formation;
  players: Player[];
  onPlayerClick?: (player: Player) => void;
  canSubstitute?: boolean;
}

export const FormationField = ({ formation, players, onPlayerClick, canSubstitute = false }: FormationFieldProps) => {
  const usedPlayers = new Set<string>();

  // Mapeia jogadores para posições da formação
  const getPlayerForPosition = (role: string) => {
    // Mapeia os roles da formação para as posições dos jogadores
    const positionMap: { [key: string]: string[] } = {
      GOL: ["GOL"],
      LE: ["LE"],
      LD: ["LD"],
      ZAG: ["ZAG"],
      VOL: ["VOL", "MC"],
      MC: ["MC", "VOL"],
      PE: ["PE", "MC", "PD"],
      PD: ["PD", "MC", "PE"],
      ATA: ["ATA"],
      MD: ["PD", "MC", "PE", "VOL"], // Meio direito pode usar PD, MC, PE ou VOL
      ME: ["PE", "MC", "PD", "VOL"], // Meio esquerdo pode usar PE, MC, PD ou VOL
      ALE: ["LE", "PE"], // Ala esquerdo usa lateral esquerdo ou ponta
      ALD: ["LD", "PD"], // Ala direito usa lateral direito ou ponta
    };

    const positions = positionMap[role] || [role];
    
    // Procura um jogador que ainda não foi usado e que tenha uma das posições válidas
    for (const pos of positions) {
      const player = players.find(p => p.position === pos && !usedPlayers.has(p.id));
      if (player) {
        usedPlayers.add(player.id);
        return player;
      }
    }
    
    return null;
  };

  return (
    <div className="relative w-full aspect-[3/4] bg-gradient-to-b from-green-800 to-green-900 rounded-lg overflow-hidden border-2 border-white/20">
      {/* Campo de futebol - linhas */}
      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        {/* Linha do meio */}
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="white" strokeWidth="2" />
        {/* Círculo central */}
        <circle cx="50%" cy="50%" r="60" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="50%" cy="50%" r="4" fill="white" />
        {/* Área grande de cima */}
        <rect x="25%" y="2%" width="50%" height="18%" fill="none" stroke="white" strokeWidth="2" />
        {/* Área pequena de cima */}
        <rect x="35%" y="2%" width="30%" height="10%" fill="none" stroke="white" strokeWidth="2" />
        {/* Área grande de baixo */}
        <rect x="25%" y="80%" width="50%" height="18%" fill="none" stroke="white" strokeWidth="2" />
        {/* Área pequena de baixo */}
        <rect x="35%" y="88%" width="30%" height="10%" fill="none" stroke="white" strokeWidth="2" />
      </svg>

      {/* Jogadores */}
      {formation.positions.map((pos, index) => {
        const player = getPlayerForPosition(pos.role);
        if (!player) return null;

        return (
          <div
            key={`${player.id}-${index}`}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 ${onPlayerClick ? "cursor-pointer" : ""}`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
            onClick={onPlayerClick ? () => onPlayerClick(player) : undefined}
          >
            {/* Círculo do jogador */}
            <div className="relative">
              <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-[hsl(var(--overall-blue))] flex items-center justify-center text-white text-[10px] font-bold z-10">
                {player.overall}
              </div>
              <div className={`w-10 h-10 bg-black border-2 ${canSubstitute ? 'border-[#c8ff00]' : 'border-white'} rounded-full flex items-center justify-center shadow-lg`}>
                <span className="text-white text-xs font-bold">{player.number}</span>
              </div>
            </div>
            {/* Nome do jogador */}
            <div className="bg-black/70 px-2 py-0.5 rounded text-white text-[10px] font-medium whitespace-nowrap">
              {player.name}
            </div>
          </div>
        );
      })}
    </div>
  );
};
