import { useState, useEffect } from "react";
import { Player } from "@/data/players";
import { X, Send, TrendingUp, TrendingDown, Minus, Binoculars } from "lucide-react";
import { calculateMarketValue, formatMarketValue } from "@/utils/marketValue";
import { getWatchlist, removeFromWatchlist } from "@/utils/watchlist";
import { getTeamRosterPlayers } from "@/utils/teamRoster";
import { teams } from "@/data/teams";
import { sendOffer, getSentOffers } from "@/utils/transferOffers";
import { getLocalBudget } from "@/utils/localChampionship";
import { toast } from "sonner";

interface ScoutTabProps {
  userTeamName: string;
  budget: number;
  onOfferSent?: () => void;
  onBudgetChanged?: (newBudget: number) => void;
}

export const ScoutTab = ({ userTeamName, budget, onOfferSent, onBudgetChanged }: ScoutTabProps) => {
  const [watchedPlayers, setWatchedPlayers] = useState<{ player: Player; ownerTeam: string }[]>([]);
  const [offerModal, setOfferModal] = useState<{ player: Player; ownerTeam: string } | null>(null);
  const [offerValue, setOfferValue] = useState("");
  const [sentOfferKeys, setSentOfferKeys] = useState<Set<string>>(new Set());

  const getMarketKey = (playerId: string, ownerTeam: string) => `${ownerTeam.toLowerCase()}::${playerId}`;

  const loadWatchedPlayers = () => {
    if (!userTeamName) return;
    const watchlist = getWatchlist(userTeamName);
    const allTeams = teams.filter(t => t.league === "brasileiro");
    const result: { player: Player; ownerTeam: string }[] = [];

    for (const entry of watchlist) {
      // Find the player in current rosters (they may have transferred)
      let found = false;
      for (const team of allTeams) {
        const roster = getTeamRosterPlayers(team.name);
        const player = roster.find(p => p.id === entry.playerId);
        if (player) {
          result.push({ player: { ...player, marketValue: player.marketValue ?? calculateMarketValue(player) }, ownerTeam: team.name });
          found = true;
          break;
        }
      }
      // If player not found in any roster, skip (was removed from game)
    }

    setWatchedPlayers(result);

    const sent = getSentOffers(userTeamName);
    setSentOfferKeys(new Set(sent.map(o => o.playerUniqueKey)));
  };

  useEffect(() => {
    loadWatchedPlayers();
  }, [userTeamName]);

  const handleRemove = (playerId: string, ownerTeam: string) => {
    removeFromWatchlist(userTeamName, playerId, ownerTeam);
    setWatchedPlayers(prev => prev.filter(wp => !(wp.player.id === playerId)));
    toast.success("Jogador removido da observação");
  };

  const handleSendOffer = () => {
    if (!offerModal) return;
    const value = parseFloat(offerValue.replace(/[^0-9.]/g, ""));
    if (isNaN(value) || value <= 0) { toast.error("Informe um valor válido!"); return; }
    const valueInUnits = value * 1000000;
    if (valueInUnits > budget) { toast.error("Caixa insuficiente!"); return; }

    try {
      sendOffer(
        offerModal.player.id, offerModal.player.name, offerModal.player.overall,
        offerModal.player.position, userTeamName, offerModal.ownerTeam, valueInUnits, false, offerModal.player
      );
    } catch (error) {
      if (error instanceof Error && error.message === "same_team_offer") { toast.error("Não pode ofertar no próprio time!"); return; }
      toast.error("Erro ao enviar oferta!"); return;
    }

    setSentOfferKeys(prev => new Set([...prev, getMarketKey(offerModal.player.id, offerModal.ownerTeam)]));
    setOfferModal(null);
    setOfferValue("");
    toast.success("Oferta enviada!");
    const newBudget = getLocalBudget(userTeamName);
    onBudgetChanged?.(newBudget);
    onOfferSent?.();
  };

  if (watchedPlayers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
        <Binoculars className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-sm">Nenhum jogador na observação</p>
        <p className="text-xs mt-1 text-zinc-600">Adicione jogadores pelo mercado</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {watchedPlayers.map(({ player, ownerTeam }) => {
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
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleRemove(player.id, ownerTeam)}
                      className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-red-400 hover:bg-red-900/30 transition-colors"
                      title="Remover da observação"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {hasSentOffer ? (
                      <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-600/20 text-yellow-400 border border-yellow-600/30">
                        Oferta Enviada
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setOfferModal({ player, ownerTeam });
                          setOfferValue((price / 1000000).toFixed(1));
                        }}
                        className="px-4 py-2 rounded-lg font-bold text-sm bg-[#c8ff00] text-black hover:bg-[#b8ef00] transition-colors flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Ofertar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pb-8" />

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
            <p className="text-xs text-zinc-500 mb-4">Seu caixa: {formatMarketValue(budget)}</p>
            <div className="flex gap-3">
              <button onClick={() => { setOfferModal(null); setOfferValue(""); }} className="flex-1 py-3 rounded-lg font-bold text-sm bg-zinc-800 text-white hover:bg-zinc-700 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSendOffer} className="flex-1 py-3 rounded-lg font-bold text-sm bg-[#c8ff00] text-black hover:bg-[#b8ef00] transition-colors flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
