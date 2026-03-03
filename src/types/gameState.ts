import { Player } from "@/data/players";

/* ============================= */
/*            TYPES              */
/* ============================= */

export interface GameSaveData {
  id: string;
  version: string;
  savedAt: string;
  slotName: string;

  // Club Info
  clubName: string;
  season: string;

  // Financial
  budget: number;
  totalSales: number;
  totalPurchases: number;
  hasActiveInvestment: boolean;

  // Players
  players: SavedPlayer[];

  // Season Stats
  seasonStats: SeasonStats;

  // User Settings
  settings: UserSettings;

  // Championship Progress
  championshipId?: string;
  currentRound?: number;
}

export interface SavedPlayer extends Player {
  status: "titular" | "reserva" | "lesionado" | "vendido";
  evolutionHistory?: number[];
}

export interface SeasonStats {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  position?: number;
  points?: number;
}

export interface UserSettings {
  autoSave: boolean;
  difficulty?: "easy" | "normal" | "hard";
}

export interface SaveSlot {
  id: string;
  slotNumber: number;
  saveData: GameSaveData | null;
  isEmpty: boolean;
  lastModified?: string;
}

/* ============================= */
/*          CONSTANTS            */
/* ============================= */

export const CURRENT_SAVE_VERSION = "1.0.0";
export const MAX_SAVE_SLOTS = 5;

/* ============================= */
/*          FUNCTIONS            */
/* ============================= */

export function generateSaveId(): string {
  return `save_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 9)}`;
}

export function validateSaveData(data: unknown): data is GameSaveData {
  if (!data || typeof data !== "object") {
    return false;
  }

  const save = data as GameSaveData;

  if (!save.id || typeof save.id !== "string") return false;
  if (!save.version || typeof save.version !== "string") return false;
  if (!save.savedAt || typeof save.savedAt !== "string") return false;
  if (!save.clubName || typeof save.clubName !== "string") return false;
  if (!save.season || typeof save.season !== "string") return false;
  if (typeof save.budget !== "number") return false;
  if (!Array.isArray(save.players)) return false;
  if (!save.seasonStats || typeof save.seasonStats !== "object") return false;
  if (!save.settings || typeof save.settings !== "object") return false;

  for (const player of save.players) {
    if (!player.id || !player.name || !player.position) return false;
    if (typeof player.overall !== "number") return false;
    if (typeof player.age !== "number") return false;

    if (
      player.energy !== undefined &&
      typeof player.energy !== "number"
    ) {
      return false;
    }

    if (
      player.consecutiveMatches !== undefined &&
      typeof player.consecutiveMatches !== "number"
    ) {
      return false;
    }
  }

  return true;
}

export function migrateSaveData(data: GameSaveData): GameSaveData {
  return {
    ...data,
    version: CURRENT_SAVE_VERSION,

    settings: {
      autoSave: true,
      ...data.settings,
    },

    seasonStats: {
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      ...data.seasonStats,
    },

    players: data.players.map((player) => ({
      ...player,
      energy: player.energy ?? 100,
      consecutiveMatches: player.consecutiveMatches ?? 0,
    })),
  };
}
