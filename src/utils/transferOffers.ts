import { Player } from "@/data/players";
import { getLocalBudget, saveLocalBudget } from "@/utils/localChampionship";
import { calculateMarketValue } from "@/utils/marketValue";
import { addPlayerToTeamRoster, getTeamRosterPlayers, removePlayerFromTeamRoster } from "@/utils/teamRoster";

// ==================== TYPES ====================

export interface TransferOffer {
  id: string;
  playerId: string;
  playerUniqueKey: string;
  playerName: string;
  playerOverall: number;
  playerPosition: string;
  playerData?: Player;     // dados completos do jogador para fallback
  fromTeam: string;       // quem fez a oferta
  toTeam: string;         // dono atual do jogador
  offerValue: number;
  marketValue: number;     // valor base para referência
  status: "pending" | "accepted" | "rejected" | "counter" | "expired" | "claimed";
  createdAt: number;
  counterValue?: number;   // valor da contraproposta (quando status = "counter")
  isFromCpu?: boolean;     // oferta feita pela CPU
  matchesPassed: number;   // quantas partidas se passaram desde a oferta
  escrowDeducted: boolean; // dinheiro já foi retirado do comprador
}

// ==================== STORAGE KEYS ====================

const OFFERS_KEY = "transfer_offers";

const getPlayerUniqueKey = (playerId: string, ownerTeam: string) => `${ownerTeam.toLowerCase()}::${playerId}`;

// ==================== HELPERS ====================

const getOffers = (): TransferOffer[] => {
  const raw = localStorage.getItem(OFFERS_KEY);
  if (!raw) return [];

  const offers = JSON.parse(raw) as TransferOffer[];
  return offers.map((offer) => ({
    ...offer,
    playerUniqueKey: offer.playerUniqueKey || getPlayerUniqueKey(offer.playerId, offer.toTeam),
  }));
};

const saveOffers = (offers: TransferOffer[]) => {
  localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));
};

/** Deduz valor do caixa do comprador (escrow) */
const deductBudget = (teamName: string, amount: number) => {
  const current = getLocalBudget(teamName);
  if (amount > current) {
    throw new Error("insufficient_budget");
  }
  saveLocalBudget(teamName, current - amount);
};

