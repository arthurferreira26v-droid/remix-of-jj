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
 * Desgaste de energia por jogo por posição.
 * Calibrado para que após 6 jogos consecutivos, jogador chegue a ~20%.
 * Fórmula: 100% → ~20% em 6 jogos = perda de ~13.3% por jogo
 */
const ENERGY_DRAIN_PER_MATCH: Record<string, number> = {
  ATA: 14,
  PE: 15,
  PD: 15,
  MC: 13,
  MEI: 13,
  VOL: 12,
  LD: 12,
  LE: 12,
  ZAG: 11,
  GOL: 8,
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
 * Finaliza a partida: aplica desgaste aos titulares, recuperação total aos reservas.
 * Calibrado para ~20% após 6 jogos consecutivos.
 */
export const finalizeMatchEnergy = (players: Player[]): Player[] => {
  return players.map(p => {
    if (p.isStarter) {
      const currentEnergy = p.energy ?? 100;
      const drain = ENERGY_DRAIN_PER_MATCH[p.position] ?? 13;
      const consecutive = (p.consecutiveMatches ?? 0) + 1;
      
      // Desgaste fixo por jogo (sem recuperação para titulares)
      const finalEnergy = Math.max(0, currentEnergy - drain);
      
      return {
        ...p,
        energy: finalEnergy,
        matchEnergy: undefined,
        consecutiveMatches: consecutive,
        seasonStarterMatches: (p.seasonStarterMatches ?? 0) + 1,
      };
    } else {
      // Quem não jogou recupera totalmente
      return {
        ...p,
        energy: 100,
        matchEnergy: undefined,
        consecutiveMatches: 0,
        seasonBenchMatches: (p.seasonBenchMatches ?? 0) + 1,
      };
    }
  });
};

/**
 * Aplica recuperação de energia entre partidas.
 * - Reserva: volta para 100%
 * - Titular: sem recuperação automática (precisa descansar para recuperar)
 */
export const applyEnergyRecovery = (players: Player[]): Player[] => {
  return players.map(p => {
    if (!p.isStarter) {
      return {
        ...p,
        energy: 100,
        consecutiveMatches: 0,
      };
    }
    return p;
  });
};

/**
 * Calcula a energia média do elenco (0-100).
 */
export const getSquadAverageEnergy = (players: Player[]): number => {
  if (players.length === 0) return 100;
  const total = players.reduce((sum, p) => sum + (p.energy ?? 100), 0);
  return Math.round(total / players.length);
};

/**
 * Calcula o desgaste de energia de um jogador titular após uma partida.
 * Calibrado: 6 jogos seguidos → ~20% energia.
 */
export const calculateEnergyDrain = (player: Player): number => {
  return ENERGY_DRAIN_PER_MATCH[player.position] ?? 13;
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
        energy: 100,
        consecutiveMatches: 0,
      };
    }
  });
};
