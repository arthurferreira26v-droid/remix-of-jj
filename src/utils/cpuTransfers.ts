import { getLocalBudget, saveLocalBudget } from "@/utils/localChampionship";
import { calculateMarketValue } from "@/utils/marketValue";
import { getTeamRosterPlayers, transferPlayerToTeamRoster } from "@/utils/teamRoster";

export interface CpuTransfer {
  playerName: string;
  playerOverall: number;
  fromTeam: string;
  toTeam: string;
  value: number;
  round: number;
  at: number;
}

const HISTORY_KEY = "cpu_transfer_history";
const DONE_KEY = "cpu_transfer_last_round";
const MIN_SQUAD = 18;
const MAX_SQUAD = 32;

export const getCpuTransferHistory = (): CpuTransfer[] => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
};

export const clearCpuTransfers = () => {
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(DONE_KEY);
};

/** Preço pedido pelo vendedor: valor de mercado com ágio de 5–30%. */
export const cpuAskingPrice = (marketValue: number, rand: number) =>
  Math.round(marketValue * (1.05 + rand * 0.25));

/**
 * Bots compram jogadores de outros bots (uma vez por rodada).
 * Nunca envolve times humanos. Respeita caixa e tamanho mínimo/máximo de elenco.
 */
export const simulateCpuTransfers = (
  humanTeams: string[],
  leagueTeams: string[],
  round: number,
  maxDeals = 2,
  rand: () => number = Math.random
): CpuTransfer[] => {
  const doneKey = `${DONE_KEY}::${leagueTeams[0] ?? ""}`;
  if (Number(localStorage.getItem(doneKey) || 0) >= round) return [];
  localStorage.setItem(doneKey, String(round));

  const isHuman = (t: string) => humanTeams.some((h) => h.toLowerCase() === t.toLowerCase());
  const cpu = leagueTeams.filter((t) => !isHuman(t));
  if (cpu.length < 2) return [];

  const deals: CpuTransfer[] = [];
  const attempts = maxDeals * 4;
  for (let i = 0; i < attempts && deals.length < maxDeals; i++) {
    if (rand() > 0.6) continue;
    const buyer = cpu[Math.floor(rand() * cpu.length)];
    const seller = cpu[Math.floor(rand() * cpu.length)];
    if (buyer === seller) continue;

    const sellerPlayers = getTeamRosterPlayers(seller);
    const buyerPlayers = getTeamRosterPlayers(buyer);
    if (sellerPlayers.length <= MIN_SQUAD || buyerPlayers.length >= MAX_SQUAD) continue;

    const budget = getLocalBudget(buyer);
    const buyerAvg = buyerPlayers.reduce((s, p) => s + p.overall, 0) / Math.max(1, buyerPlayers.length);
    const candidates = sellerPlayers
      .filter((p) => p.overall >= buyerAvg - 2)
      .map((p) => ({ p, price: cpuAskingPrice(calculateMarketValue(p), rand()) }))
      .filter((c) => c.price <= budget * 0.6);
    if (candidates.length === 0) continue;

    const { p, price } = candidates[Math.floor(rand() * candidates.length)];
    try {
      transferPlayerToTeamRoster(seller, buyer, p.id, p);
    } catch { continue; }
    saveLocalBudget(buyer, budget - price);
    saveLocalBudget(seller, getLocalBudget(seller) + price);
    deals.push({ playerName: p.name, playerOverall: p.overall, fromTeam: seller, toTeam: buyer, value: price, round, at: Date.now() });
  }

  if (deals.length) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([...deals, ...getCpuTransferHistory()].slice(0, 100)));
  }
  return deals;
};
