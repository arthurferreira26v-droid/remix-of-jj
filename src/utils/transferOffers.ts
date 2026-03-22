import { Player } from "@/data/players";
import { calculateMarketValue } from "@/utils/marketValue";

// ==================== TYPES ====================

export interface TransferOffer {
  id: string;
  playerId: string;
  playerName: string;
  playerOverall: number;
  playerPosition: string;
  fromTeam: string;       // quem fez a oferta
  toTeam: string;         // dono atual do jogador
  offerValue: number;
  marketValue: number;     // valor base para referência
  status: "pending" | "accepted" | "rejected";
  createdAt: number;
}

// ==================== STORAGE KEYS ====================

const OFFERS_KEY = "transfer_offers";

// ==================== HELPERS ====================

const getOffers = (): TransferOffer[] => {
  const raw = localStorage.getItem(OFFERS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveOffers = (offers: TransferOffer[]) => {
  localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));
};

// ==================== PUBLIC API ====================

/** Envia uma oferta por um jogador */
export const sendOffer = (
  playerId: string,
  playerName: string,
  playerOverall: number,
  playerPosition: string,
  fromTeam: string,
  toTeam: string,
  offerValue: number
): TransferOffer => {
  const offer: TransferOffer = {
    id: `offer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    playerId,
    playerName,
    playerOverall,
    playerPosition,
    fromTeam,
    toTeam,
    offerValue,
    marketValue: calculateMarketValue(playerOverall),
    status: "pending",
    createdAt: Date.now(),
  };

  const offers = getOffers();
  offers.push(offer);
  saveOffers(offers);
  return offer;
};

/** Busca ofertas recebidas por um time (pendentes) */
export const getReceivedOffers = (teamName: string): TransferOffer[] => {
  return getOffers().filter(
    (o) => o.toTeam.toLowerCase() === teamName.toLowerCase() && o.status === "pending"
  );
};

/** Busca ofertas enviadas por um time (pendentes) */
export const getSentOffers = (teamName: string): TransferOffer[] => {
  return getOffers().filter(
    (o) => o.fromTeam.toLowerCase() === teamName.toLowerCase() && o.status === "pending"
  );
};

/** Conta ofertas pendentes recebidas */
export const countPendingOffers = (teamName: string): number => {
  return getReceivedOffers(teamName).length;
};

/** Aceitar oferta - transfere o jogador */
export const acceptOffer = (
  offerId: string,
  onTransferComplete: (offer: TransferOffer) => void
): TransferOffer | null => {
  const offers = getOffers();
  const offerIdx = offers.findIndex((o) => o.id === offerId);
  if (offerIdx === -1) return null;

  const offer = offers[offerIdx];
  offer.status = "accepted";

  // Remove todas as outras ofertas pendentes pelo mesmo jogador
  const filtered = offers.filter(
    (o) => o.id === offerId || o.playerId !== offer.playerId || o.status !== "pending"
  );
  // Update the accepted one
  const acceptedIdx = filtered.findIndex((o) => o.id === offerId);
  if (acceptedIdx !== -1) filtered[acceptedIdx] = offer;

  saveOffers(filtered);

  // Efetuar a transferência no localStorage
  transferPlayer(offer);
  onTransferComplete(offer);

  return offer;
};

/** Recusar oferta */
export const rejectOffer = (offerId: string): void => {
  const offers = getOffers();
  const idx = offers.findIndex((o) => o.id === offerId);
  if (idx !== -1) {
    offers[idx].status = "rejected";
    saveOffers(offers);
  }
};

/** IA decide se aceita ou rejeita uma oferta (para times CPU) */
export const cpuDecideOffer = (offer: TransferOffer): "accepted" | "rejected" => {
  const ratio = offer.offerValue / offer.marketValue;

  // Se oferta >= 90% do valor de mercado, aceita
  if (ratio >= 0.9) return "accepted";
  // Se oferta >= 70%, 50% de chance
  if (ratio >= 0.7) return Math.random() > 0.5 ? "accepted" : "rejected";
  // Se oferta >= 50%, 20% de chance
  if (ratio >= 0.5) return Math.random() > 0.8 ? "accepted" : "rejected";
  // Abaixo de 50%, rejeita
  return "rejected";
};

/** Processa ofertas pendentes para times CPU (chamado ao abrir o turno) */
export const processCpuOffers = (
  humanTeams: string[]
): { accepted: TransferOffer[]; rejected: TransferOffer[] } => {
  const offers = getOffers();
  const accepted: TransferOffer[] = [];
  const rejected: TransferOffer[] = [];

  const updated = offers.map((o) => {
    if (o.status !== "pending") return o;
    // Se o dono é um time humano, não processar automaticamente
    if (humanTeams.some((t) => t.toLowerCase() === o.toTeam.toLowerCase())) return o;

    const decision = cpuDecideOffer(o);
    o.status = decision;
    if (decision === "accepted") {
      transferPlayer(o);
      accepted.push(o);
    } else {
      rejected.push(o);
    }
    return o;
  });

  // Remove ofertas pendentes para jogadores que foram aceitos
  const acceptedPlayerIds = accepted.map((a) => a.playerId);
  const cleaned = updated.filter(
    (o) =>
      !acceptedPlayerIds.includes(o.playerId) ||
      o.status !== "pending"
  );

  saveOffers(cleaned);
  return { accepted, rejected };
};

/** Descobre o dono atual de um jogador pelo ID */
export const findPlayerOwner = (playerId: string, allTeamNames: string[]): string | null => {
  for (const teamName of allTeamNames) {
    const raw = localStorage.getItem(`players_${teamName}`);
    if (!raw) continue;
    const players: Player[] = JSON.parse(raw);
    if (players.some((p) => p.id === playerId)) return teamName;
  }
  return null;
};

// ==================== INTERNAL ====================

/** Transfere o jogador entre times no localStorage */
const transferPlayer = (offer: TransferOffer) => {
  // 1) Remover do time de origem (toTeam = dono atual)
  const ownerKey = `players_${offer.toTeam}`;
  const ownerRaw = localStorage.getItem(ownerKey);
  if (ownerRaw) {
    const ownerPlayers: Player[] = JSON.parse(ownerRaw);
    const playerData = ownerPlayers.find((p) => p.id === offer.playerId);
    const filtered = ownerPlayers.filter((p) => p.id !== offer.playerId);
    localStorage.setItem(ownerKey, JSON.stringify(filtered));

    // 2) Adicionar ao time comprador (fromTeam)
    if (playerData) {
      const buyerKey = `players_${offer.fromTeam}`;
      const buyerRaw = localStorage.getItem(buyerKey);
      const buyerPlayers: Player[] = buyerRaw ? JSON.parse(buyerRaw) : [];
      buyerPlayers.push({ ...playerData, isStarter: false });
      localStorage.setItem(buyerKey, JSON.stringify(buyerPlayers));
    }
  }

  // 3) Atualizar budgets
  // Dono recebe dinheiro
  const ownerBudgetKey = `budget_${offer.toTeam}`;
  const ownerBudget = parseFloat(localStorage.getItem(ownerBudgetKey) || "0");
  localStorage.setItem(ownerBudgetKey, JSON.stringify(ownerBudget + offer.offerValue));

  // Comprador paga
  const buyerBudgetKey = `budget_${offer.fromTeam}`;
  const buyerBudget = parseFloat(localStorage.getItem(buyerBudgetKey) || "0");
  localStorage.setItem(buyerBudgetKey, JSON.stringify(buyerBudget - offer.offerValue));
};

/** Limpa todas as ofertas (para reset de campeonato) */
export const clearAllOffers = () => {
  localStorage.removeItem(OFFERS_KEY);
};
