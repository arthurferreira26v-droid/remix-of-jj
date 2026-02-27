import { useState, useEffect, useCallback } from "react";
import { Player } from "@/data/players";
import { formations, playStyles, Formation } from "@/data/formations";
import { X, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormationField } from "@/components/FormationField";
import { optimizeStartersForFormation } from "@/utils/formationOptimizer";

interface SquadManagerProps {
  players: Player[];
  onClose: () => void;
  onSquadChange: (updatedPlayers: Player[]) => void;
}

/**
 * Compute slot assignments: maps each formation position index to a player ID.
 * Uses 3-pass algorithm: primary position → alt positions → fill remaining.
 */
const computeSlotAssignments = (starters: Player[], formation: Formation): string[] => {
  const available = [...starters];
  const assignments: string[] = new Array(formation.positions.length).fill("");

  // Pass 1: primary position
  for (let i = 0; i < formation.positions.length; i++) {
    const role = formation.positions[i].role;
    const idx = available.findIndex(p => p.position === role);
    if (idx !== -1) {
      assignments[i] = available[idx].id;
      available.splice(idx, 1);
    }
  }

  // Pass 2: alt positions
  for (let i = 0; i < formation.positions.length; i++) {
    if (assignments[i]) continue;
    const role = formation.positions[i].role;
    const idx = available.findIndex(p => p.altPositions?.includes(role));
    if (idx !== -1) {
      assignments[i] = available[idx].id;
      available.splice(idx, 1);
    }
  }

  // Pass 3: fill remaining
  for (let i = 0; i < formation.positions.length; i++) {
    if (assignments[i]) continue;
    if (available.length > 0) {
      assignments[i] = available.shift()!.id;
    }
  }

  return assignments;
};

/**
 * Ensure exactly N starters match formation size.
 * Promotes reserves or demotes extras as needed.
 */
const ensureStarterCount = (players: Player[], requiredCount: number): Player[] => {
  const starters = players.filter(p => p.isStarter);
  const reserves = players.filter(p => !p.isStarter);

  if (starters.length === requiredCount) return players;

  const updated = [...players];

  if (starters.length < requiredCount) {
    // Promote reserves (highest OVR first)
    const sorted = [...reserves].sort((a, b) => b.overall - a.overall);
    let needed = requiredCount - starters.length;
    for (const r of sorted) {
      if (needed <= 0) break;
      const idx = updated.findIndex(p => p.id === r.id);
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], isStarter: true };
        needed--;
      }
    }
  } else {
    // Demote excess starters (lowest OVR first)
    const sorted = [...starters].sort((a, b) => a.overall - b.overall);
    let excess = starters.length - requiredCount;
    for (const s of sorted) {
      if (excess <= 0) break;
      const idx = updated.findIndex(p => p.id === s.id);
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], isStarter: false };
        excess--;
      }
    }
  }

  return updated;
};

