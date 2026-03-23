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
  status: "pending" | "accepted" | "rejected" | "counter" | "expired";
  createdAt: number;
  counterValue?: number;   // valor da contraproposta (quando status = "counter")
  isFromCpu?: boolean;     // oferta feita pela CPU
  matchesPassed: number;   // quantas partidas se passaram desde a oferta
  escrowDeducted: boolean; // dinheiro já foi retirado do comprador
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

/** Deduz valor do caixa do comprador (escrow) */
const deductBudget = (teamName: string, amount: number) => {
  const key = `budget_${teamName}`;
  const current = parseFloat(localStorage.getItem(key) || "0");
  localStorage.setItem(key, JSON.stringify(current - amount));
};

/** Adiciona valor ao caixa */
const addBudget = (teamName: string, amount: number) => {
  const key = `budget_${teamName}`;
  const current = parseFloat(localStorage.getItem(key) || "0");
  localStorage.setItem(key, JSON.stringify(current + amount));
};

// ==================== PUBLIC API ====================

/** Envia uma oferta por um jogador — dinheiro é DEDUZIDO imediatamente */
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
    matchesPassed: 0,
    escrowDeducted: true,
  };

  // Deduzir dinheiro do comprador imediatamente (escrow)
  deductBudget(fromTeam, offerValue);

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

/** Aceitar oferta - transfere o jogador. Dinheiro já foi deduzido do comprador; agora credita o vendedor. */
export const acceptOffer = (
  offerId: string,
  onTransferComplete: (offer: TransferOffer) => void
): TransferOffer | null => {
  const offers = getOffers();
  const offerIdx = offers.findIndex((o) => o.id === offerId);
  if (offerIdx === -1) return null;

  const offer = offers[offerIdx];
  offer.status = "accepted";

  // Remove todas as outras ofertas pendentes pelo mesmo jogador e reembolsa
  const filtered = offers.filter((o) => {
    if (o.id === offerId) return true;
    if (o.playerId === offer.playerId && (o.status === "pending" || o.status === "counter")) {
      // Reembolsar quem fez essas outras ofertas
      if (o.escrowDeducted) {
        addBudget(o.fromTeam, o.offerValue);
      }
      return false;
    }
    return true;
  });

  const acceptedIdx = filtered.findIndex((o) => o.id === offerId);
  if (acceptedIdx !== -1) filtered[acceptedIdx] = offer;

  saveOffers(filtered);

  // Transferir jogador (sem mexer no budget do comprador, já foi deduzido)
  transferPlayer(offer);
  onTransferComplete(offer);

  return offer;
};

/** Aceitar contraproposta — escrow já foi devolvido, agora deduz o valor da contraproposta */
export const acceptCounterOffer = (
  offerId: string,
  onTransferComplete: (offer: TransferOffer) => void
): TransferOffer | null => {
  const offers = getOffers();
  const offerIdx = offers.findIndex((o) => o.id === offerId);
  if (offerIdx === -1) return null;

  const offer = offers[offerIdx];
  const counterValue = offer.counterValue || offer.offerValue;

  // Deduzir o valor total da contraproposta (escrow já foi devolvido)
  deductBudget(offer.fromTeam, counterValue);

  offer.offerValue = counterValue;
  offer.status = "accepted";
  offer.escrowDeducted = true;

  const filtered = offers.filter((o) => {
    if (o.id === offerId) return true;
    if (o.playerId === offer.playerId && (o.status === "pending" || o.status === "counter")) {
      if (o.escrowDeducted) addBudget(o.fromTeam, o.offerValue);
      return false;
    }
    return true;
  });
  const acceptedIdx = filtered.findIndex((o) => o.id === offerId);
  if (acceptedIdx !== -1) filtered[acceptedIdx] = offer;

  saveOffers(filtered);
  transferPlayer(offer);
  onTransferComplete(offer);

  return offer;
};

/** Recusar oferta — reembolsa o comprador */
export const rejectOffer = (offerId: string): void => {
  const offers = getOffers();
  const idx = offers.findIndex((o) => o.id === offerId);
  if (idx !== -1) {
    const offer = offers[idx];
    // Reembolsar o comprador
    if (offer.escrowDeducted) {
      addBudget(offer.fromTeam, offer.offerValue);
    }
    offers[idx].status = "rejected";
    saveOffers(offers);
  }
};