/** Adiciona valor ao caixa */
const addBudget = (teamName: string, amount: number) => {
  const current = getLocalBudget(teamName);
  saveLocalBudget(teamName, current + amount);
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
  isFromCpu: boolean = false,
  fullPlayerData?: Player
): TransferOffer => {
  if (fromTeam.toLowerCase() === toTeam.toLowerCase()) {
    throw new Error("same_team_offer");
  }

  deductBudget(fromTeam, offerValue);

  const offer: TransferOffer = {
    id: `offer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    playerId,
    playerUniqueKey: getPlayerUniqueKey(playerId, toTeam),
    playerName,
    playerOverall,
    playerPosition,
    playerData: fullPlayerData,
    fromTeam,
    toTeam,
    offerValue,
    marketValue: calculateMarketValue(fullPlayerData ?? playerOverall),
    status: "pending",
    createdAt: Date.now(),
    isFromCpu,
    matchesPassed: 0,
    escrowDeducted: true,
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

/** Busca contrapropostas recebidas (ofertas que EU enviei e a CPU fez contraproposta) */
export const getCounterOffers = (teamName: string): TransferOffer[] => {
  return getOffers().filter(
    (o) => o.fromTeam.toLowerCase() === teamName.toLowerCase() && o.status === "counter"
  );
};

/** Busca ofertas enviadas por um time (pendentes) */
export const getSentOffers = (teamName: string): TransferOffer[] => {
  return getOffers().filter(
    (o) => o.fromTeam.toLowerCase() === teamName.toLowerCase() && (o.status === "pending" || o.status === "counter" || o.status === "accepted" || o.status === "rejected")
  );
};

/** Marca oferta aceita como resgatada (jogador já confirmou recebimento) */
export const claimOffer = (offerId: string): TransferOffer | null => {
  const offers = getOffers();
  const idx = offers.findIndex((o) => o.id === offerId);
  if (idx === -1) return null;

  const offer = offers[idx];
  const sellerStillHasPlayer = getTeamRosterPlayers(offer.toTeam).some((player) => player.id === offer.playerId);
  const buyerAlreadyHasPlayer = getTeamRosterPlayers(offer.fromTeam).some((player) => player.id === offer.playerId);

  if (sellerStillHasPlayer && !buyerAlreadyHasPlayer) {
    transferPlayer(offer);
  }

  offers[idx].status = "claimed";
  saveOffers(offers);
  return offers[idx];
};

/** Limpa ofertas rejeitadas da lista de enviadas */
export const dismissRejectedOffer = (offerId: string): void => {
  const offers = getOffers();
  const idx = offers.findIndex((o) => o.id === offerId);
  if (idx !== -1) {
    offers[idx].status = "expired"; // reutiliza expired para esconder
    saveOffers(offers);
  }
};

/** Conta ofertas pendentes recebidas + contrapropostas recebidas */
export const countPendingOffers = (teamName: string): number => {
  const allOffers = getOffers();
  const tl = teamName.toLowerCase();
  const received = allOffers.filter(o => o.toTeam.toLowerCase() === tl && o.status === "pending").length;
  const counters = allOffers.filter(o => o.fromTeam.toLowerCase() === tl && o.status === "counter").length;
  const pendingActions = allOffers.filter(o => o.fromTeam.toLowerCase() === tl && (o.status === "accepted" || o.status === "rejected")).length;
  return received + counters + pendingActions;
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
    if (o.playerUniqueKey === offer.playerUniqueKey && (o.status === "pending" || o.status === "counter")) {
      // Reembolsar quem fez essas outras ofertas
      if (o.escrowDeducted) {
        addBudget(o.fromTeam, o.offerValue);
        o.escrowDeducted = false;
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
    if (o.playerUniqueKey === offer.playerUniqueKey && (o.status === "pending" || o.status === "counter")) {
      if (o.escrowDeducted) {
        addBudget(o.fromTeam, o.offerValue);
        o.escrowDeducted = false;
      }
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
      offer.escrowDeducted = false;
    }
    offers[idx].status = "rejected";
    saveOffers(offers);
  }
};

/** IA decide se aceita, rejeita ou faz contraproposta */
export const cpuDecideOffer = (offer: TransferOffer): { decision: "accepted" | "rejected" | "counter"; counterValue?: number } => {
  const ratio = offer.offerValue / offer.marketValue;

  // Jogadores 80+ OVR: 20% de chance do time recusar negociar (independente do valor)
  if (offer.playerOverall >= 80 && Math.random() < 0.20) {
    return { decision: "rejected" };
  }

  // Oferta muito abaixo do valor de mercado (< 70%): contraproposta de 115% do valor de mercado
  if (ratio < 0.7) {
    const counterValue = Math.round(offer.marketValue * 1.15);
    return { decision: "counter", counterValue };
  }

  // Oferta entre 70%-90%: pode aceitar, contrapropor ou recusar
  if (ratio < 0.9) {
    const roll = Math.random();
    if (roll < 0.3) return { decision: "accepted" };
    if (roll < 0.7) {
      const counterPct = 1.0 + Math.random() * 0.15;
      return { decision: "counter", counterValue: Math.round(offer.marketValue * counterPct) };
    }
    return { decision: "rejected" };
  }

  // Oferta entre 90%-99%: boa chance de aceitar
  if (ratio < 1.0) {
    const roll = Math.random();
    if (roll < 0.6) return { decision: "accepted" };
    if (roll < 0.85) {
      const counterPct = 1.0 + Math.random() * 0.1;
      return { decision: "counter", counterValue: Math.round(offer.marketValue * counterPct) };
    }
    return { decision: "rejected" };
  }

  // Oferta >= 100% do valor: alta chance de aceitar
  if (Math.random() < 0.85) {
    return { decision: "accepted" };
  }
  const extraPct = 1.05 + Math.random() * 0.1;
  return { decision: "counter", counterValue: Math.round(offer.marketValue * extraPct) };
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
  const acceptedPlayerKeys = accepted.map((a) => a.playerUniqueKey);
  const cleaned = updated.filter((o) => {
    if (acceptedPlayerKeys.includes(o.playerUniqueKey) && (o.status === "pending" || o.status === "counter")) {
      // Reembolsar outras ofertas pelo mesmo jogador
      if (o.escrowDeducted) {
        addBudget(o.fromTeam, o.offerValue);
        o.escrowDeducted = false;
      }
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
            o.escrowDeducted = false;
        }
        expired.push(o);
      }
    }

    return o;
  });

  saveOffers(updated);
  return { expired };
};

const CPU_OFFERS_SEASON_KEY_PREFIX = "cpu_offers_season_count";
const CPU_OFFER_MIN_MULTIPLIER = 1.1;
const CPU_OFFER_MAX_MULTIPLIER = 1.4;

const getCpuSeasonOffers = (targetTeam?: string): number => {
  const key = targetTeam ? `${CPU_OFFERS_SEASON_KEY_PREFIX}_${targetTeam}` : CPU_OFFERS_SEASON_KEY_PREFIX;
  const raw = localStorage.getItem(key);
  return raw ? parseInt(raw, 10) : 0;
};

const saveCpuSeasonOffers = (count: number, targetTeam?: string) => {
  const key = targetTeam ? `${CPU_OFFERS_SEASON_KEY_PREFIX}_${targetTeam}` : CPU_OFFERS_SEASON_KEY_PREFIX;
  localStorage.setItem(key, count.toString());
};

const hasActiveOfferForPlayer = (offers: TransferOffer[], playerUniqueKey: string) => {
  return offers.some(
    (offer) =>
      offer.playerUniqueKey === playerUniqueKey &&
      (offer.status === "pending" || offer.status === "counter")
  );
};

const buildCpuOffer = (
  target: Player,
  cpuTeams: string[]
): { buyerTeam: string; offerValue: number } | null => {
  const marketValue = calculateMarketValue(target);
  const minimumOffer = Math.round(marketValue * CPU_OFFER_MIN_MULTIPLIER);

  const eligibleCpuTeams = cpuTeams
    .map((teamName) => ({
      teamName,
      budget: getLocalBudget(teamName),
    }))
    .filter(({ budget }) => budget >= minimumOffer);

  if (eligibleCpuTeams.length === 0) return null;

  const selectedBuyer = eligibleCpuTeams[Math.floor(Math.random() * eligibleCpuTeams.length)];
  const maximumOffer = Math.round(
    Math.min(marketValue * CPU_OFFER_MAX_MULTIPLIER, selectedBuyer.budget)
  );

  if (maximumOffer < minimumOffer) return null;

  const offerValue = Math.round(
    minimumOffer + Math.random() * (maximumOffer - minimumOffer)
  );

  return {
    buyerTeam: selectedBuyer.teamName,
    offerValue,
  };
};

/** Reseta contador de ofertas da CPU (chamar ao iniciar nova temporada) */
export const resetCpuSeasonOffers = () => {
  // Limpa todos os contadores (global e por time)
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CPU_OFFERS_SEASON_KEY_PREFIX));
  keys.forEach(k => localStorage.removeItem(k));
};

/** CPU faz ofertas ativamente por jogadores de times humanos (máx 3 por temporada por jogador humano, mín 1) */
export const generateCpuOffers = (
  humanTeams: string[],
  allTeamNames: string[],
  maxOffers: number = 1
): TransferOffer[] => {
  const MAX_SEASON_OFFERS = 3;

  const cpuTeams = allTeamNames.filter(
    (t) => !humanTeams.some((h) => h.toLowerCase() === t.toLowerCase())
  );
  if (cpuTeams.length === 0) return [];

  const generated: TransferOffer[] = [];
  const existingOffers = getOffers();

  // Gerar ofertas independentemente para cada time humano
  for (const humanTeam of humanTeams) {
    const seasonCount = getCpuSeasonOffers(humanTeam);

    // Já atingiu o limite para este jogador humano
    if (seasonCount >= MAX_SEASON_OFFERS) continue;

    // Chance de gerar oferta nesta rodada (~25-50% por rodada, garante spread)
    if (seasonCount === 0 && Math.random() > 0.5) {
      // 50% de chance para primeira oferta
    } else if (seasonCount > 0 && Math.random() > 0.25) {
      continue; // 75% de chance de pular esta rodada
    }

    const raw = localStorage.getItem(`players_${humanTeam}`);
    if (!raw) continue;

    const players: Player[] = JSON.parse(raw);
    if (players.length === 0) continue;

    const sorted = [...players].sort((a, b) => b.overall - a.overall);
    const topPlayers = sorted.slice(0, Math.min(8, sorted.length));
    const availableTargets = topPlayers.filter((player) => {
      const targetKey = getPlayerUniqueKey(player.id, humanTeam);
      return !hasActiveOfferForPlayer(existingOffers, targetKey);
    });

    if (availableTargets.length === 0) continue;

    const target = availableTargets[Math.floor(Math.random() * availableTargets.length)];
    const cpuOffer = buildCpuOffer(target, cpuTeams);
    if (!cpuOffer) continue;

    const offer = sendOffer(
      target.id,
      target.name,
      target.overall,
      target.position,
      cpuOffer.buyerTeam,
      humanTeam,
      cpuOffer.offerValue,
      true,
      target
    );
    generated.push(offer);
    saveCpuSeasonOffers(seasonCount + 1, humanTeam);
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
  const { removedPlayer } = removePlayerFromTeamRoster(offer.toTeam, offer.playerId);

  const playerData = removedPlayer ?? offer.playerData ?? {
    id: offer.playerId,
    name: offer.playerName,
    number: getTeamRosterPlayers(offer.fromTeam).length + 1,
    position: offer.playerPosition,
    overall: offer.playerOverall,
    age: 25,
    isStarter: false,
    energy: 100,
    consecutiveMatches: 0,
  };

  addPlayerToTeamRoster(offer.fromTeam, playerData);

  // 3) Creditar o vendedor (comprador já pagou via escrow)
  addBudget(offer.toTeam, offer.offerValue);
};

/** Limpa todas as ofertas (para reset de campeonato) */
export const clearAllOffers = () => {
  localStorage.removeItem(OFFERS_KEY);
  resetCpuSeasonOffers();
};
