import { useState, useEffect } from "react";
import { Player } from "@/data/players";
import { formations, playStyles, Formation } from "@/data/formations";
import { X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormationField } from "@/components/FormationField";
import { PlayerBubble } from "@/components/PlayerBubble";
import { PlayerValueModal } from "@/components/PlayerValueModal";
import { optimizeStartersForFormation } from "@/utils/formationOptimizer";

interface SquadManagerProps {
  players: Player[];
  onClose: () => void;
  onSquadChange: (updatedPlayers: Player[]) => void;
  onSellPlayer?: (player: Player) => void;
}

const computeSlotAssignments = (starters: Player[], formation: Formation): string[] => {
  const available = [...starters];
  const assignments: string[] = new Array(formation.positions.length).fill("");

  for (let i = 0; i < formation.positions.length; i++) {
    const role = formation.positions[i].role;
    const idx = available.findIndex(p => p.position === role);
    if (idx !== -1) {
      assignments[i] = available[idx].id;
      available.splice(idx, 1);
    }
  }
  for (let i = 0; i < formation.positions.length; i++) {
    if (assignments[i]) continue;
    const role = formation.positions[i].role;
    const idx = available.findIndex(p => p.altPositions?.includes(role));
    if (idx !== -1) {
      assignments[i] = available[idx].id;
      available.splice(idx, 1);
    }
  }
  for (let i = 0; i < formation.positions.length; i++) {
    if (assignments[i]) continue;
    if (available.length > 0) {
      assignments[i] = available.shift()!.id;
    }
  }
  return assignments;
};

const ensureStarterCount = (players: Player[], requiredCount: number): Player[] => {
  const starters = players.filter(p => p.isStarter);
  const reserves = players.filter(p => !p.isStarter);
  if (starters.length === requiredCount) return players;

  const updated = [...players];
  if (starters.length < requiredCount) {
    const sorted = [...reserves].sort((a, b) => b.overall - a.overall);
    let needed = requiredCount - starters.length;
    for (const r of sorted) {
      if (needed <= 0) break;
      const idx = updated.findIndex(p => p.id === r.id);
      if (idx !== -1) { updated[idx] = { ...updated[idx], isStarter: true }; needed--; }
    }
  } else {
    const sorted = [...starters].sort((a, b) => a.overall - b.overall);
    let excess = starters.length - requiredCount;
    for (const s of sorted) {
      if (excess <= 0) break;
      const idx = updated.findIndex(p => p.id === s.id);
      if (idx !== -1) { updated[idx] = { ...updated[idx], isStarter: false }; excess--; }
    }
  }
  return updated;
};

