import { Player, generateTeamPlayers } from "@/data/players";
import { teams } from "@/data/teams";
import { getAdminPlayersSync } from "@/hooks/useAdminData";

const resolveTeamName = (teamName: string) => {
  const normalized = teamName.toLowerCase();
  const matchedTeam = teams.find(
    (team) => team.name.toLowerCase() === normalized || team.id.toLowerCase() === normalized
  );

  return {
    storageTeamName: matchedTeam?.name ?? teamName,
    teamId: matchedTeam?.id ?? teamName,
  };
};

const getPlayersStorageKey = (teamName: string) => `players_${resolveTeamName(teamName).storageTeamName}`;
const getStarterOrderStorageKey = (teamName: string) => `starter_order_${resolveTeamName(teamName).storageTeamName}`;

const normalizePlayer = (player: Player): Player => ({
  ...player,
  isStarter: Boolean(player.isStarter),
  isListed: player.isListed !== false, // default true for backwards compat
  energy: player.energy ?? 100,
  consecutiveMatches: player.consecutiveMatches ?? 0,
});

const saveInitialStarterOrder = (teamName: string, players: Player[]) => {
  const key = getStarterOrderStorageKey(teamName);
  if (localStorage.getItem(key)) return;

  const starters = players.filter((player) => player.isStarter).map((player) => player.id);
  if (starters.length > 0) {
    localStorage.setItem(key, JSON.stringify(starters));
  }
};

const enforceReserveLimit = (players: Player[]): Player[] => {
  const starters = players.filter(p => p.isStarter);
  const nonStarters = players.filter(p => !p.isStarter);
  // First 10 non-starters are listed (reserves), rest are unlisted
  const listed = nonStarters.slice(0, 10).map(p => ({ ...p, isListed: true }));
  const unlisted = nonStarters.slice(10).map(p => ({ ...p, isListed: false }));
  return [...starters, ...listed, ...unlisted];
};

const getFallbackPlayers = (teamName: string): Player[] => {
  const { storageTeamName, teamId } = resolveTeamName(teamName);
  const adminPlayers = getAdminPlayersSync();
  const sourcePlayers =
    adminPlayers[teamId] ??
    adminPlayers[storageTeamName] ??
    adminPlayers[teamName] ??
    generateTeamPlayers(storageTeamName);

  return enforceReserveLimit(sourcePlayers.map(normalizePlayer));
};

export const getTeamRosterPlayers = (teamName: string): Player[] => {
  const raw = localStorage.getItem(getPlayersStorageKey(teamName));

  if (!raw) {
    const fallbackPlayers = getFallbackPlayers(teamName);
    saveTeamRosterPlayers(teamName, fallbackPlayers);
    return fallbackPlayers;
  }

  try {
    return (JSON.parse(raw) as Player[]).map(normalizePlayer);
  } catch {
    const fallbackPlayers = getFallbackPlayers(teamName);
    saveTeamRosterPlayers(teamName, fallbackPlayers);
    return fallbackPlayers;
  }
};

export const saveTeamRosterPlayers = (teamName: string, players: Player[]) => {
  const normalizedPlayers = players.map(normalizePlayer);
  localStorage.setItem(getPlayersStorageKey(teamName), JSON.stringify(normalizedPlayers));
  saveInitialStarterOrder(teamName, normalizedPlayers);
};

const getStarterOrder = (teamName: string): string[] => {
  const raw = localStorage.getItem(getStarterOrderStorageKey(teamName));

  if (!raw) return [];

  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
};

const saveStarterOrder = (teamName: string, starterOrder: string[]) => {
  localStorage.setItem(getStarterOrderStorageKey(teamName), JSON.stringify(starterOrder));
};

const removePlayerFromOtherRosters = (playerId: string, ownerTeam: string) => {
  const ownerTeamName = resolveTeamName(ownerTeam).storageTeamName.toLowerCase();

  teams.forEach((team) => {
    if (team.name.toLowerCase() === ownerTeamName) return;

    const roster = getTeamRosterPlayers(team.name);
    if (!roster.some((player) => player.id === playerId)) return;

    const updatedPlayers = roster.filter((player) => player.id !== playerId);
    saveTeamRosterPlayers(team.name, updatedPlayers);

    const starterOrder = getStarterOrder(team.name);
    if (starterOrder.length > 0) {
      saveStarterOrder(
        team.name,
        starterOrder.filter((starterId) => starterId !== playerId)
      );
    }
  });
};

