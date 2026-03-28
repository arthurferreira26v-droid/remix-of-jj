const WATCHLIST_KEY = "player_watchlist";

export interface WatchlistEntry {
  playerId: string;
  ownerTeam: string;
  addedAt: number;
}

const getKey = (userTeam: string) => `${WATCHLIST_KEY}_${userTeam.toLowerCase()}`;

export const getWatchlist = (userTeam: string): WatchlistEntry[] => {
  try {
    const raw = localStorage.getItem(getKey(userTeam));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addToWatchlist = (userTeam: string, playerId: string, ownerTeam: string): boolean => {
  const list = getWatchlist(userTeam);
  const uniqueKey = `${ownerTeam.toLowerCase()}::${playerId}`;
  if (list.some(e => `${e.ownerTeam.toLowerCase()}::${e.playerId}` === uniqueKey)) return false;
  list.push({ playerId, ownerTeam, addedAt: Date.now() });
  localStorage.setItem(getKey(userTeam), JSON.stringify(list));
  return true;
};

export const removeFromWatchlist = (userTeam: string, playerId: string, ownerTeam: string): void => {
  const list = getWatchlist(userTeam).filter(
    e => !(e.playerId === playerId && e.ownerTeam.toLowerCase() === ownerTeam.toLowerCase())
  );
  localStorage.setItem(getKey(userTeam), JSON.stringify(list));
};

export const isInWatchlist = (userTeam: string, playerId: string, ownerTeam: string): boolean => {
  return getWatchlist(userTeam).some(
    e => e.playerId === playerId && e.ownerTeam.toLowerCase() === ownerTeam.toLowerCase()
  );
};

export const cleanWatchlist = (userTeam: string, validKeys: Set<string>): void => {
  const list = getWatchlist(userTeam).filter(e => {
    const key = `${e.ownerTeam.toLowerCase()}::${e.playerId}`;
    return validKeys.has(key);
  });
  localStorage.setItem(getKey(userTeam), JSON.stringify(list));
};
