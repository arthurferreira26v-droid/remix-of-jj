import { useState, useEffect } from "react";
import { X, Search, ShoppingCart, DollarSign, TrendingUp, TrendingDown, Minus, Loader2, Send, Inbox } from "lucide-react";
import { Player } from "@/data/players";
import { calculateMarketValue, formatMarketValue } from "@/utils/marketValue";
import { fetchAdminPlayers } from "@/hooks/useAdminData";
import { teams } from "@/data/teams";
import { sendOffer, getSentOffers, countPendingOffers } from "@/utils/transferOffers";
import { getLocalBudget } from "@/utils/localChampionship";
import { getTeamRosterPlayers } from "@/utils/teamRoster";
import { toast } from "sonner";

interface TransferMarketProps {
  budget: number;
  userTeamName: string;
  onClose: () => void;
  onOpenOffers?: () => void;
  onOfferSent?: () => void;
  onBudgetChanged?: (newBudget: number) => void;
}

export const TransferMarket = ({ budget, userTeamName, onClose, onOpenOffers, onOfferSent, onBudgetChanged }: TransferMarketProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState<string>("ALL");
  const [marketPlayers, setMarketPlayers] = useState<{ player: Player; ownerTeam: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [offerModal, setOfferModal] = useState<{ player: Player; ownerTeam: string } | null>(null);
  const [offerValue, setOfferValue] = useState("");
  const [sentOfferKeys, setSentOfferKeys] = useState<Set<string>>(new Set());

  const getMarketKey = (playerId: string, ownerTeam: string) => `${ownerTeam.toLowerCase()}::${playerId}`;

  const positions = ["ALL", "GOL", "ZAG", "LD", "LE", "VOL", "MC", "MEI", "PD", "PE", "ATA"];

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchAdminPlayers(true);
      const brazilianTeams = teams.filter(t => t.league === "brasileiro").map(t => t.name);
      const all: { player: Player; ownerTeam: string }[] = [];

      for (const teamName of brazilianTeams) {
        if (teamName.toLowerCase() === userTeamName.toLowerCase()) continue;

        const currentRoster = getTeamRosterPlayers(teamName);

        currentRoster.forEach(p => {
          all.push({ player: p, ownerTeam: teamName });
        });
      }

      all.sort((a, b) => b.player.overall - a.player.overall);
      setMarketPlayers(all);

      // Track sent offers
      const sent = getSentOffers(userTeamName);
      setSentOfferKeys(new Set(sent.map(o => o.playerUniqueKey)));

      setLoading(false);
    })();
  }, [userTeamName]);

  const filteredPlayers = marketPlayers.filter(({ player }) => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = filterPosition === "ALL" || player.position === filterPosition;
    return matchesSearch && matchesPosition;
  });

  const handleSendOffer = () => {
    if (!offerModal) return;

    if (offerModal.ownerTeam.toLowerCase() === userTeamName.toLowerCase()) {
      toast.error("Você não pode fazer oferta para o próprio time!");
      return;
    }

    const value = parseFloat(offerValue.replace(/[^0-9.]/g, ""));
    if (isNaN(value) || value <= 0) {
      toast.error("Informe um valor válido!");
      return;
    }

    const valueInUnits = value * 1000000; // Input em milhões
    if (valueInUnits > budget) {
      toast.error("Você não tem caixa suficiente!");
      return;
    }

    try {
      sendOffer(
        offerModal.player.id,
        offerModal.player.name,
        offerModal.player.overall,
        offerModal.player.position,
        userTeamName,
        offerModal.ownerTeam,
        valueInUnits,
        false,
        offerModal.player
      );
    } catch (error) {
      if (error instanceof Error && error.message === "same_team_offer") {
        toast.error("Você não pode fazer oferta para o próprio time!");
        return;
      }

      toast.error("Você não tem caixa suficiente!");
      return;
    }

    setSentOfferKeys(prev => new Set([...prev, getMarketKey(offerModal.player.id, offerModal.ownerTeam)]));
    setOfferModal(null);
    setOfferValue("");
    toast.success("Oferta enviada! Valor reservado do caixa.");
    // Atualizar budget no componente pai
    const newBudget = getLocalBudget(userTeamName);
    onBudgetChanged?.(newBudget);
    onOfferSent?.();
  };

  const pendingCount = countPendingOffers(userTeamName);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-black border-b border-zinc-800 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-[#c8ff00]" />
            <h2 className="text-xl font-bold text-white">Mercado</h2>
          </div>
          <div className="flex items-center gap-2">
            {onOpenOffers && (
              <button
                onClick={() => { onClose(); onOpenOffers(); }}
                className="relative p-2 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <Inbox className="w-6 h-6 text-white" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Budget */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-900/40 via-green-800/40 to-green-900/40 border border-green-700/50 rounded-lg px-6 py-3">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-sm text-green-300/80 font-medium">Caixa:</span>
            <span className="text-xl font-bold text-green-400">{formatMarketValue(budget)}</span>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar jogador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-800 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8ff00]"
            />
          </div>
        </div>

        {/* Positions */}
        <div className="px-4 pb-4 flex gap-2 overflow-x-auto">
          {positions.map((pos) => (
            <button
              key={pos}
              onClick={() => setFilterPosition(pos)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filterPosition === pos ? "bg-[#c8ff00] text-black" : "bg-zinc-800 text-white hover:bg-zinc-700"
              }`}
            >
              {pos === "ALL" ? "Todos" : pos}
            </button>
          ))}
        </div>
      </div>

      {/* Players List */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <span>Carregando jogadores...</span>
          </div>
        ) : (
          <>
            {filteredPlayers.map(({ player, ownerTeam }) => {
              const price = calculateMarketValue(player);
              const marketKey = getMarketKey(player.id, ownerTeam);
              const hasSentOffer = sentOfferKeys.has(marketKey);

              return (
                <div key={marketKey} className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-black border-2 border-white rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{player.overall}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{player.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-zinc-400">{player.position}</span>
                          <span className="px-2 py-0.5 bg-blue-600 rounded text-xs font-bold text-white">#{player.number}</span>
                          <span className="text-xs text-zinc-500">{player.age} anos</span>
                          {player.age < 24 && <TrendingUp className="w-3 h-3 text-green-400" />}
                          {player.age >= 24 && player.age <= 30 && <Minus className="w-3 h-3 text-yellow-400" />}
                          {player.age > 30 && <TrendingDown className="w-3 h-3 text-red-400" />}
                        </div>
                        <span className="text-[11px] text-zinc-500 mt-0.5 block">
                          Clube: <span className="text-zinc-300">{ownerTeam}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-green-400">{formatMarketValue(price)}</div>
                      {hasSentOffer ? (
                        <span className="mt-2 inline-block px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-600/20 text-yellow-400 border border-yellow-600/30">
                          Oferta Enviada
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setOfferModal({ player, ownerTeam });
                            setOfferValue((price / 1000000).toFixed(1));
                          }}
                          className="mt-2 px-4 py-2 rounded-lg font-bold text-sm bg-[#c8ff00] text-black hover:bg-[#b8ef00] transition-colors flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Ofertar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredPlayers.length === 0 && (
              <div className="text-center py-12 text-zinc-400">Nenhum jogador encontrado</div>
            )}
          </>
        )}
      </div>

      {/* Offer Modal */}
      {offerModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-6">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-bold text-lg mb-1">Fazer Oferta</h3>
            <p className="text-zinc-400 text-sm mb-4">
              {offerModal.player.name} ({offerModal.player.overall} OVR) — {offerModal.ownerTeam}
            </p>

            <div className="mb-2">
              <span className="text-xs text-zinc-500">Valor de mercado: {formatMarketValue(calculateMarketValue(offerModal.player))}</span>
            </div>

            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-bold">$</span>
              <input
                type="number"
                step="0.1"
                value={offerValue}
                onChange={(e) => setOfferValue(e.target.value)}
                className="w-full bg-zinc-800 text-white pl-8 pr-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8ff00] text-lg font-bold"
                placeholder="0.0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">M</span>
            </div>

            <p className="text-xs text-zinc-500 mb-4">
              Seu caixa: {formatMarketValue(budget)}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => { setOfferModal(null); setOfferValue(""); }}
                className="flex-1 py-3 rounded-lg font-bold text-sm bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendOffer}
                className="flex-1 py-3 rounded-lg font-bold text-sm bg-[#c8ff00] text-black hover:bg-[#b8ef00] transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
