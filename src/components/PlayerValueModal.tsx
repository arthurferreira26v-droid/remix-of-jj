import { Player } from "@/data/players";
import { calculateMarketValue, formatMarketValue } from "@/utils/marketValue";
import { X, DollarSign, TrendingDown } from "lucide-react";

interface PlayerValueModalProps {
  player: Player;
  onClose: () => void;
  canSell?: boolean;
  onSell?: (player: Player) => void;
}

export const PlayerValueModal = ({ player, onClose, canSell = false, onSell }: PlayerValueModalProps) => {
  const marketValue = calculateMarketValue(player.overall);
  const sellValue = Math.floor(marketValue * 0.8); // Vende por 80% do valor

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 rounded-xl w-full max-w-sm mx-4 overflow-hidden border border-zinc-700 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h3 className="text-lg font-bold text-white">Valor de Mercado</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-700 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Player Info */}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-black border-2 border-white/60 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{player.number}</span>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-white">{player.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-zinc-400">{player.position}</span>
                <span className="px-2 py-0.5 bg-blue-800 rounded text-xs font-bold text-white">
                  {player.overall} OVR
                </span>
              </div>
            </div>
          </div>

          {/* Market Value */}
          <div className="bg-zinc-800/80 border border-zinc-600/50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-white/70" />
              <span className="text-sm text-white/60 font-medium">Valor de Mercado</span>
            </div>
            <span className="text-3xl font-bold text-white">
              {formatMarketValue(marketValue)}
            </span>
          </div>

          {/* Sell Option */}
          {canSell && onSell && (
            <div className="bg-zinc-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-zinc-400">Valor de Venda</span>
                </div>
                <span className="text-lg font-bold text-white">
                  {formatMarketValue(sellValue)}
                </span>
              </div>
              <button
                onClick={() => onSell(player)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Vender Jogador
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
