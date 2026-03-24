import { useState, useEffect } from "react";
import { FormationField } from "@/components/FormationField";
import { formations, playStyles, gameStyles, SavedFormation } from "@/data/formations";
import { Player } from "@/data/players";
import { ChevronDown, Save, FolderOpen, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { optimizeStartersForFormation } from "@/utils/formationOptimizer";

interface TacticsManagerProps {
  teamName: string;
  players?: Player[];
  orderedPlayers?: (Player | null)[];
  onStarterClick?: (player: Player) => void;
  canSubstitute?: boolean;
  selectedStarterId?: string;
  allPlayers?: Player[];
  onPlayersChanged?: (players: Player[]) => void;
  hideSavedFormations?: boolean;
}

export const TacticsManager = ({ teamName, players = [], orderedPlayers, onStarterClick, canSubstitute = false, selectedStarterId, allPlayers, onPlayersChanged, hideSavedFormations = false }: TacticsManagerProps) => {
  const getInitialFormation = () => {
    const saved = localStorage.getItem(`tactics_formation_${teamName}`);
    return saved || "4-3-3";
  };

  const getInitialPlayStyle = () => {
    const saved = localStorage.getItem(`tactics_playstyle_${teamName}`);
    return saved || "counter";
  };

  const getInitialGameStyle = () => {
    const saved = localStorage.getItem(`tactics_gamestyle_${teamName}`);
    return saved || "through_middle";
  };

  const [selectedFormation, setSelectedFormation] = useState(getInitialFormation);
  const [selectedPlayStyle, setSelectedPlayStyle] = useState(getInitialPlayStyle);
  const [selectedGameStyle, setSelectedGameStyle] = useState(getInitialGameStyle);
  const [openDropdown, setOpenDropdown] = useState<"style" | "formation" | "gamestyle" | "saved" | null>(null);
  const [savedFormations, setSavedFormations] = useState<SavedFormation[]>([]);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveName, setSaveName] = useState("");

  const formation = formations.find((f) => f.id === selectedFormation) || formations[0];
  const playStyle = playStyles.find((s) => s.id === selectedPlayStyle) || playStyles[0];
  const gameStyle = gameStyles.find((s) => s.id === selectedGameStyle) || gameStyles[0];

  // Load saved formations
  useEffect(() => {
    const saved = localStorage.getItem(`saved_formations_${teamName}`);
    if (saved) setSavedFormations(JSON.parse(saved));
  }, [teamName]);

  useEffect(() => {
    localStorage.setItem(`tactics_formation_${teamName}`, selectedFormation);
  }, [selectedFormation, teamName]);

  useEffect(() => {
    localStorage.setItem(`tactics_playstyle_${teamName}`, selectedPlayStyle);
  }, [selectedPlayStyle, teamName]);

  useEffect(() => {
    localStorage.setItem(`tactics_gamestyle_${teamName}`, selectedGameStyle);
  }, [selectedGameStyle, teamName]);

  const toggleDropdown = (dropdown: "style" | "formation" | "gamestyle" | "saved") => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleSaveFormation = () => {
    if (!saveName.trim()) {
      toast.error("Digite um nome para a formação");
      return;
    }

    const starters = (allPlayers || []).filter(p => p.isStarter);
    const savedOrderRaw = localStorage.getItem(`starter_order_${teamName}`);
    const starterOrder = savedOrderRaw ? JSON.parse(savedOrderRaw) : starters.map(p => p.id);

    const newSaved: SavedFormation = {
      name: saveName.trim(),
      formationId: selectedFormation,
      playStyleId: selectedPlayStyle,
      gameStyleId: selectedGameStyle,
      starterIds: starters.map(p => p.id),
      starterOrder,
    };

    const updated = [...savedFormations, newSaved];
    setSavedFormations(updated);
    localStorage.setItem(`saved_formations_${teamName}`, JSON.stringify(updated));
    setShowSaveInput(false);
    setSaveName("");
    toast.success(`Formação "${newSaved.name}" salva!`);
  };

  const handleLoadFormation = (saved: SavedFormation) => {
    const all = allPlayers || [];
    if (all.length === 0) {
      toast.error("Jogadores não disponíveis");
      return;
    }

    // Update formation, play style, game style
    setSelectedFormation(saved.formationId);
    setSelectedPlayStyle(saved.playStyleId);
    setSelectedGameStyle(saved.gameStyleId);

    // Update starters: set saved starters as isStarter, rest as reserves
    const starterSet = new Set(saved.starterIds);
    const updatedPlayers = all.map(p => ({
      ...p,
      isStarter: starterSet.has(p.id),
    }));

    // Save starter order
    localStorage.setItem(`starter_order_${teamName}`, JSON.stringify(saved.starterOrder));
    localStorage.setItem(`players_${teamName}`, JSON.stringify(updatedPlayers));

    if (onPlayersChanged) {
      onPlayersChanged(updatedPlayers);
    }

    setOpenDropdown(null);
    toast.success(`Formação "${saved.name}" carregada!`);
  };

  const handleDeleteFormation = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedFormations.filter((_, i) => i !== index);
    setSavedFormations(updated);
    localStorage.setItem(`saved_formations_${teamName}`, JSON.stringify(updated));
    toast.success("Formação removida");
  };

  return (
    <div className="bg-black px-2 py-4 md:px-6">
      <FormationField
        formation={formation}
        players={players}
        orderedPlayers={orderedPlayers || (players.length === formation.positions.length ? players : undefined)}
        onPlayerClick={onStarterClick}
        canSubstitute={canSubstitute}
        selectedPlayerId={selectedStarterId}
      />

      {/* Row 1: Tática + Formação */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        {/* Estilo de Jogo (Tática) */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("style")}
            className="w-full bg-white text-black rounded-lg px-4 py-3 flex items-center justify-between font-medium hover:bg-white/90 transition-colors"
          >
            <span className="text-sm truncate">{playStyle.name}</span>
            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openDropdown === "style" ? "rotate-180" : ""}`} />
          </button>
          
          {openDropdown === "style" && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 rounded-xl overflow-hidden shadow-xl z-50 border border-zinc-700">
              {playStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => { setSelectedPlayStyle(style.id); setOpenDropdown(null); }}
                  className={`w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-b-0 ${
                    selectedPlayStyle === style.id ? "bg-[#c8ff00]/10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold text-sm ${selectedPlayStyle === style.id ? "text-[#c8ff00]" : "text-white"}`}>
                      {style.name}
                    </span>
                    {selectedPlayStyle === style.id && <div className="w-2 h-2 rounded-full bg-[#c8ff00]" />}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{style.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Formação */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("formation")}
            className="w-full bg-white text-black rounded-lg px-4 py-3 flex items-center justify-between font-medium hover:bg-white/90 transition-colors"
          >
            <span className="text-sm">{formation.name}</span>
            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openDropdown === "formation" ? "rotate-180" : ""}`} />
          </button>
          
          {openDropdown === "formation" && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 rounded-xl overflow-hidden shadow-xl z-50 border border-zinc-700 max-h-64 overflow-y-auto">
              {formations.map((form) => (
                <button
                  key={form.id}
                  onClick={() => { setSelectedFormation(form.id); setOpenDropdown(null); }}
                  className={`w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-b-0 ${
                    selectedFormation === form.id ? "bg-[#c8ff00]/10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold text-sm ${selectedFormation === form.id ? "text-[#c8ff00]" : "text-white"}`}>
                      {form.name}
                    </span>
                    {selectedFormation === form.id && <div className="w-2 h-2 rounded-full bg-[#c8ff00]" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Estilo de Jogo (Meio/Laterais) + Formações Salvas */}
      <div className={`grid ${hideSavedFormations ? 'grid-cols-1' : 'grid-cols-2'} gap-3 mt-3`}>
        {/* Estilo de Jogo (Meio/Laterais) */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("gamestyle")}
            className="w-full bg-white text-black rounded-lg px-4 py-3 flex items-center justify-between font-medium hover:bg-white/90 transition-colors"
          >
            <span className="text-sm truncate">{gameStyle.name}</span>
            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openDropdown === "gamestyle" ? "rotate-180" : ""}`} />
          </button>
          
          {openDropdown === "gamestyle" && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 rounded-xl overflow-hidden shadow-xl z-50 border border-zinc-700">
              {gameStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => { setSelectedGameStyle(style.id); setOpenDropdown(null); }}
                  className={`w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-b-0 ${
                    selectedGameStyle === style.id ? "bg-[#c8ff00]/10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold text-sm ${selectedGameStyle === style.id ? "text-[#c8ff00]" : "text-white"}`}>
                      {style.name}
                    </span>
                    {selectedGameStyle === style.id && <div className="w-2 h-2 rounded-full bg-[#c8ff00]" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Formações Salvas - only on main screen */}
        {!hideSavedFormations && (<div className="relative">
          <button
            onClick={() => toggleDropdown("saved")}
            className="w-full bg-white text-black rounded-lg px-4 py-3 flex items-center justify-between font-medium hover:bg-white/90 transition-colors"
          >
            <span className="text-sm truncate">Formações</span>
            <FolderOpen className="w-4 h-4 shrink-0" />
          </button>
          
          {openDropdown === "saved" && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 rounded-xl overflow-hidden shadow-xl z-50 border border-zinc-700 max-h-72 overflow-y-auto">
              {/* Save current */}
              {!showSaveInput ? (
                <button
                  onClick={() => setShowSaveInput(true)}
                  className="w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-[#c8ff00]" />
                  <span className="text-[#c8ff00] font-semibold text-sm">Salvar formação atual</span>
                </button>
              ) : (
                <div className="px-4 py-3 border-b border-zinc-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="Nome da formação..."
                      className="flex-1 bg-zinc-800 text-white text-sm px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-[#c8ff00]"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFormation(); }}
                    />
                    <button onClick={handleSaveFormation} className="bg-[#c8ff00] text-black p-2 rounded-lg">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setShowSaveInput(false); setSaveName(""); }} className="text-zinc-400 p-2">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Saved list */}
              {savedFormations.length === 0 && (
                <div className="px-4 py-4 text-center text-zinc-500 text-xs">
                  Nenhuma formação salva
                </div>
              )}
              {savedFormations.map((saved, index) => {
                const form = formations.find(f => f.id === saved.formationId);
                return (
                  <button
                    key={index}
                    onClick={() => handleLoadFormation(saved)}
                    className="w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-b-0 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-white font-semibold text-sm">{saved.name}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{form?.name || saved.formationId}</p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteFormation(index, e)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </button>
                );
              })}
            </div>
          )}
        </div>)}
      </div>
    </div>
  );
};
