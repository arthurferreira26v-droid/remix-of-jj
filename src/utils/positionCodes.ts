import type { Player } from "@/data/players";

/** Paired codes: a player with one code can also play the other (dual role). */
export const POSITION_PAIRS: Record<string, string> = {
  PE: "ME", ME: "PE", PD: "MD", MD: "PD", MEI: "MC", MC: "MEI",
};

export const normalizePlayerPositions = <T extends Player>(player: T): T => {
  const partner = POSITION_PAIRS[player.position];
  if (!partner) return player;
  const alts = player.altPositions || [];
  if (alts.includes(partner)) return player;
  return { ...player, altPositions: [...alts, partner] };
};
