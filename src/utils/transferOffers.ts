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
  status: "pending" | "accepted" | "rejected" | "counter";
  createdAt: number;
  counterValue?: number;   // valor da contraproposta (quando status = "counter")
  isFromCpu?: boolean;     // oferta feita pela CPU
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
  offerValue: number,
  isFromCpu: boolean = false
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
    isFromCpu,
  };

  const offers = getOffers();
  offers.push(offer);
  saveOffers(offers);
  return offer;
};

/** Busca ofertas recebidas por um time (pendentes + contrapropostas) */
export const getReceivedOffers = (teamName: string): TransferOffer[] => {
  return getOffers().filter(
    (o) => o.toTeam.toLowerCase() === teamName.toLowerCase() && (o.status === "pending")
  );
};

/** Busca contrapropostas recebidas (ofertas que EU enviei e a CPU fez contraproposta) */
export const getCounterOffers = (teamName: string): TransferOffer[] => {
  return getOffers().filter(
    (o) => o.fromTeam.toLowerCase() === teamName.toLowerCase() && o.status === "counter"
  );
};

/** Busca ofertas enviadas por um time (pendentes) */
export const getSentOffers = (teamName: string): TransferOffer[] => {
  return getOffers().filter(
    (o) => o.fromTeam.toLowerCase() === teamName.toLowerCase() && (o.status === "pending" || o.status === "counter")
  );
};

/** Conta ofertas pendentes recebidas + contrapropostas recebidas */
export const countPendingOffers = (teamName: string): number => {
  return getReceivedOffers(teamName).length + getCounterOffers(teamName).length;
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
    (o) => o.id === offerId || o.playerId !== offer.playerId || (o.status !== "pending" && o.status !== "counter")
  );
  const acceptedIdx = filtered.findIndex((o) => o.id === offerId);
  if (acceptedIdx !== -1) filtered[acceptedIdx] = offer;

  saveOffers(filtered);

  // Efetuar a transferência no localStorage
  transferPlayer(offer);
  onTransferComplete(offer);

  return offer;
};

