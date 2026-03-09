import { useState, useEffect } from "react";
import { Player } from "@/data/players";
import { formations, playStyles, Formation } from "@/data/formations";
import { X, ChevronDown, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerValueModal } from "@/components/PlayerValueModal";
import { optimizeStartersForFormation } from "@/utils/formationOptimizer";
import { calculateMarketValue, formatMarketValue } from "@/utils/marketValue";

interface SquadManagerProps {
  players: Player[];
  onClose: () => void;
  onSquadChange: (updatedPlayers: Player[]) => void;
  onSellPlayer?: (player: Player) => void;
}

const POSITION_ORDER = ["GOL", "ZAG", "LD", "LE", "VOL", "MC", "MEI", "PD", "PE", "ATA"] as const;

const POSITION_LABELS: Record<string, string> = {
  GOL: "Goleiros",
  ZAG: "Zagueiros",
  LD: "Lateral Direito",
  LE: "Lateral Esquerdo",
  VOL: "Volantes",
  MC: "Meias",
  MEI: "Meias Atacantes",
  PD: "Ponta Direita",
  PE: "Ponta Esquerda",
  ATA: "Atacantes",
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

  useEffect(() => {
    const { players: optimized } = optimizeStartersForFormation(localPlayers, formation);
    setLocalPlayers(optimized);
  }, [selectedFormation]);

  const handlePlayerClick = (player: Player) => {
    if (!selectedPlayer) { setSelectedPlayer(player); return; }
    if (selectedPlayer.id === player.id) { setValuePlayer(player); setSelectedPlayer(null); return; }

    // Swap starter status
    const sel = selectedPlayer;
    const tgt = player;

    if (sel.isStarter !== tgt.isStarter) {
      // One starter, one reserve → swap
      const updatedPlayers = localPlayers.map(p => {
        if (p.id === sel.id) return { ...p, isStarter: tgt.isStarter };
        if (p.id === tgt.id) return { ...p, isStarter: sel.isStarter };
        return p;
      });
      setLocalPlayers(updatedPlayers);
    } else if (sel.isStarter && tgt.isStarter) {
      // Both starters → just visual swap (positions handled by optimizer)
      const updatedPlayers = localPlayers.map(p => {
        if (p.id === sel.id) return { ...p, isStarter: false };
        if (p.id === tgt.id) return { ...p, isStarter: false };
        return p;
      });
      // Re-add both as starters (swap effect)
      const final = updatedPlayers.map(p => {
        if (p.id === sel.id) return { ...p, isStarter: true };
        if (p.id === tgt.id) return { ...p, isStarter: true };
        return p;
      });
      setLocalPlayers(final);
    }
    setSelectedPlayer(null);
  };

  const handleSave = () => { onSquadChange(localPlayers); onClose(); };
  const toggleDropdown = (d: "style" | "formation") => setOpenDropdown(openDropdown === d ? null : d);

  // Group all players by position
  const groupedPlayers: Record<string, Player[]> = {};
  for (const pos of POSITION_ORDER) {
    groupedPlayers[pos] = [];
  }
  for (const p of localPlayers) {
    if (groupedPlayers[p.position]) {
      groupedPlayers[p.position].push(p);
    } else {
      // Fallback for unknown positions
      if (!groupedPlayers["OTHER"]) groupedPlayers["OTHER"] = [];
      groupedPlayers["OTHER"].push(p);
    }
  }
  // Sort each group: starters first, then by overall desc
  for (const pos of Object.keys(groupedPlayers)) {
    groupedPlayers[pos].sort((a, b) => {
      if (a.isStarter !== b.isStarter) return a.isStarter ? -1 : 1;
      return b.overall - a.overall;
    });
  }

  const getEnergyColor = (energy: number) => {
    if (energy >= 80) return 'hsl(142 70% 50%)';
    if (energy >= 60) return 'hsl(45 100% 50%)';
    return 'hsl(0 80% 55%)';
  };

  return (
    <div className="bg-black min-h-full">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl font-bold">Gerenciar Elenco</h2>
          <button onClick={onClose} className="text-white"><X className="w-6 h-6" /></button>
        </div>

        {/* Players grouped by position */}
        <div className="space-y-6">
          {POSITION_ORDER.map(pos => {
            const group = groupedPlayers[pos];
            if (!group || group.length === 0) return null;
            return (
              <div key={pos}>
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">
                  {POSITION_LABELS[pos]}
                </h3>
                <div className="space-y-1.5">
                  {group.map(player => {
                    const energy = player.matchEnergy ?? player.energy ?? 100;
                    const energyColor = getEnergyColor(energy);
                    const value = calculateMarketValue(player);
                    const isSelected = selectedPlayer?.id === player.id;
                    return (
                      <button
                        key={player.id}
                        onClick={() => handlePlayerClick(player)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          isSelected
                            ? "bg-[#c8ff00] text-black"
                            : "bg-zinc-800/80 text-white hover:bg-zinc-700/80"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-lg w-8 text-center ${isSelected ? 'text-black' : 'text-blue-400'}`}>
                            {player.overall}
                          </span>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[14px]">{player.name}</span>
                              {player.isStarter && (
                                <Star className="w-3 h-3 fill-current" style={{ color: isSelected ? 'black' : '#c8ff00' }} />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[11px] font-semibold ${isSelected ? 'text-black/60' : 'text-white/40'}`}>
                                {player.position}
                              </span>
                              <span className={`text-[10px] ${isSelected ? 'text-black/30' : 'text-white/20'}`}>•</span>
                              <span className={`text-[11px] ${isSelected ? 'text-black/60' : 'text-white/40'}`}>
                                {player.age} anos
                              </span>
                              <Zap className="w-3 h-3" style={{ color: isSelected ? 'black' : energyColor }} />
                              <span className="text-[11px] font-bold" style={{ color: isSelected ? 'black' : energyColor }}>
                                {energy}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`text-[11px] font-semibold ${isSelected ? 'text-black' : 'text-green-400'}`}>
                          {formatMarketValue(value)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {selectedPlayer && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#c8ff00] text-black px-6 py-3 rounded-lg font-medium z-10">
            Clique em outro jogador para trocar
          </div>
        )}

        <div className="mt-6 pb-8">
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
              }
            }}
          />
        )}
      </div>
    </div>
  );
};
