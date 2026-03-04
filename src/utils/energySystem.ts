import { Player } from "@/data/players";

/**
 * Calcula o desgaste de energia de um jogador titular após uma partida.
 */
export const calculateEnergyDrain = (player: Player): number => {
  const consecutive = player.consecutiveMatches ?? 0;

  // Base: -10, +3 por partida consecutiva adicional
  const baseDrain = 10 + consecutive * 3;

  // Modificador por OVR
  let modifier = 1;
  if (player.overall >= 85) {
    modifier = 0.8; // -20% desgaste
  } else if (player.overall < 75) {
    modifier = 1.15; // +15% desgaste
  }

  return Math.round(baseDrain * modifier);
};

/**
 * Aplica desgaste nos titulares e recuperação nos reservas após uma rodada.
 * Retorna o array atualizado.
 */
export const applyEnergyChanges = (players: Player[]): Player[] => {
  return players.map((player) => {
    const currentEnergy = player.energy ?? 100;

    if (player.isStarter) {
      // Titular jogou → perde energia, incrementa consecutivas
      const drain = calculateEnergyDrain(player);
      return {
        ...player,
        energy: Math.max(0, currentEnergy - drain),
        consecutiveMatches: (player.consecutiveMatches ?? 0) + 1,
      };
    } else {
      // Reserva → recupera +15, reseta consecutivas
      return {
        ...player,
        energy: Math.min(100, currentEnergy + 15),
        consecutiveMatches: 0,
      };
    }
  });
};
