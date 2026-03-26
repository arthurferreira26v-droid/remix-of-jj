import { Player } from "@/data/players";

export const RESERVE_POSITION_ORDER = [
  "GOL",
  "ZAG",
  "LE",
  "LD",
  "VOL",
  "MC",
  "MEI",
  "PE",
  "PD",
  "ATA",
] as const;

const getPositionRank = (position: string) => {
  const rank = RESERVE_POSITION_ORDER.indexOf(position as (typeof RESERVE_POSITION_ORDER)[number]);
  return rank === -1 ? Number.MAX_SAFE_INTEGER : rank;
};

export const sortPlayersByReserveOrder = <T extends Player>(players: T[]) =>
  [...players].sort((a, b) => {
    const positionDiff = getPositionRank(a.position) - getPositionRank(b.position);

    if (positionDiff !== 0) return positionDiff;
    if (a.overall !== b.overall) return b.overall - a.overall;

    return a.name.localeCompare(b.name, "pt-BR");
  });