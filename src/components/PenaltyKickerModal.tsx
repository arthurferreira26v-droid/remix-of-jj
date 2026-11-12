import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Player } from "@/data/players";
import { Check } from "lucide-react";
import { useState } from "react";

interface PenaltyKickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onSelectKicker: (player: Player) => void;
  teamName: string;
}

export function PenaltyKickerModal({
  isOpen,
  onClose,
  players,
  onSelectKicker,
  teamName,
}: PenaltyKickerModalProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const handleConfirm = () => {
    if (selectedPlayer) {
      onSelectKicker(selectedPlayer);
      setSelectedPlayer(null);
      onClose();
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case "GOL":
        return "bg-amber-500/20 text-amber-400";
      case "ZAG":
      case "LE":
      case "LD":
        return "bg-blue-500/20 text-blue-400";
      case "VOL":
      case "MC":
      case "ME":
      case "MD":
        return "bg-emerald-500/20 text-emerald-400";
      case "ATA":
      case "PE":
      case "PD":
        return "bg-rose-500/20 text-rose-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-zinc-900 to-black border-zinc-800 p-0 overflow-hidden">
        <div className="relative">
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-[#c8ff00]/20 to-[#c8ff00]/5 px-6 py-5 border-b border-zinc-800/50">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white text-center">
                Pênalti!
              </DialogTitle>
              <p className="text-sm text-zinc-400 text-center mt-1">
                Escolha quem vai cobrar
              </p>
            </DialogHeader>
          </div>

          {/* Lista de jogadores */}
          <div className="px-4 py-4 max-h-[400px] overflow-y-auto">
            <div className="grid gap-2">
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  className={`relative flex items-center gap-4 w-full p-3 rounded-xl transition-all duration-200 ${
                    selectedPlayer?.id === player.id
                      ? "bg-[#c8ff00]/10 ring-2 ring-[#c8ff00] shadow-lg shadow-[#c8ff00]/10"
                      : "bg-zinc-800/40 hover:bg-zinc-800/70"
                  }`}
                >
                  {/* Indicador de seleção */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      selectedPlayer?.id === player.id
                        ? "bg-[#c8ff00]"
                        : "bg-zinc-700 border border-zinc-600"
                    }`}
                  >
                    {selectedPlayer?.id === player.id && (
                      <Check className="w-3 h-3 text-black" />
                    )}
                  </div>

                  {/* Info do jogador */}
                  <div className="flex-1 flex items-center gap-3">
                    {/* Posição */}
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold ${getPositionColor(
                        player.position
                      )}`}
                    >
                      {player.position}
                    </span>

                    {/* Nome */}
                    <span className="text-white font-medium flex-1 text-left">
                      {player.name}
                    </span>

                    {/* Overall */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">OVR</span>
                      <span
                        className={`text-sm font-bold ${
                          player.overall >= 85
                            ? "text-[#c8ff00]"
                            : player.overall >= 75
                            ? "text-emerald-400"
                            : player.overall >= 65
                            ? "text-amber-400"
                            : "text-zinc-400"
                        }`}
                      >
                        {player.overall}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Botão de confirmar */}
          <div className="px-4 pb-4">
            <button
              onClick={handleConfirm}
              disabled={!selectedPlayer}
              className={`w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-all duration-200 ${
                selectedPlayer
                  ? "bg-[#c8ff00] text-black hover:bg-[#d4ff33] active:scale-[0.98]"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              {selectedPlayer ? `Cobrar com ${selectedPlayer.name}` : "Selecione um jogador"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
