import { useEffect } from "react";
import { createPortal } from "react-dom";
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
  const marketValue = calculateMarketValue(player);
  const sellValue = Math.floor(marketValue * 0.8);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const modalContent = (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-x-hidden bg-background/80 px-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-[20rem] max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-xl border border-border bg-card shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-lg font-bold text-foreground">Valor de Mercado</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 transition-colors hover:bg-muted"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-background">
              <span className="text-2xl font-bold text-foreground">{player.overall}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-xl font-bold text-foreground">{player.name}</h4>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{player.position}</span>
                <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                  #{player.number}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-border bg-muted/60 p-4">
            <div className="mb-2 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Valor de Mercado</span>
            </div>
            <span className="text-3xl font-bold text-foreground">
              {formatMarketValue(marketValue)}
            </span>
          </div>

          {canSell && onSell && (
            <div className="rounded-lg border border-border bg-muted/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-muted-foreground">Valor de Venda</span>
                </div>
                <span className="text-lg font-bold text-foreground">
                  {formatMarketValue(sellValue)}
                </span>
              </div>
              <button
                onClick={() => onSell(player)}
                className="w-full rounded-lg bg-destructive py-3 font-bold text-destructive-foreground transition-opacity hover:opacity-90"
              >
                Vender Jogador
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};