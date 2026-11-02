import type { Player } from "@/data/players";

export interface TeamTactics {
  formation: string;
  playStyle: string;
  gameStyle: string;
}

export const readTeamTactics = (teamName: string): TeamTactics => ({
  formation: localStorage.getItem(`tactics_formation_${teamName}`) || "4-3-3",
  playStyle: localStorage.getItem(`tactics_playstyle_${teamName}`) || "counter",
  gameStyle: localStorage.getItem(`tactics_gamestyle_${teamName}`) || "through_middle",
});

export const persistTeamTactics = (teamName: string, tactics: TeamTactics, persistent = true) => {
  if (!persistent) return;
  localStorage.setItem(`tactics_formation_${teamName}`, tactics.formation);
  localStorage.setItem(`tactics_playstyle_${teamName}`, tactics.playStyle);
  localStorage.setItem(`tactics_gamestyle_${teamName}`, tactics.gameStyle);
};

// Preserve membership, bench selection and ordering; copy only lasting match outcomes.
export const mergeMatchOutcomes = (principal: Player[], matchPlayers: Player[]): Player[] => {
  const outcomes = new Map(matchPlayers.map(player => [player.id, player]));
  return principal.map(player => {
    const result = outcomes.get(player.id);
    if (!result) return player;
    return {
      ...player,
      energy: result.energy,
      matchEnergy: undefined,
      consecutiveMatches: result.consecutiveMatches,
      seasonStarterMatches: result.seasonStarterMatches,
      seasonBenchMatches: result.seasonBenchMatches,
      accumulatedYellows: result.accumulatedYellows,
      suspensionMatches: result.suspensionMatches,
      matchYellowCards: 0,
      matchRedCard: false,
    };
  });
};