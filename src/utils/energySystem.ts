import { Player } from "@/data/players";

/**
 * Taxa de desgaste de energia por minuto de jogo, por posição.
 */
const ENERGY_DRAIN_PER_MINUTE: Record<string, number> = {
  ATA: 1.2,
  PE: 1.3,
  PD: 1.3,
  MC: 1.1,
  MEI: 1.1,
  VOL: 1.0,
  LD: 1.0,
  LE: 1.0,
  ZAG: 0.8,
  GOL: 0.3,
};

/**
 * Inicializa matchEnergy a partir de energy no início da partida.
 */
export const initMatchEnergy = (players: Player[]): Player[] => {
  return players.map(p => ({
    ...p,
    matchEnergy: p.energy ?? 100,
  }));
};

/**
 * Calcula a energia de um jogador após 1 minuto de jogo.
 * Usa matchEnergy durante a partida.
 */
export const drainEnergyPerMinute = (player: Player): number => {
  const current = player.matchEnergy ?? player.energy ?? 100;
  const rate = ENERGY_DRAIN_PER_MINUTE[player.position] ?? 1.0;
  return Math.max(0, +(current - rate).toFixed(1));
};

/**
 * Retorna o penalty de OVR baseado na matchEnergy atual.
 */
export const getEnergyOvrPenalty = (energy: number): number => {
  if (energy < 20) return -6;
  if (energy < 40) return -3;
  return 0;
};

/**
 * Retorna o OVR efetivo considerando penalidade de energia (usa matchEnergy).
 */
export const getEffectiveOverall = (player: Player): number => {
  const energy = player.matchEnergy ?? player.energy ?? 100;
  return Math.max(1, player.overall + getEnergyOvrPenalty(energy));
};

/**
 * Finaliza a partida: salva matchEnergy em energy, aplica desgaste extra,
 * e atualiza consecutiveMatches.
 */
export const finalizeMatchEnergy = (players: Player[]): Player[] => {
  return players.map(p => {
    if (p.isStarter) {
      const matchE = p.matchEnergy ?? p.energy ?? 100;
      const extraDrain = Math.floor(Math.random() * 4) + 3; // 3 a 6
      const finalEnergy = Math.max(0, Math.min(100, matchE - extraDrain));
      return {
        ...p,
        energy: finalEnergy,
        matchEnergy: undefined,
        consecutiveMatches: (p.consecutiveMatches ?? 0) + 1,
      };
    } else {
      return {
        ...p,
        matchEnergy: undefined,
        consecutiveMatches: 0,
      };
    }
  });
};

/**
 * Aplica recuperação de energia entre partidas (antes da próxima partida).
 * - Titular: +3
 * - Reserva: +15
 */
export const applyEnergyRecovery = (players: Player[]): Player[] => {
  return players.map(p => {
    const currentEnergy = p.energy ?? 100;
    if (p.isStarter) {
      return {
        ...p,
        energy: Math.min(100, currentEnergy + 3),
      };
    } else {
      return {
        ...p,
        energy: Math.min(100, currentEnergy + 15),
        consecutiveMatches: 0,
      };
    }
  });
};

/**
 * Calcula o desgaste de energia de um jogador titular após uma partida (entre rodadas).
 * Usado na simulação (MatchCard).
 */
export const calculateEnergyDrain = (player: Player): number => {
  const consecutive = player.consecutiveMatches ?? 0;
  const baseDrain = 10 + consecutive * 3;
  let modifier = 1;
  if (player.overall >= 85) {
    modifier = 0.8;
  } else if (player.overall < 75) {
    modifier = 1.15;
  }
  return Math.round(baseDrain * modifier);
};

/**
 * Aplica desgaste nos titulares e recuperação nos reservas após simulação.
 */
export const applyEnergyChanges = (players: Player[]): Player[] => {
  return players.map((player) => {
    const currentEnergy = player.energy ?? 100;
    if (player.isStarter) {
      const drain = calculateEnergyDrain(player);
      return {
        ...player,
        energy: Math.max(0, currentEnergy - drain),
        consecutiveMatches: (player.consecutiveMatches ?? 0) + 1,
      };
    } else {
      return {
        ...player,
        energy: Math.min(100, currentEnergy + 15),
        consecutiveMatches: 0,
      };
    }
  });
};
