import { Player } from "@/data/players";
import { getAdminPlayersSync } from "@/hooks/useAdminData";

const getPlayersStorageKey = (teamName: string) => `players_${teamName}`;
const getStarterOrderStorageKey = (teamName: string) => `starter_order_${teamName}`;

export const getTeamRosterPlayers = (teamName: string): Player[] => {
  const raw = localStorage.getItem(getPlayersStorageKey(teamName));

  if (!raw) {
    return getAdminPlayersSync()[teamName] ?? [];
  }

  try {
    return JSON.parse(raw) as Player[];
  } catch {
    return getAdminPlayersSync()[teamName] ?? [];
  }
};

export const saveTeamRosterPlayers = (teamName: string, players: Player[]) => {
  localStorage.setItem(getPlayersStorageKey(teamName), JSON.stringify(players));
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
  const players = getTeamRosterPlayers(teamName);

  if (players.some((currentPlayer) => currentPlayer.id === player.id)) {
    return {
      added: false,
      updatedPlayers: players,
    };
  }

  const nextPlayer: Player = {
    ...player,
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