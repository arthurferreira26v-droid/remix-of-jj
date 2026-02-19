import { useState, useEffect } from "react";
import { FormationField } from "@/components/FormationField";
import { formations, playStyles } from "@/data/formations";
import { Player } from "@/data/players";
import { ChevronDown } from "lucide-react";

interface TacticsManagerProps {
  teamName: string;
  players?: Player[];
  orderedPlayers?: (Player | null)[];
  onStarterClick?: (player: Player) => void;
  canSubstitute?: boolean;
  selectedStarterId?: string;
}

export const TacticsManager = ({ teamName, players = [], orderedPlayers, onStarterClick, canSubstitute = false, selectedStarterId }: TacticsManagerProps) => {
  // Carregar táticas do localStorage
  const getInitialFormation = () => {
    const saved = localStorage.getItem(`tactics_formation_${teamName}`);
    return saved || "4-3-3";
  };

  const getInitialPlayStyle = () => {
    const saved = localStorage.getItem(`tactics_playstyle_${teamName}`);
    return saved || "counter";
  };

  const [selectedFormation, setSelectedFormation] = useState(getInitialFormation);
  const [selectedPlayStyle, setSelectedPlayStyle] = useState(getInitialPlayStyle);
  const [openDropdown, setOpenDropdown] = useState<"style" | "formation" | null>(null);

  const formation = formations.find((f) => f.id === selectedFormation) || formations[0];
  const playStyle = playStyles.find((s) => s.id === selectedPlayStyle) || playStyles[0];

  // Salvar táticas no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem(`tactics_formation_${teamName}`, selectedFormation);
  }, [selectedFormation, teamName]);

  useEffect(() => {
    localStorage.setItem(`tactics_playstyle_${teamName}`, selectedPlayStyle);
  }, [selectedPlayStyle, teamName]);

  const toggleDropdown = (dropdown: "style" | "formation") => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  return (
    <div className="bg-black p-4 md:p-6">
      {/* Campo */}
      <FormationField
        formation={formation}
        players={players}
        orderedPlayers={orderedPlayers || (players.length === formation.positions.length ? players : undefined)}
        onPlayerClick={onStarterClick}
        canSubstitute={canSubstitute}
        selectedPlayerId={selectedStarterId}
      />

      {/* Botões de Estilo de Jogo e Tática */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {/* Estilo de Jogo */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("style")}
            className="w-full bg-white text-black rounded-lg px-4 py-3 flex items-center justify-between font-medium hover:bg-white/90 transition-colors"
          >
            <span>{playStyle.name}</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${openDropdown === "style" ? "rotate-180" : ""}`} />
          </button>
          
          {openDropdown === "style" && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 rounded-xl overflow-hidden shadow-xl z-50 border border-zinc-700">
              {playStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    setSelectedPlayStyle(style.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-b-0 ${
                    selectedPlayStyle === style.id ? "bg-[#c8ff00]/10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${selectedPlayStyle === style.id ? "text-[#c8ff00]" : "text-white"}`}>
                      {style.name}
                    </span>
                    {selectedPlayStyle === style.id && (
                      <div className="w-2 h-2 rounded-full bg-[#c8ff00]" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{style.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tática (Formação) */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("formation")}
            className="w-full bg-white text-black rounded-lg px-4 py-3 flex items-center justify-between font-medium hover:bg-white/90 transition-colors"
          >
            <span>{formation.name}</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${openDropdown === "formation" ? "rotate-180" : ""}`} />
          </button>
          
          {openDropdown === "formation" && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 rounded-xl overflow-hidden shadow-xl z-50 border border-zinc-700">
              {formations.map((form) => (
                <button
                  key={form.id}
                  onClick={() => {
                    setSelectedFormation(form.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-b-0 ${
                    selectedFormation === form.id ? "bg-[#c8ff00]/10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${selectedFormation === form.id ? "text-[#c8ff00]" : "text-white"}`}>
                      {form.name}
                    </span>
                    {selectedFormation === form.id && (
                      <div className="w-2 h-2 rounded-full bg-[#c8ff00]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
