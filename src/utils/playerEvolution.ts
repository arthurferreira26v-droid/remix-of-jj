import { Player } from "@/data/players";

export interface EvolutionResult {
  player: Player;
  changed: boolean;
  oldOvr: number;
  newOvr: number;
}

const MIN_OVR = 50;
const MAX_OVR = 99;

/**
 * Calcula a mudança de OVR ao final da temporada baseado em idade e titularidade.
 */
const getSeasonOvrChange = (age: number, isStarter: boolean): number => {
  // Veteranos 36+ sempre -2
  if (age >= 36) return -2;

  if (isStarter) {
    if (age >= 16 && age < 24) return +3;
    if (age >= 24 && age < 27) return +2;
    if (age >= 27 && age < 31) return +1;
    // 31-35 titular
    if (age >= 31 && age < 36) return -1;
  } else {
    // Reserva
    if (age >= 16 && age < 24) return +2;
    if (age >= 24 && age < 27) return +1;
    if (age >= 27 && age < 31) return 0;
    // 31-35 reserva
    if (age >= 31 && age < 36) return -2;
  }

  return 0;
};

/**
 * Determina se o jogador foi majoritariamente titular na temporada
 */
const wasSeasonStarter = (player: Player): boolean => {
  const starterMatches = player.seasonStarterMatches ?? 0;
  const benchMatches = player.seasonBenchMatches ?? 0;
  // Se não tiver dados de temporada, usa o status atual
  if (starterMatches === 0 && benchMatches === 0) {
    return player.isStarter ?? false;
  }
  return starterMatches >= benchMatches;
};

/**
 * Evolui o OVR de um jogador ao final da temporada
 */
export const evolvePlayerOvr = (player: Player): EvolutionResult => {
  const oldOvr = player.overall;
  const isStarter = wasSeasonStarter(player);
  const change = getSeasonOvrChange(player.age, isStarter);
  const newOvr = Math.max(MIN_OVR, Math.min(MAX_OVR, oldOvr + change));
  const changed = newOvr !== oldOvr;

  return {
    player: {
      ...player,
      overall: newOvr,
      age: player.age + 1,
      ovrChange: changed ? (newOvr - oldOvr) : 0,
      // Reset season stats for the new season
      seasonStarterMatches: 0,
      seasonBenchMatches: 0,
    },
    changed,
    oldOvr,
    newOvr,
  };
};

/**
 * Evolui todos os jogadores do time ao final da temporada
 */
export const evolveTeamPlayers = (players: Player[]): {
  evolvedPlayers: Player[];
  improvements: number;
  declines: number;
  improvedNames: string[];
  declinedNames: string[];
} => {
  let improvements = 0;
  let declines = 0;
  const improvedNames: string[] = [];
  const declinedNames: string[] = [];

  const evolvedPlayers = players.map((player) => {
    const result = evolvePlayerOvr(player);
    
    if (result.changed) {
      if (result.newOvr > result.oldOvr) {
        improvements++;
        improvedNames.push(`${player.name} (${result.oldOvr} → ${result.newOvr})`);
      } else {
        declines++;
        declinedNames.push(`${player.name} (${result.oldOvr} → ${result.newOvr})`);
      }
    }
    
    return result.player;
  });

  return {
    evolvedPlayers,
    improvements,
    declines,
    improvedNames,
    declinedNames,
  };
};

/**
 * Limpa os indicadores de mudança de OVR (após mostrar)
 */
export const clearOvrChanges = (players: Player[]): Player[] => {
  return players.map((p) => ({ ...p, ovrChange: 0 }));
};
