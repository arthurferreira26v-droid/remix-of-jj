import { useState } from "react";
import { Player } from "@/data/players";
import { formations, playStyles } from "@/data/formations";
import { X, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormationField } from "@/components/FormationField";

interface SquadManagerProps {
  players: Player[];
  onClose: () => void;
  onSquadChange: (updatedPlayers: Player[]) => void;
}

export const SquadManager = ({ players, onClose, onSquadChange }: SquadManagerProps) => {
  const [localPlayers, setLocalPlayers] = useState<Player[]>(players);
  const [selectedReserve, setSelectedReserve] = useState<Player | null>(null);
  const [selectedFormation, setSelectedFormation] = useState("4-3-3");
  const [selectedPlayStyle, setSelectedPlayStyle] = useState("counter");
  const [openDropdown, setOpenDropdown] = useState<"style" | "formation" | null>(null);

  const formation = formations.find((f) => f.id === selectedFormation) || formations[0];
  const playStyle = playStyles.find((s) => s.id === selectedPlayStyle) || playStyles[0];

  const starters = localPlayers.filter(p => p.isStarter);
  const reserves = localPlayers.filter(p => !p.isStarter);

  const handleReserveClick = (player: Player) => {
    setSelectedReserve(player);
  };

  const handleStarterClick = (starter: Player) => {
    if (!selectedReserve) return;
    

    // Fazer a troca
    const updatedPlayers = localPlayers.map(p => {
      if (p.id === starter.id) {
        return { ...p, isStarter: false };
      }
      if (p.id === selectedReserve.id) {
        return { ...p, isStarter: true };
      }
      return p;
    });

    setLocalPlayers(updatedPlayers);
    setSelectedReserve(null);
  };

  const handleSave = () => {
    onSquadChange(localPlayers);
    onClose();
  };

  const toggleDropdown = (dropdown: "style" | "formation") => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };



  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-2xl font-bold">Gerenciar Elenco</h2>
          <button onClick={onClose} className="text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Campo com titulares */}
        <div className="w-full max-w-md mx-auto mb-4">
          <FormationField
            formation={formation}
            players={starters}
            onPlayerClick={handleStarterClick}
            canSubstitute={!!selectedReserve}
          />
        </div>

        {/* Dropdowns de Estilo e Formação */}
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-6 px-4">
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
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg overflow-hidden shadow-lg z-50">
                {playStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => {
                      setSelectedPlayStyle(style.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                      selectedPlayStyle === style.id ? "bg-[#c8ff00]" : ""
                    }`}
                  >
                    <div className="font-medium text-black">{style.name}</div>
                    <div className="text-xs text-gray-600">{style.description}</div>
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
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg overflow-hidden shadow-lg z-50">
                {formations.map((form) => (
                  <button
                    key={form.id}
                    onClick={() => {
                      setSelectedFormation(form.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                      selectedFormation === form.id ? "bg-[#c8ff00]" : ""
                    }`}
                  >
                    <div className="font-medium text-black">{form.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reservas */}
        <div className="bg-zinc-900 rounded-lg p-4 max-w-md mx-auto">
          <h3 className="text-white text-xl font-bold mb-4">Reservas</h3>
          <div className="space-y-2">
            {reserves.map(player => (
              <button
                key={player.id}
                onClick={() => handleReserveClick(player)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  selectedReserve?.id === player.id 
                    ? 'bg-[#c8ff00] text-black' 
                    : 'bg-zinc-800 text-white hover:bg-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">{player.number}</span>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{player.name}</span>
                      {player.ovrChange && player.ovrChange > 0 && (
                        <span className="flex items-center text-green-400 text-xs font-bold">
                          <TrendingUp className="w-3 h-3 mr-0.5" />
                          +{player.ovrChange}
                        </span>
                      )}
                      {player.ovrChange && player.ovrChange < 0 && (
                        <span className="flex items-center text-red-400 text-xs font-bold">
                          <TrendingDown className="w-3 h-3 mr-0.5" />
                          {player.ovrChange}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm opacity-70">
                      <span>{player.position}</span>
                      <span className="text-xs">• {player.age} anos</span>
                      {player.age < 24 && (
                        <span className="text-green-400 text-xs">↑</span>
                      )}
                      {player.age > 30 && (
                        <span className="text-red-400 text-xs">↓</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${
                    player.ovrChange && player.ovrChange > 0 ? 'text-green-400' : 
                    player.ovrChange && player.ovrChange < 0 ? 'text-red-400' : ''
                  }`}>
                    {player.overall}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Instruções */}
        {selectedReserve && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#c8ff00] text-black px-6 py-3 rounded-lg font-medium">
            Clique no titular para substituir
          </div>
        )}

        {/* Botão Salvar */}
        <div className="max-w-md mx-auto mt-6">
          <Button onClick={handleSave} className="w-full bg-[#c8ff00] text-black hover:bg-[#b3e600] font-bold">
            Salvar Escalação
          </Button>
        </div>
      </div>
    </div>
  );
};