const pickReplacement = (players: Player[], soldPlayer: Player): Player | null => {
  const reserves = players.filter((player) => !player.isStarter);

  if (reserves.length === 0) return null;

  return (
    reserves.find((player) => player.position === soldPlayer.position) ??
    [...reserves].sort((a, b) => b.overall - a.overall)[0] ??
    null
  );
};

export const removePlayerFromTeamRoster = (teamName: string, playerId: string) => {
  const players = getTeamRosterPlayers(teamName);
  const removedPlayer = players.find((player) => player.id === playerId) ?? null;

  if (!removedPlayer) {
    return {
      removedPlayer: null,
      replacement: null,
      updatedPlayers: players,
    };
  }

  let updatedPlayers = players.filter((player) => player.id !== playerId);
  let replacement: Player | null = null;

  if (removedPlayer.isStarter) {
    replacement = pickReplacement(updatedPlayers, removedPlayer);

    if (replacement) {
      updatedPlayers = updatedPlayers.map((player) =>
        player.id === replacement!.id ? { ...player, isStarter: true } : player
      );
      replacement = { ...replacement, isStarter: true };
    }
  }

  const currentStarterOrder = getStarterOrder(teamName);

  if (currentStarterOrder.length > 0) {
    const nextStarterOrder = currentStarterOrder
      .map((id) => (id === playerId ? replacement?.id ?? "" : id))
      .filter(Boolean);

    saveStarterOrder(teamName, nextStarterOrder);
  }

  saveTeamRosterPlayers(teamName, updatedPlayers);

  return {
    removedPlayer,
    replacement,
    updatedPlayers,
  };
};

export const addPlayerToTeamRoster = (teamName: string, player: Player) => {
  removePlayerFromOtherRosters(player.id, teamName);

  const players = getTeamRosterPlayers(teamName);

  if (players.some((currentPlayer) => currentPlayer.id === player.id)) {
    return {
      added: false,
      updatedPlayers: players,
    };
  }

  const nextPlayer: Player = {
    ...normalizePlayer(player),
    isStarter: false,
    energy: player.energy ?? 100,
    consecutiveMatches: player.consecutiveMatches ?? 0,
  };

  const updatedPlayers = [...players, nextPlayer];
  saveTeamRosterPlayers(teamName, updatedPlayers);

  return {
    added: true,
    updatedPlayers,
  };
};

export const transferPlayerToTeamRoster = (
  fromTeam: string,
  toTeam: string,
  playerId: string,
  fallbackPlayer?: Player
) => {
  if (resolveTeamName(fromTeam).storageTeamName.toLowerCase() === resolveTeamName(toTeam).storageTeamName.toLowerCase()) {
    throw new Error("same_team_offer");
  }

  const { removedPlayer, replacement, updatedPlayers: updatedFromPlayers } = removePlayerFromTeamRoster(
    fromTeam,
    playerId
  );

  const playerToTransfer = removedPlayer ?? fallbackPlayer ?? null;
  if (!playerToTransfer) {
    return {
      removedPlayer: null,
      addedPlayer: null,
      replacement,
      updatedFromPlayers,
      updatedToPlayers: getTeamRosterPlayers(toTeam),
    };
  }

  const destinationPlayers = getTeamRosterPlayers(toTeam);
  const nextNumber =
    destinationPlayers.reduce((highest, player) => Math.max(highest, player.number ?? 0), 0) + 1;

  const nextPlayer: Player = {
    ...normalizePlayer(playerToTransfer),
    number: playerToTransfer.number ?? nextNumber,
    isStarter: false,
  };

  const { updatedPlayers: updatedToPlayers } = addPlayerToTeamRoster(toTeam, nextPlayer);

  return {
    removedPlayer: playerToTransfer,
    addedPlayer: nextPlayer,
    replacement,
    updatedFromPlayers,
    updatedToPlayers,
  };
};