import { teams } from "@/data/teams";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LocalMatch {
  id: string;
  championship_id: string;
  round: number;
  home_team_id: string;
  home_team_name: string;
  home_team_logo: string;
  away_team_id: string;
  away_team_name: string;
  away_team_logo: string;
  home_score: number | null;
  away_score: number | null;
  is_played: boolean;
}

export interface LocalStanding {
  id: string;
  championship_id: string;
  team_id: string;
  team_name: string;
  logo: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  position: number;
  group_name?: string | null;
}

export interface LocalChampionship {
  id: string;
  name: string;
  season: string;
  current_round: number;
  total_rounds: number;
}

// ─── Storage keys ────────────────────────────────────────────────────────────

const KEYS = {
  championship: (team: string) => `local_championship_${team}`,
  matches: (team: string) => `local_matches_${team}`,
  standings: (team: string) => `local_standings_${team}`,
  budget: (team: string) => `local_budget_${team}`,
};

// ─── In-memory cache ─────────────────────────────────────────────────────────
// Avoids repeated JSON.parse on every read. Cache is invalidated on write.

const cache: Record<string, any> = {};

function cacheGet<T>(key: string): T | null {
  if (key in cache) return cache[key] as T;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    cache[key] = parsed;
    return parsed as T;
  } catch {
    return null;
  }
}

function cacheSet(key: string, value: any) {
  cache[key] = value;
  // Schedule async write — don't block the UI thread
  scheduleWrite(key, value);
}

function cacheDelete(key: string) {
  delete cache[key];
  localStorage.removeItem(key);
}

// ─── Async write queue (batched, non-blocking) ──────────────────────────────

const pendingWrites = new Map<string, any>();
let writeScheduled = false;

function scheduleWrite(key: string, value: any) {
  pendingWrites.set(key, value);
  if (!writeScheduled) {
    writeScheduled = true;
    // Use requestIdleCallback if available, otherwise setTimeout
    const schedule = typeof requestIdleCallback === "function" ? requestIdleCallback : (fn: () => void) => setTimeout(fn, 0);
    schedule(flushWrites);
  }
}

function flushWrites() {
  writeScheduled = false;
  for (const [key, value] of pendingWrites) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("localStorage write failed for", key, e);
    }
  }
  pendingWrites.clear();
}

/** Force-flush all pending writes synchronously (call before navigation) */
export function flushPendingWrites() {
  flushWrites();
}

// ─── Anti-loop save mutex ────────────────────────────────────────────────────

let saveLock = false;

// ─── Generate round-robin fixtures ──────────────────────────────────────────

