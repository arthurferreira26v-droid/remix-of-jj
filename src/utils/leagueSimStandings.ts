import { teams, type Team } from "@/data/teams";
import { getLocalChampionship, type LocalStanding } from "@/utils/localChampionship";

// ─── Deterministic PRNG (mulberry32) ─────────────────────────────────────────

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function poisson(lambda: number, rand: () => number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rand();
  } while (p > L);
  return k - 1;
}

// ─── Season simulation for CPU-only leagues ──────────────────────────────────
// Simulates a full double round-robin with a seeded RNG so the table is stable
// between sessions and grows consistently as the user advances rounds.

interface TeamStats {
  team: Team;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
}

function buildSchedule(order: Team[]): Array<Array<[Team, Team]>> {
  const n = order.length;
  const copy = [...order];
  const rounds: Array<Array<[Team, Team]>> = [];

  for (let r = 0; r < n - 1; r++) {
    const pairs: Array<[Team, Team]> = [];
    for (let i = 0; i < n / 2; i++) {
      pairs.push([copy[i], copy[n - 1 - i]]);
    }
    rounds.push(pairs);
    const last = copy.pop()!;
    copy.splice(1, 0, last);
  }

  // Second leg (mirrored home/away)
  const mirrored = rounds.map(pairs => pairs.map(([a, b]) => [b, a] as [Team, Team]));
  return [...rounds, ...mirrored];
}

/**
 * Standings for a league the user is NOT playing. Results are simulated
 * deterministically from team ratings. `roundsPlayed` follows the user's own
 * championship progress so all leagues advance together; pass -1 to auto-detect.
 */
export function getSimulatedStandings(league: string, roundsPlayed = -1): LocalStanding[] {
  const leagueTeams = teams.filter(t => t.league === league);
  if (leagueTeams.length === 0) return [];

  const totalRounds = (leagueTeams.length - 1) * 2;
  let rounds: number;
  if (roundsPlayed >= 0) {
    rounds = Math.min(roundsPlayed, totalRounds);
  } else {
    // Auto-detect from any local championship (first team of the league)
    const first = leagueTeams[0];
    const champ = getLocalChampionship(first.name);
    rounds = champ ? Math.max(0, champ.current_round - 1) : 0;
  }

  const rand = mulberry32(hashString(`sim-${league}-2026`));
  const stats = new Map<string, TeamStats>(
    leagueTeams.map(t => [t.id, { team: t, points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 }])
  );

  const schedule = buildSchedule(leagueTeams);

  for (let r = 0; r < rounds; r++) {
    for (const [home, away] of schedule[r]) {
      const h = stats.get(home.id)!;
      const a = stats.get(away.id)!;

      const baseH = 1.1 + home.rating * 0.28;
      const baseA = 1.1 + away.rating * 0.28;
      const expH = Math.max(0.3, Math.min(4, baseH * 1.12 * Math.pow(1.18, home.rating - away.rating)));
      const expA = Math.max(0.3, Math.min(4, baseA * 0.92 * Math.pow(1.18, away.rating - home.rating)));

      const hs = poisson(expH, rand);
      const as_ = poisson(expA, rand);

      h.played++; a.played++;
      h.gf += hs; h.ga += as_;
      a.gf += as_; a.ga += hs;

      if (hs > as_) { h.points += 3; h.wins++; a.losses++; }
      else if (hs < as_) { a.points += 3; a.wins++; h.losses++; }
      else { h.points++; a.points++; h.draws++; a.draws++; }
    }
  }

  const sorted = [...stats.values()].sort(
    (x, y) => y.points - x.points || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf
  );

  return sorted.map((s, i) => ({
    id: `sim-${s.team.id}`,
    championship_id: `sim-${league}`,
    team_id: s.team.id,
    team_name: s.team.name,
    logo: s.team.logo,
    points: s.points,
    played: s.played,
    wins: s.wins,
    draws: s.draws,
    losses: s.losses,
    goals_for: s.gf,
    goals_against: s.ga,
    goal_difference: s.gf - s.ga,
    position: i + 1,
  }));
}