export const SquadManager = ({ players, onClose, onSquadChange }: SquadManagerProps) => {
  const [selectedFormation, setSelectedFormation] = useState("4-3-3");
  const [selectedPlayStyle, setSelectedPlayStyle] = useState("counter");
  const [openDropdown, setOpenDropdown] = useState<"style" | "formation" | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const formation = formations.find((f) => f.id === selectedFormation) || formations[0];
  const playStyle = playStyles.find((s) => s.id === selectedPlayStyle) || playStyles[0];

  // Ensure correct number of starters on init
  const [localPlayers, setLocalPlayers] = useState<Player[]>(() =>
    ensureStarterCount(players, formation.positions.length)
  );

  // Slot assignments: maps formation position index → player ID
  const [slotAssignments, setSlotAssignments] = useState<string[]>(() => {
    const fixed = ensureStarterCount(players, formation.positions.length);
    const starters = fixed.filter(p => p.isStarter);
    return computeSlotAssignments(starters, formation);
  });

  // Recompute when formation changes
  useEffect(() => {
    const { players: optimized, starterOrder } = optimizeStartersForFormation(localPlayers, formation);
    setLocalPlayers(optimized);
    setSlotAssignments(starterOrder);
  }, [selectedFormation]);

  const starters = localPlayers.filter(p => p.isStarter);
  const reserves = localPlayers.filter(p => !p.isStarter);

  // Build ordered players array from slot assignments
  const orderedStarters = slotAssignments.map(id =>
    localPlayers.find(p => p.id === id) || null
  );

  const handlePlayerClick = (player: Player) => {
    if (!selectedPlayer) {
      setSelectedPlayer(player);
      return;
    }

    if (selectedPlayer.id === player.id) {
      setSelectedPlayer(null);
      return;
    }

    const bothStarters = selectedPlayer.isStarter && player.isStarter;
    const bothReserves = !selectedPlayer.isStarter && !player.isStarter;

    if (bothStarters) {
      // Swap their slots in the formation
      const newSlots = [...slotAssignments];
      const idx1 = newSlots.indexOf(selectedPlayer.id);
      const idx2 = newSlots.indexOf(player.id);
      if (idx1 !== -1 && idx2 !== -1) {
        newSlots[idx1] = player.id;
        newSlots[idx2] = selectedPlayer.id;
        setSlotAssignments(newSlots);
      }
    } else if (bothReserves) {
      // Nothing to swap visually, just deselect
    } else {
      // Starter ↔ Reserve swap
      const starterId = selectedPlayer.isStarter ? selectedPlayer.id : player.id;
      const reserveId = selectedPlayer.isStarter ? player.id : selectedPlayer.id;

      // Update isStarter flags
      const updatedPlayers = localPlayers.map(p => {
        if (p.id === starterId) return { ...p, isStarter: false };
        if (p.id === reserveId) return { ...p, isStarter: true };
        return p;
      });
      setLocalPlayers(updatedPlayers);

      // Replace starter with reserve in slot assignments
      const newSlots = slotAssignments.map(id => id === starterId ? reserveId : id);
      setSlotAssignments(newSlots);
    }

    setSelectedPlayer(null);
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
            orderedPlayers={orderedStarters}
            onPlayerClick={handlePlayerClick}
            canSubstitute={!!selectedPlayer}
            selectedPlayerId={selectedPlayer?.id}
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

        {/* Reservas - Modern Dark UI */}
        <div className="rounded-2xl p-4 max-w-md mx-auto relative overflow-hidden" style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(0 0% 14%) 0%, hsl(0 0% 6%) 70%, hsl(0 0% 4%) 100%)'
        }}>
          <h3 className="text-white/90 text-lg font-semibold tracking-wide mb-4 uppercase">Banco de Reservas</h3>
          <div className="space-y-2.5">
            {reserves.map(player => {
              const isElite = player.overall >= 80;
              const isSelected = selectedPlayer?.id === player.id;
              const rarityColor = isElite ? 'hsl(270 100% 65%)' : 'hsl(142 70% 50%)';
              const rarityGlow = isElite ? 'hsl(270 100% 65% / 0.4)' : 'hsl(142 70% 50% / 0.3)';

              return (
                <button
                  key={player.id}
                  onClick={() => handlePlayerClick(player)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    isSelected
                      ? 'scale-[1.02] ring-2 ring-[#c8ff00]'
                      : 'hover:scale-[1.01] hover:brightness-110'
                  }`}
                  style={{
                    background: isSelected
                      ? 'hsl(68 100% 50% / 0.15)'
                      : 'hsl(0 0% 100% / 0.06)',
                    backdropFilter: 'blur(12px)',
                    border: isSelected
                      ? '1px solid hsl(68 100% 50% / 0.5)'
                      : `1px solid ${isElite ? 'hsl(270 100% 65% / 0.25)' : 'hsl(142 70% 50% / 0.2)'}`,
                    boxShadow: isSelected
                      ? '0 0 20px hsl(68 100% 50% / 0.2)'
                      : `0 0 12px ${rarityGlow}`
                  }}
                >
                  {/* OVR com glow */}
                  <div className="relative flex-shrink-0">
                    <span
                      className="font-black text-2xl w-10 text-center block tracking-tight"
                      style={{
                        color: rarityColor,
                        textShadow: `0 0 12px ${rarityGlow}, 0 0 4px ${rarityGlow}`
                      }}
                    >
                      {player.overall}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold text-sm truncate ${isSelected ? 'text-[#c8ff00]' : 'text-white/95'}`}>
                        {player.name}
                      </span>
                      {player.ovrChange && player.ovrChange > 0 && (
                        <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      )}
                      {player.ovrChange && player.ovrChange < 0 && (
                        <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-medium" style={{ color: rarityColor }}>
                        {player.position}
                      </span>
                      <span className="text-white/30 text-[10px]">•</span>
                      <span className="text-white/40 text-[11px]">{player.age} anos</span>
                      {player.age < 24 && (
                        <span className="text-emerald-400 text-[10px]">⚡</span>
                      )}
                    </div>
                  </div>

                  {/* Badge de raridade */}
                  <div
                    className="flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      background: `${rarityColor.replace(')', ' / 0.15)')}`,
                      color: rarityColor,
                      border: `1px solid ${rarityColor.replace(')', ' / 0.3)')}`
                    }}
                  >
                    {isElite ? 'Elite' : 'Bom'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Instruções */}
        {selectedPlayer && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#c8ff00] text-black px-6 py-3 rounded-lg font-medium">
            Clique em outro jogador para trocar
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