function generateFixtures(allTeams: typeof teams, championshipId: string): LocalMatch[] {
  const fixtures: LocalMatch[] = [];
  const numTeams = allTeams.length;
  const teamsCopy = [...allTeams];

  for (let round = 0; round < numTeams - 1; round++) {
    for (let match = 0; match < numTeams / 2; match++) {
      const home = teamsCopy[match];
      const away = teamsCopy[numTeams - 1 - match];
      fixtures.push({
        id: `m-${round}-${match}`,
        championship_id: championshipId,
        round: round + 1,
        home_team_id: home.id,
        home_team_name: home.name,
        home_team_logo: home.logo,
        away_team_id: away.id,
        away_team_name: away.name,
        away_team_logo: away.logo,
        home_score: null,
        away_score: null,
        is_played: false,
      });
    }
    const last = teamsCopy.pop()!;
    teamsCopy.splice(1, 0, last);
  }

  const firstLeg = [...fixtures];
  firstLeg.forEach((m, i) => {
    fixtures.push({
      ...m,
      id: `m-r-${m.round}-${i}`,
      round: m.round + (numTeams - 1),
      home_team_id: m.away_team_id,
      home_team_name: m.away_team_name,
      home_team_logo: m.away_team_logo,
      away_team_id: m.home_team_id,
      away_team_name: m.home_team_name,
      away_team_logo: m.home_team_logo,
    });
  });

  return fixtures;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function getOrCreateLocalChampionship(userTeamName: string): {
  championship: LocalChampionship;
  matches: LocalMatch[];
  standings: LocalStanding[];
} {
  const existing = cacheGet<LocalChampionship>(KEYS.championship(userTeamName));
  if (existing) {
    return {
      championship: existing,
      matches: cacheGet<LocalMatch[]>(KEYS.matches(userTeamName)) || [],
      standings: cacheGet<LocalStanding[]>(KEYS.standings(userTeamName)) || [],
    };
  }

  const userTeam = teams.find(t => t.name === userTeamName);
  if (!userTeam) throw new Error("Time não encontrado");

  const leagueTeams = teams.filter(t => t.league === userTeam.league);
  const championshipId = `local-${Date.now()}`;

  const championship: LocalChampionship = {
    id: championshipId,
    name: `Brasileirão - ${userTeamName}`,
    season: "2024",
    current_round: 1,
    total_rounds: (leagueTeams.length - 1) * 2,
  };

  const matches = generateFixtures(leagueTeams, championshipId);

  const standings: LocalStanding[] = leagueTeams.map((t, i) => ({
    id: `s-${t.id}`,
    championship_id: championshipId,
    team_id: t.id,
    team_name: t.name,
    logo: t.logo,
    points: 0, played: 0, wins: 0, draws: 0, losses: 0,
    goals_for: 0, goals_against: 0, goal_difference: 0, position: i + 1,
  }));

  cacheSet(KEYS.championship(userTeamName), championship);
  cacheSet(KEYS.matches(userTeamName), matches);
  cacheSet(KEYS.standings(userTeamName), standings);

  return { championship, matches, standings };
}

export function getLocalMatches(teamName: string): LocalMatch[] {
  return cacheGet<LocalMatch[]>(KEYS.matches(teamName)) || [];
}

export function getLocalStandings(teamName: string): LocalStanding[] {
  return cacheGet<LocalStanding[]>(KEYS.standings(teamName)) || [];
}

export function getLocalChampionship(teamName: string): LocalChampionship | null {
  return cacheGet<LocalChampionship>(KEYS.championship(teamName));
}

export function saveLocalMatches(teamName: string, matches: LocalMatch[]) {
  cacheSet(KEYS.matches(teamName), matches);
}

export function saveLocalStandings(teamName: string, standings: LocalStanding[]) {
  cacheSet(KEYS.standings(teamName), standings);
}

export function saveLocalChampionship(teamName: string, championship: LocalChampionship) {
  cacheSet(KEYS.championship(teamName), championship);
}

export function deleteLocalChampionship(teamName: string) {
  cacheDelete(KEYS.championship(teamName));
  cacheDelete(KEYS.matches(teamName));
  cacheDelete(KEYS.standings(teamName));
  cacheDelete(KEYS.budget(teamName));
}

export function getNextUserMatch(teamName: string): LocalMatch | null {
  const matches = getLocalMatches(teamName);
  return matches
    .filter(m => !m.is_played && (m.home_team_name === teamName || m.away_team_name === teamName))
    .sort((a, b) => a.round - b.round)[0] || null;
}

/**
 * Saves match result with anti-loop mutex and incremental updates.
 * Only modifies matches of the given round + standings diff.
 * Writes are batched and async (non-blocking).
 */
export function saveMatchResultLocal(
  teamName: string,
  matchId: string,
  homeScore: number,
  awayScore: number,
  excludeTeams?: string[]
) {
  // ── Anti-loop guard ──
  if (saveLock) {
    console.warn("saveMatchResultLocal: skipped (already saving)");
    return;
  }
  saveLock = true;

  try {
    const matches = getLocalMatches(teamName);
    const matchIndex = matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;

    const match = matches[matchIndex];
    if (match.is_played) return; // already saved — prevent double-save

    const round = match.round;

    // Update only the user's match
    matches[matchIndex] = { ...match, home_score: homeScore, away_score: awayScore, is_played: true };

    // Simulate other matches in the same round (only unplayed ones)
    const roundUpdatedIndices: number[] = [matchIndex];
    for (let i = 0; i < matches.length; i++) {
      if (matches[i].round === round && !matches[i].is_played && matches[i].id !== matchId) {
        // In 2P mode, skip matches involving excluded teams (the other player's team)
        if (excludeTeams && excludeTeams.some(t => matches[i].home_team_name === t || matches[i].away_team_name === t)) {
          continue;
        }
        matches[i] = {
          ...matches[i],
          home_score: Math.floor(Math.random() * 4),
          away_score: Math.floor(Math.random() * 4),
          is_played: true,
        };
        roundUpdatedIndices.push(i);
      }
    }

    // Write matches (async, non-blocking)
    cacheSet(KEYS.matches(teamName), matches);

    // ── Incremental standings update (only for this round's results) ──
    const standings = getLocalStandings(teamName);
    const standingsMap = new Map(standings.map(s => [s.team_name, s]));

    for (const idx of roundUpdatedIndices) {
      const m = matches[idx];
      if (m.home_score === null || m.away_score === null) continue;

      const hs = standingsMap.get(m.home_team_name);
      const as_ = standingsMap.get(m.away_team_name);
      if (!hs || !as_) continue;

      hs.played += 1;
      as_.played += 1;
      hs.goals_for += m.home_score;
      hs.goals_against += m.away_score;
      as_.goals_for += m.away_score;
      as_.goals_against += m.home_score;

      if (m.home_score > m.away_score) {
        hs.points += 3; hs.wins += 1; as_.losses += 1;
      } else if (m.home_score < m.away_score) {
        as_.points += 3; as_.wins += 1; hs.losses += 1;
      } else {
        hs.points += 1; as_.points += 1; hs.draws += 1; as_.draws += 1;
      }
      hs.goal_difference = hs.goals_for - hs.goals_against;
      as_.goal_difference = as_.goals_for - as_.goals_against;
    }

    // Sort and assign positions
    standings.sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference || b.goals_for - a.goals_for);
    standings.forEach((s, i) => { s.position = i + 1; });

    // Write standings (async)
    cacheSet(KEYS.standings(teamName), standings);

    // Update championship round (async)
    const champ = getLocalChampionship(teamName);
    if (champ) {
      champ.current_round = round + 1;
      cacheSet(KEYS.championship(teamName), champ);
    }
  } finally {
    saveLock = false;
  }
}