/** Aceitar contraproposta da CPU (pagar o counterValue) */
export const acceptCounterOffer = (
  offerId: string,
  onTransferComplete: (offer: TransferOffer) => void
): TransferOffer | null => {
  const offers = getOffers();
  const offerIdx = offers.findIndex((o) => o.id === offerId);
  if (offerIdx === -1) return null;

  const offer = offers[offerIdx];
  // Atualizar o valor da oferta para o counterValue
  offer.offerValue = offer.counterValue || offer.offerValue;
  offer.status = "accepted";

  const filtered = offers.filter(
    (o) => o.id === offerId || o.playerId !== offer.playerId || (o.status !== "pending" && o.status !== "counter")
  );
  const acceptedIdx = filtered.findIndex((o) => o.id === offerId);
  if (acceptedIdx !== -1) filtered[acceptedIdx] = offer;

  saveOffers(filtered);

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

/** IA decide se aceita, rejeita ou faz contraproposta */
export const cpuDecideOffer = (offer: TransferOffer): { decision: "accepted" | "rejected" | "counter"; counterValue?: number } => {
  const ratio = offer.offerValue / offer.marketValue;

  // >= 100% do valor de mercado
  if (ratio >= 1.0) {
    // 20% chance de pedir mais mesmo assim
    if (Math.random() < 0.2) {
      const extraPct = 1.05 + Math.random() * 0.15; // 105% a 120%
      return { decision: "counter", counterValue: Math.round(offer.marketValue * extraPct) };
    }
    return { decision: "accepted" };
  }

  // >= 91% do valor de mercado: aceita
  if (ratio >= 0.91) {
    // 40% chance de aceitar direto, 40% contraproposta, 20% rejeitar
    const roll = Math.random();
    if (roll < 0.4) return { decision: "accepted" };
    if (roll < 0.8) {
      const counterPct = 1.0 + Math.random() * 0.1; // 100% a 110%
      return { decision: "counter", counterValue: Math.round(offer.marketValue * counterPct) };
    }
    return { decision: "rejected" };
  }

  // >= 70%: 40% aceitar, 30% contraproposta, 30% recusar
  if (ratio >= 0.7) {
    const roll = Math.random();
    if (roll < 0.4) return { decision: "accepted" };
    if (roll < 0.7) {
      const counterPct = 0.95 + Math.random() * 0.15; // 95% a 110%
      return { decision: "counter", counterValue: Math.round(offer.marketValue * counterPct) };
    }
    return { decision: "rejected" };
  }

  // >= 50%: 20% aceitar, 30% contraproposta, 50% recusar
  if (ratio >= 0.5) {
    const roll = Math.random();
    if (roll < 0.2) return { decision: "accepted" };
    if (roll < 0.5) {
      const counterPct = 0.9 + Math.random() * 0.2; // 90% a 110%
      return { decision: "counter", counterValue: Math.round(offer.marketValue * counterPct) };
    }
    return { decision: "rejected" };
  }

  // < 50%: 5% aceitar, 25% contraproposta, 70% recusar
  const roll = Math.random();
  if (roll < 0.05) return { decision: "accepted" };
  if (roll < 0.3) {
    const counterPct = 0.95 + Math.random() * 0.2; // 95% a 115%
    return { decision: "counter", counterValue: Math.round(offer.marketValue * counterPct) };
  }
  return { decision: "rejected" };
};

/** Processa ofertas pendentes para times CPU (chamado ao abrir o turno) */
export const processCpuOffers = (
  humanTeams: string[]
): { accepted: TransferOffer[]; rejected: TransferOffer[]; countered: TransferOffer[] } => {
  const offers = getOffers();
  const accepted: TransferOffer[] = [];
  const rejected: TransferOffer[] = [];
  const countered: TransferOffer[] = [];

  const updated = offers.map((o) => {
    if (o.status !== "pending") return o;
    // Se o dono é um time humano, não processar automaticamente
    if (humanTeams.some((t) => t.toLowerCase() === o.toTeam.toLowerCase())) return o;

    const { decision, counterValue } = cpuDecideOffer(o);
    if (decision === "accepted") {
      o.status = "accepted";
      transferPlayer(o);
      accepted.push(o);
    } else if (decision === "counter") {
      o.status = "counter";
      o.counterValue = counterValue;
      countered.push(o);
    } else {
      o.status = "rejected";
      rejected.push(o);
    }
    return o;
  });

  // Remove ofertas pendentes para jogadores que foram aceitos
  const acceptedPlayerIds = accepted.map((a) => a.playerId);
  const cleaned = updated.filter(
    (o) =>
      !acceptedPlayerIds.includes(o.playerId) ||
      (o.status !== "pending" && o.status !== "counter")
  );

  saveOffers(cleaned);
  return { accepted, rejected, countered };
};

/** CPU faz ofertas ativamente por jogadores de outros times */
export const generateCpuOffers = (
  humanTeams: string[],
  allTeamNames: string[],
  maxOffers: number = 2
): TransferOffer[] => {
  const cpuTeams = allTeamNames.filter(
    (t) => !humanTeams.some((h) => h.toLowerCase() === t.toLowerCase())
  );

  if (cpuTeams.length === 0) return [];

  const generated: TransferOffer[] = [];
  const existingOffers = getOffers();

  // Cada turno, 1-2 CPUs tentam comprar jogadores
  const numAttempts = Math.min(maxOffers, Math.ceil(Math.random() * 3));

  for (let i = 0; i < numAttempts; i++) {
    const buyerTeam = cpuTeams[Math.floor(Math.random() * cpuTeams.length)];
    // Alvo pode ser humano ou CPU (não o próprio)
    const targetTeams = allTeamNames.filter((t) => t.toLowerCase() !== buyerTeam.toLowerCase());
    if (targetTeams.length === 0) continue;

    const targetTeam = targetTeams[Math.floor(Math.random() * targetTeams.length)];
    const raw = localStorage.getItem(`players_${targetTeam}`);
    if (!raw) continue;

    const players: Player[] = JSON.parse(raw);
    if (players.length === 0) continue;

    // Escolher um jogador aleatório (preferência por melhores)
    const sorted = [...players].sort((a, b) => b.overall - a.overall);
    const topPlayers = sorted.slice(0, Math.min(5, sorted.length));
    const target = topPlayers[Math.floor(Math.random() * topPlayers.length)];

    // Verificar se já existe oferta pendente
    const alreadyHasOffer = existingOffers.some(
      (o) => o.playerId === target.id && (o.status === "pending" || o.status === "counter") && o.fromTeam.toLowerCase() === buyerTeam.toLowerCase()
    );
    if (alreadyHasOffer) continue;

    // CPU oferece entre 110% e 130% do valor de mercado
    const mktValue = calculateMarketValue(target);
    const offerPct = 1.1 + Math.random() * 0.2; // 110% a 130%
    const offerValue = Math.round(mktValue * offerPct);

    // Verificar se CPU tem budget
    const budgetRaw = localStorage.getItem(`budget_${buyerTeam}`);
    const cpuBudget = budgetRaw ? parseFloat(budgetRaw) : 5000000;
    if (offerValue > cpuBudget) continue;

    const offer = sendOffer(
      target.id,
      target.name,
      target.overall,
      target.position,
      buyerTeam,
      targetTeam,
      offerValue,
      true
    );
    generated.push(offer);
  }

  return generated;
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
  const ownerBudgetKey = `budget_${offer.toTeam}`;
  const ownerBudget = parseFloat(localStorage.getItem(ownerBudgetKey) || "0");
  localStorage.setItem(ownerBudgetKey, JSON.stringify(ownerBudget + offer.offerValue));

  const buyerBudgetKey = `budget_${offer.fromTeam}`;
  const buyerBudget = parseFloat(localStorage.getItem(buyerBudgetKey) || "0");
  localStorage.setItem(buyerBudgetKey, JSON.stringify(buyerBudget - offer.offerValue));
};

/** Limpa todas as ofertas (para reset de campeonato) */
export const clearAllOffers = () => {
  localStorage.removeItem(OFFERS_KEY);
};
