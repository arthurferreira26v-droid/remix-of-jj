import { useState, useEffect } from "react";
import { X, Inbox, Check, XIcon, DollarSign } from "lucide-react";
import { getReceivedOffers, acceptOffer, rejectOffer, TransferOffer } from "@/utils/transferOffers";
import { formatMarketValue } from "@/utils/marketValue";
import { toast } from "sonner";

interface ReceivedOffersModalProps {
  teamName: string;
  onClose: () => void;
  onAccepted?: (offer: TransferOffer) => void;
}

export const ReceivedOffersModal = ({ teamName, onClose, onAccepted }: ReceivedOffersModalProps) => {
  const [offers, setOffers] = useState<TransferOffer[]>([]);

  useEffect(() => {
    setOffers(getReceivedOffers(teamName));
  }, [teamName]);

  const handleAccept = (offer: TransferOffer) => {
    const result = acceptOffer(offer.id, (accepted) => {
      onAccepted?.(accepted);
    });
    if (result) {
      toast.success(`${result.playerName} transferido para ${result.fromTeam} por ${formatMarketValue(result.offerValue)}!`);
      setOffers(prev => prev.filter(o => o.id !== offer.id));
    }
  };

  const handleReject = (offer: TransferOffer) => {
    rejectOffer(offer.id);
    toast("Oferta recusada.");
    setOffers(prev => prev.filter(o => o.id !== offer.id));
  };

  // Group by player
  const grouped = offers.reduce<Record<string, TransferOffer[]>>((acc, o) => {
    if (!acc[o.playerId]) acc[o.playerId] = [];
    acc[o.playerId].push(o);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto">
      <div className="sticky top-0 bg-black border-b border-zinc-800 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Inbox className="w-6 h-6 text-[#c8ff00]" />
            <h2 className="text-xl font-bold text-white">Ofertas Recebidas</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma oferta pendente</p>
          </div>
        ) : (
          Object.entries(grouped).map(([playerId, playerOffers]) => {
            const first = playerOffers[0];
            return (
              <div key={playerId} className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                {/* Player header */}
                <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
                  <div className="w-10 h-10 bg-black border-2 border-white rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{first.playerOverall}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{first.playerName}</h4>
                    <span className="text-xs text-zinc-400">{first.playerPosition} • Valor: {formatMarketValue(first.marketValue)}</span>
                  </div>
                </div>

                {/* Offers */}
                <div className="divide-y divide-zinc-800">
                  {playerOffers.map((offer) => {
                    const ratio = offer.offerValue / offer.marketValue;
                    const ratioColor = ratio >= 0.9 ? "text-green-400" : ratio >= 0.7 ? "text-yellow-400" : "text-red-400";

                    return (
                      <div key={offer.id} className="p-4 flex items-center justify-between">
                        <div>
                          <span className="text-sm text-white font-medium">{offer.fromTeam}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <DollarSign className="w-3.5 h-3.5 text-green-400" />
                            <span className={`text-sm font-bold ${ratioColor}`}>
                              {formatMarketValue(offer.offerValue)}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              ({(ratio * 100).toFixed(0)}% do valor)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReject(offer)}
                            className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                          >
                            <XIcon className="w-4 h-4 text-red-400" />
                          </button>
                          <button
                            onClick={() => handleAccept(offer)}
                            className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center hover:bg-green-500/30 transition-colors"
                          >
                            <Check className="w-4 h-4 text-green-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
