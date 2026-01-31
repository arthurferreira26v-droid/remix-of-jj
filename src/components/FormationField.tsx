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
}: FormationFieldProps) => {
  return (
    <div className="relative w-full aspect-[3/4] bg-red-700 rounded-lg overflow-hidden border-4 border-yellow-400">
      
      {/* TEXTO TESTE */}
      <div className="absolute top-2 left-2 text-white text-xl font-bold z-50">
        TESTE FORMATION FIELD
      </div>

      {/* CAMPO SVG */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Linha do meio */}
        <line x1="0" y1="50" x2="100" y2="50" stroke="white" strokeWidth="1" />

        {/* Círculo central */}
        <circle cx="50" cy="50" r="9" fill="none" stroke="white" strokeWidth="1" />
        <circle cx="50" cy="50" r="1" fill="white" />

        {/* Área superior */}
        <rect x="25" y="2" width="50" height="16" fill="none" stroke="white" strokeWidth="1" />
        <rect x="35" y="2" width="30" height="8" fill="none" stroke="white" strokeWidth="1" />

        {/* Área inferior */}
        <rect x="25" y="82" width="50" height="16" fill="none" stroke="white" strokeWidth="1" />
        <rect x="35" y="90" width="30" height="8" fill="none" stroke="white" strokeWidth="1" />
      </svg>
    </div>
  );
};







    





