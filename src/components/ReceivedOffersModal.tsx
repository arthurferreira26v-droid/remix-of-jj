import { useState, useEffect, useMemo } from "react";
import { X, Inbox, Check, XIcon, DollarSign, ArrowRight, MessageSquare, Send, Clock } from "lucide-react";
import { getReceivedOffers, getCounterOffers, getSentOffers, acceptOffer, acceptCounterOffer, rejectOffer, claimOffer, dismissRejectedOffer, TransferOffer } from "@/utils/transferOffers";
import { getLocalBudget } from "@/utils/localChampionship";
import { calculateMarketValue, formatMarketValue } from "@/utils/marketValue";
import { getTeamRosterPlayers } from "@/utils/teamRoster";
import { toast } from "sonner";

interface ReceivedOffersModalProps {
  teamName: string;
  onClose: () => void;
  onAccepted?: (offer: TransferOffer) => void;
  onBudgetChanged?: (newBudget: number) => void;
}

export const ReceivedOffersModal = ({ teamName, onClose, onAccepted, onBudgetChanged }: ReceivedOffersModalProps) => {
  const [offers, setOffers] = useState<TransferOffer[]>([]);
  const [counterOffers, setCounterOffers] = useState<TransferOffer[]>([]);
  const [sentOffers, setSentOffers] = useState<TransferOffer[]>([]);
  const [tab, setTab] = useState<"received" | "sent" | "counter">("received");

  const currentTeamPlayers = useMemo(() => {
    return getTeamRosterPlayers(teamName) as Array<{
      id: string;
      name: string;
      overall: number;
      position: string;
      marketValue?: number;
    }>;
  }, [teamName, offers.length, counterOffers.length, sentOffers.length]);

  const resolveReceivedPlayer = (offer: TransferOffer) => {
    const rosterPlayer = currentTeamPlayers.find((player) => player.id === offer.playerId);
    const sourcePlayer = rosterPlayer ?? offer.playerData;
    const resolvedOverall = sourcePlayer?.overall ?? offer.playerOverall;

    return {
      name: sourcePlayer?.name || offer.playerName,
      overall: resolvedOverall,
      position: sourcePlayer?.position || offer.playerPosition,
      marketValue: sourcePlayer?.marketValue ?? calculateMarketValue(resolvedOverall),
    };
  };

  useEffect(() => {
    setOffers(getReceivedOffers(teamName));
    setCounterOffers(getCounterOffers(teamName));
    setSentOffers(getSentOffers(teamName));
  }, [teamName]);

  const refreshSent = () => setSentOffers(getSentOffers(teamName));

  const handleAccept = (offer: TransferOffer) => {
    const resolvedPlayer = resolveReceivedPlayer(offer);
    const result = acceptOffer(offer.id, (accepted) => {
      onAccepted?.(accepted);
    });
    if (result) {
      toast.success(`${resolvedPlayer.name} transferido para ${result.fromTeam} por ${formatMarketValue(result.offerValue)}!`);
      setOffers(prev => prev.filter(o => o.id !== offer.id));
      onBudgetChanged?.(getLocalBudget(teamName));
    }
  };

  const handleReject = (offer: TransferOffer) => {
    rejectOffer(offer.id);
    toast("Oferta recusada. Valor devolvido ao comprador.");
    setOffers(prev => prev.filter(o => o.id !== offer.id));
    setCounterOffers(prev => prev.filter(o => o.id !== offer.id));
    setSentOffers(prev => prev.filter(o => o.id !== offer.id));
  };

  const handleAcceptCounter = (offer: TransferOffer) => {
    if (!offer.counterValue) return;
    // Escrow já foi devolvido, então precisa ter o valor total da contraproposta
    const budget = getLocalBudget(teamName);
    if (offer.counterValue > budget) {
      toast.error("Você não tem caixa suficiente para essa contraproposta!");
      return;
    }

    const result = acceptCounterOffer(offer.id, (accepted) => {
      onAccepted?.(accepted);
    });
    if (result) {
      toast.success(`${result.playerName} comprado de ${result.toTeam} por ${formatMarketValue(result.offerValue)}!`);
      setCounterOffers(prev => prev.filter(o => o.id !== offer.id));
      setSentOffers(prev => prev.filter(o => o.id !== offer.id));
      onBudgetChanged?.(getLocalBudget(teamName));
    }
  };

  const handleClaim = (offer: TransferOffer) => {
    const result = claimOffer(offer.id);
    if (result) {
      toast.success(`${result.playerName} adicionado ao elenco!`);
      refreshSent();
      onAccepted?.(result);
      onBudgetChanged?.(getLocalBudget(teamName));
    }
  };

  const handleDismissRejected = (offer: TransferOffer) => {
    dismissRejectedOffer(offer.id);
    toast("Oferta removida.");
    refreshSent();
  };

  // Group received offers by player
  const grouped = offers.reduce<Record<string, TransferOffer[]>>((acc, o) => {
    if (!acc[o.playerUniqueKey]) acc[o.playerUniqueKey] = [];
    acc[o.playerUniqueKey].push(o);
    return acc;
  }, {});

  const totalReceived = offers.length;
  const totalCounters = counterOffers.length;
  const totalSent = sentOffers.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto">
      <div className="sticky top-0 bg-black border-b border-zinc-800 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Inbox className="w-6 h-6 text-[#c8ff00]" />
            <h2 className="text-xl font-bold text-white">Negociações</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pb-3 gap-2">
          <button
            onClick={() => setTab("received")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
              tab === "received" ? "bg-[#c8ff00] text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            Recebidas {totalReceived > 0 && `(${totalReceived})`}
          </button>
          <button
            onClick={() => setTab("sent")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
              tab === "sent" ? "bg-[#c8ff00] text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            Enviadas {totalSent > 0 && `(${totalSent})`}
          </button>
          <button
            onClick={() => setTab("counter")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
              tab === "counter" ? "bg-[#c8ff00] text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            Contra {totalCounters > 0 && `(${totalCounters})`}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {tab === "received" && (
          <>
            {Object.keys(grouped).length === 0 ? (
              <div className="text-center py-16 text-zinc-400">
                <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma oferta pendente</p>
              </div>
            ) : (
              Object.entries(grouped).map(([playerId, playerOffers]) => {
                const first = playerOffers[0];
                const resolvedFirstPlayer = resolveReceivedPlayer(first);
                return (
                  <div key={playerId} className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                    <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
                      <div className="w-10 h-10 bg-black border-2 border-white rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">{resolvedFirstPlayer.overall}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{resolvedFirstPlayer.name}</h4>
                        <span className="text-xs text-zinc-400">{resolvedFirstPlayer.position} • Valor: {formatMarketValue(resolvedFirstPlayer.marketValue)}</span>
                      </div>
                    </div>

                    <div className="divide-y divide-zinc-800">
                      {playerOffers.map((offer) => {
                        const resolvedPlayer = resolveReceivedPlayer(offer);
                        const ratio = offer.offerValue / resolvedPlayer.marketValue;
                        const ratioColor = ratio >= 1.0 ? "text-green-400" : ratio >= 0.9 ? "text-emerald-400" : ratio >= 0.7 ? "text-yellow-400" : "text-red-400";

                        return (
                          <div key={offer.id} className="p-4 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-white font-medium">{offer.fromTeam}</span>
                              </div>
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
          </>
        )}

        {tab === "sent" && (
          <>
            {sentOffers.length === 0 ? (
              <div className="text-center py-16 text-zinc-400">
                <Send className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma oferta enviada</p>
              </div>
            ) : (
              sentOffers.map((offer) => {
                const maxMatches = offer.isFromCpu ? 1 : 3;
                const remaining = maxMatches - (offer.matchesPassed || 0);
                const isAccepted = offer.status === "accepted";
                const isRejected = offer.status === "rejected";
                const isResolved = isAccepted || isRejected;

                return (
                  <div key={offer.id} className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black border-2 border-white rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{offer.playerOverall}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{offer.playerName}</h4>
                          <span className="text-xs text-zinc-400">{offer.playerPosition} • {offer.toTeam}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-400">{formatMarketValue(offer.offerValue)}</div>
                        {!isResolved && <div className="flex items-center gap-1 mt-1 justify-end">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span className="text-[10px] text-zinc-500">
                            {offer.status === "pending" ? `${remaining} jogo${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}` : offer.status === "counter" ? "Contraproposta" : offer.status}
                          </span>
                        </div>}
                      </div>
                    </div>

                    {isAccepted ? (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                            ✅ Oferta aceita!
                          </span>
                        </div>
                        <button
                          onClick={() => handleClaim(offer)}
                          className="w-full py-2.5 rounded-lg font-bold text-sm bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Resgatar Jogador
                        </button>
                      </div>
                    ) : isRejected ? (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            ❌ Oferta recusada
                          </span>
                          <span className="text-[10px] text-zinc-500">Dinheiro devolvido ao caixa</span>
                        </div>
                        <button
                          onClick={() => handleDismissRejected(offer)}
                          className="w-full py-2 rounded-lg font-bold text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                        >
                          OK, Entendi
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          offer.status === "pending" 
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" 
                            : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        }`}>
                          {offer.status === "pending" ? "Aguardando resposta" : "Contraproposta recebida"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}

        {tab === "counter" && (
          <>
            {counterOffers.length === 0 ? (
              <div className="text-center py-16 text-zinc-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma contraproposta</p>
              </div>
            ) : (
              counterOffers.map((offer) => (
                <div key={offer.id} className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                  <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
                    <div className="w-10 h-10 bg-black border-2 border-white rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{offer.playerOverall}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{offer.playerName}</h4>
                      <span className="text-xs text-zinc-400">{offer.playerPosition} • {offer.toTeam}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-zinc-800 rounded-lg p-3 text-center">
                        <span className="text-[10px] text-zinc-500 block">Sua oferta</span>
                        <span className="text-sm font-bold text-zinc-300">{formatMarketValue(offer.offerValue)}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-500 shrink-0" />
                      <div className="flex-1 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                        <span className="text-[10px] text-yellow-400 block">Contraproposta</span>
                        <span className="text-sm font-bold text-yellow-400">{formatMarketValue(offer.counterValue || 0)}</span>
                      </div>
                    </div>

                    <div className="text-xs text-zinc-500 text-center">
                      Valor de mercado: {formatMarketValue(offer.marketValue)}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleReject(offer)}
                        className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                      >
                        Recusar
                      </button>
                      <button
                        onClick={() => handleAcceptCounter(offer)}
                        className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors"
                      >
                        Aceitar ({formatMarketValue(offer.counterValue || 0)})
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};