export const SquadManager = ({ players, onClose, onSquadChange, onSellPlayer }: SquadManagerProps) => {
  const [selectedFormation, setSelectedFormation] = useState("4-3-3");
  const [selectedPlayStyle, setSelectedPlayStyle] = useState("counter");
  const [openDropdown, setOpenDropdown] = useState<"style" | "formation" | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [valuePlayer, setValuePlayer] = useState<Player | null>(null);

  const formation = formations.find((f) => f.id === selectedFormation) || formations[0];
  const playStyle = playStyles.find((s) => s.id === selectedPlayStyle) || playStyles[0];

  const [localPlayers, setLocalPlayers] = useState<Player[]>(() =>
    ensureStarterCount(players, formation.positions.length)
  );

  const [slotAssignments, setSlotAssignments] = useState<string[]>(() => {
    const fixed = ensureStarterCount(players, formation.positions.length);
    return computeSlotAssignments(fixed.filter(p => p.isStarter), formation);
  });

  useEffect(() => {
    const { players: optimized, starterOrder } = optimizeStartersForFormation(localPlayers, formation);
    setLocalPlayers(optimized);
    setSlotAssignments(starterOrder);
  }, [selectedFormation]);

  const starters = localPlayers.filter(p => p.isStarter);
  const reserves = localPlayers.filter(p => !p.isStarter);
  const orderedStarters = slotAssignments.map(id => localPlayers.find(p => p.id === id) || null);

  const handlePlayerClick = (player: Player) => {
    if (!selectedPlayer) { setSelectedPlayer(player); return; }
    if (selectedPlayer.id === player.id) { setValuePlayer(player); setSelectedPlayer(null); return; }

    const bothStarters = selectedPlayer.isStarter && player.isStarter;

    if (bothStarters) {
      const newSlots = [...slotAssignments];
      const idx1 = newSlots.indexOf(selectedPlayer.id);
      const idx2 = newSlots.indexOf(player.id);
      if (idx1 !== -1 && idx2 !== -1) {
        newSlots[idx1] = player.id;
        newSlots[idx2] = selectedPlayer.id;
        setSlotAssignments(newSlots);
      }
    } else if (!selectedPlayer.isStarter && !player.isStarter) {
      // both reserves – no-op
    } else {
      const starterId = selectedPlayer.isStarter ? selectedPlayer.id : player.id;
      const reserveId = selectedPlayer.isStarter ? player.id : selectedPlayer.id;
      const updatedPlayers = localPlayers.map(p => {
        if (p.id === starterId) return { ...p, isStarter: false };
        if (p.id === reserveId) return { ...p, isStarter: true };
        return p;
      });
      setLocalPlayers(updatedPlayers);
      setSlotAssignments(slotAssignments.map(id => id === starterId ? reserveId : id));
    }
    setSelectedPlayer(null);
  };

  const handleSave = () => { onSquadChange(localPlayers); onClose(); };
  const toggleDropdown = (d: "style" | "formation") => setOpenDropdown(openDropdown === d ? null : d);

  return (
    <div className="bg-black min-h-full">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-2xl font-bold">Gerenciar Elenco</h2>
          <button onClick={onClose} className="text-white"><X className="w-6 h-6" /></button>
        </div>

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

        {/* Dropdowns */}
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-6 px-4">
          <div className="relative">
            <button onClick={() => toggleDropdown("style")} className="w-full bg-white text-black rounded-lg px-4 py-3 flex items-center justify-between font-medium hover:bg-white/90 transition-colors">
              <span>{playStyle.name}</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${openDropdown === "style" ? "rotate-180" : ""}`} />
            </button>
            {openDropdown === "style" && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg overflow-hidden shadow-lg z-50">
                {playStyles.map((style) => (
                  <button key={style.id} onClick={() => { setSelectedPlayStyle(style.id); setOpenDropdown(null); }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors ${selectedPlayStyle === style.id ? "bg-[#c8ff00]" : ""}`}>
                    <div className="font-medium text-black">{style.name}</div>
                    <div className="text-xs text-gray-600">{style.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={() => toggleDropdown("formation")} className="w-full bg-white text-black rounded-lg px-4 py-3 flex items-center justify-between font-medium hover:bg-white/90 transition-colors">
              <span>{formation.name}</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${openDropdown === "formation" ? "rotate-180" : ""}`} />
            </button>
            {openDropdown === "formation" && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg overflow-hidden shadow-lg z-50">
                {formations.map((form) => (
                  <button key={form.id} onClick={() => { setSelectedFormation(form.id); setOpenDropdown(null); }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors ${selectedFormation === form.id ? "bg-[#c8ff00]" : ""}`}>
                    <div className="font-medium text-black">{form.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reservas */}
        <div className="rounded-2xl p-4 max-w-md mx-auto relative overflow-hidden" style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(0 0% 14%) 0%, hsl(0 0% 6%) 70%, hsl(0 0% 4%) 100%)'
        }}>
          <h3 className="text-white/90 text-lg font-semibold tracking-wide mb-4 uppercase">Banco de Reservas</h3>
          <div className="space-y-2.5">
            {reserves.map(player => (
              <PlayerBubble
                key={player.id}
                player={player}
                variant="reserve"
                isSelected={selectedPlayer?.id === player.id}
                onClick={() => handlePlayerClick(player)}
              />
            ))}
          </div>
        </div>

        {selectedPlayer && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#c8ff00] text-black px-6 py-3 rounded-lg font-medium">
            Clique em outro jogador para trocar
          </div>
        )}

        <div className="max-w-md mx-auto mt-6 pb-8">
          <Button onClick={handleSave} className="w-full bg-[#c8ff00] text-black hover:bg-[#b3e600] font-bold">
            Salvar Escalação
          </Button>
        </div>

        {valuePlayer && (
          <PlayerValueModal
            player={valuePlayer}
            onClose={() => setValuePlayer(null)}
            canSell={!!onSellPlayer}
            onSell={(player) => {
              if (onSellPlayer) {
                onSellPlayer(player);
                setValuePlayer(null);
                setLocalPlayers(prev => prev.filter(p => p.id !== player.id));
                const newSlots = slotAssignments.filter(id => id !== player.id);
                setSlotAssignments(newSlots);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};