export function getLocalTeamForm(teamName: string, forTeam: string): ('V' | 'E' | 'D' | '-')[] {
  const matches = getLocalMatches(teamName);
  const played = matches
    .filter(m => m.is_played && (m.home_team_name === forTeam || m.away_team_name === forTeam))
    .sort((a, b) => b.round - a.round)
    .slice(0, 5);

  const form: ('V' | 'E' | 'D' | '-')[] = [];
  for (const m of played) {
    const isHome = m.home_team_name === forTeam;
    const teamScore = isHome ? m.home_score! : m.away_score!;
    const oppScore = isHome ? m.away_score! : m.home_score!;
    if (teamScore > oppScore) form.push('V');
    else if (teamScore < oppScore) form.push('D');
    else form.push('E');
  }
  while (form.length < 5) form.push('-');
  return form;
}

export function getLocalBudget(teamName: string): number {
  const saved = localStorage.getItem(KEYS.budget(teamName));
  return saved ? Number(saved) : getDefaultBudget(teamName);
}

export function saveLocalBudget(teamName: string, budget: number) {
  localStorage.setItem(KEYS.budget(teamName), String(budget));
}

function getDefaultBudget(teamName: string): number {
  const budgets: Record<string, number> = {
    "Flamengo": 18000000, "Palmeiras": 17000000, "Botafogo": 15000000,
    "Corinthians": 12000000, "Internacional": 11000000, "São Paulo": 10000000,
    "Fluminense": 9000000, "Cruzeiro": 9000000, "Santos": 7000000,
    "Grêmio": 7000000, "Atlético Mineiro": 7000000, "Vasco da Gama": 5000000,
  };
  return budgets[teamName] || 5000000;
}

export function isChampionshipComplete(teamName: string): { complete: boolean; winner: string | null } {
  const matches = getLocalMatches(teamName);
  const unplayed = matches.filter(m => !m.is_played);
  if (unplayed.length > 0) return { complete: false, winner: null };

  const standings = getLocalStandings(teamName);
  if (standings.length === 0) return { complete: false, winner: null };

  const sorted = [...standings].sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference);
  return { complete: true, winner: sorted[0]?.team_name || null };
}
