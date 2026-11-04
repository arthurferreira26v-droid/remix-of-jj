import type { Player } from "@/data/players";

/** Legacy position codes mapped to the current ones. */
export const LEGACY_POSITION_MAP: Record<string, string> = { PE: "ME", PD: "MD", MEI: "MC" };

export const normalizePositionCode = (pos: string): string => LEGACY_POSITION_MAP[pos] ?? pos;

export const normalizePlayerPositions = <T extends Player>(player: T): T => {
  const position = normalizePositionCode(player.position);
  if (!player.altPositions) return position === player.position ? player : { ...player, position };
  const alts = Array.from(new Set(player.altPositions.map(normalizePositionCode))).filter((p) => p !== position);
  return { ...player, position, altPositions: alts };
};