/** IA decide se aceita, rejeita ou faz contraproposta */
export const cpuDecideOffer = (offer: TransferOffer): { decision: "accepted" | "rejected" | "counter"; counterValue?: number } => {
  const ratio = offer.offerValue / offer.marketValue;

  if (ratio >= 1.0) {
    if (Math.random() < 0.2) {
      const extraPct = 1.05 + Math.random() * 0.15;
      return { decision: "counter", counterValue: Math.round(offer.marketValue * extraPct) };
    }
    return { decision: "accepted" };
  }

  if (ratio >= 0.91) {
    const roll = Math.random();
    if (roll < 0.4) return { decision: "accepted" };
    if (roll < 0.8) {
      const counterPct = 1.0 + Math.random() * 0.1;
      return { decision: "counter", counterValue: Math.round(offer.marketValue * counterPct) };
    }
    return { decision: "rejected" };
  }

  if (ratio >= 0.7) {
    const roll = Math.random();
    if (roll < 0.4) return { decision: "accepted" };
    if (roll < 0.7) {
      const counterPct = 0.95 + Math.random() * 0.15;
      return { decision: "counter", counterValue: Math.round(offer.marketValue * counterPct) };
    }
    return { decision: "rejected" };
  }

  if (ratio >= 0.5) {
    const roll = Math.random();
    if (roll < 0.2) return { decision: "accepted" };
    if (roll < 0.5) {
      const counterPct = 0.9 + Math.random() * 0.2;
      return { decision: "counter", counterValue: Math.round(offer.marketValue * counterPct) };
    }
    return { decision: "rejected" };
  }

  const roll = Math.random();
  if (roll < 0.05) return { decision: "accepted" };
  if (roll < 0.3) {
    const counterPct = 0.95 + Math.random() * 0.2;
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
      // Devolver o escrow original — jogador decide se paga o novo valor
      if (o.escrowDeducted) {
        addBudget(o.fromTeam, o.offerValue);
        o.escrowDeducted = false;
      }
      countered.push(o);
    } else {
      o.status = "rejected";
      if (o.escrowDeducted) {
        addBudget(o.fromTeam, o.offerValue);
        o.escrowDeducted = false;
      }
      rejected.push(o);
    }
    return o;
  });

  // Remove ofertas pendentes para jogadores que foram aceitos
  const acceptedPlayerIds = accepted.map((a) => a.playerId);
  const cleaned = updated.filter((o) => {
    if (acceptedPlayerIds.includes(o.playerId) && (o.status === "pending" || o.status === "counter")) {
      // Reembolsar outras ofertas pelo mesmo jogador
      if (o.escrowDeducted) addBudget(o.fromTeam, o.offerValue);
      return false;
    }
    return true;
  });

  saveOffers(cleaned);
  return { accepted, rejected, countered };
};

/**
 * Chamado após cada partida para incrementar o contador de partidas.
 * - Ofertas para CPU: resolvidas em 1 partida (já tratadas em processCpuOffers)
 * - Ofertas Player vs Player: expiram após 3 partidas sem resposta
 */
export const tickOffers = (teamName: string): { expired: TransferOffer[] } => {
  const offers = getOffers();
  const expired: TransferOffer[] = [];

  const updated = offers.map((o) => {
    if (o.status !== "pending" && o.status !== "counter") return o;

    // Só incrementar para ofertas feitas por este time ou destinadas a este time
    if (
      o.fromTeam.toLowerCase() === teamName.toLowerCase() ||
      o.toTeam.toLowerCase() === teamName.toLowerCase()
    ) {
      o.matchesPassed = (o.matchesPassed || 0) + 1;

      // Player vs Player: expira após 3 partidas
      const maxMatches = o.isFromCpu ? 1 : 3;
      if (o.matchesPassed >= maxMatches && !o.isFromCpu) {
        o.status = "expired";
        // Reembolsar o comprador
        if (o.escrowDeducted) {
          addBudget(o.fromTeam, o.offerValue);
        }
        expired.push(o);
      }
    }

    return o;
  });

  saveOffers(updated);
  return { expired };
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

  const numAttempts = Math.min(maxOffers, Math.ceil(Math.random() * 3));

  for (let i = 0; i < numAttempts; i++) {
    const buyerTeam = cpuTeams[Math.floor(Math.random() * cpuTeams.length)];
    const targetTeams = allTeamNames.filter((t) => t.toLowerCase() !== buyerTeam.toLowerCase());
    if (targetTeams.length === 0) continue;

    const targetTeam = targetTeams[Math.floor(Math.random() * targetTeams.length)];
    const raw = localStorage.getItem(`players_${targetTeam}`);
    if (!raw) continue;

    const players: Player[] = JSON.parse(raw);
    if (players.length === 0) continue;

    const sorted = [...players].sort((a, b) => b.overall - a.overall);
    const topPlayers = sorted.slice(0, Math.min(5, sorted.length));
    const target = topPlayers[Math.floor(Math.random() * topPlayers.length)];

    const alreadyHasOffer = existingOffers.some(
      (o) => o.playerId === target.id && (o.status === "pending" || o.status === "counter") && o.fromTeam.toLowerCase() === buyerTeam.toLowerCase()
    );
    if (alreadyHasOffer) continue;

    const mktValue = calculateMarketValue(target);
    const offerPct = 1.1 + Math.random() * 0.2;
    const offerValue = Math.round(mktValue * offerPct);

    // Verificar budget antes de deduzir (sendOffer deduz automaticamente)
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

/** Transfere o jogador entre times no localStorage. Budget do comprador já foi deduzido via escrow. */
const transferPlayer = (offer: TransferOffer) => {
  // 1) Remover do time vendedor (toTeam = dono atual)
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

  // 3) Creditar o vendedor (comprador já pagou via escrow)
  addBudget(offer.toTeam, offer.offerValue);
};

/** Limpa todas as ofertas (para reset de campeonato) */
export const clearAllOffers = () => {
  localStorage.removeItem(OFFERS_KEY);
};
