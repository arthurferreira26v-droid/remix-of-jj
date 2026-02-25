import { teams } from "@/data/teams";

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

const KEYS = {
  championship: (team: string) => `local_championship_${team}`,
  matches: (team: string) => `local_matches_${team}`,
  standings: (team: string) => `local_standings_${team}`,
  budget: (team: string) => `local_budget_${team}`,
};

// Generate round-robin fixtures
function generateFixtures(allTeams: typeof teams, championshipId: string): LocalMatch[] {
  const fixtures: LocalMatch[] = [];
  const numTeams = allTeams.length;
  const teamsCopy = [...allTeams];

  // First leg
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

  // Second leg (reverse home/away)
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

export function getOrCreateLocalChampionship(userTeamName: string): {
  championship: LocalChampionship;
  matches: LocalMatch[];
  standings: LocalStanding[];
} {
  const existing = localStorage.getItem(KEYS.championship(userTeamName));
  if (existing) {
    return {
      championship: JSON.parse(existing),
      matches: JSON.parse(localStorage.getItem(KEYS.matches(userTeamName)) || "[]"),
      standings: JSON.parse(localStorage.getItem(KEYS.standings(userTeamName)) || "[]"),
    };
  }

  // Create new
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

  localStorage.setItem(KEYS.championship(userTeamName), JSON.stringify(championship));
  localStorage.setItem(KEYS.matches(userTeamName), JSON.stringify(matches));
  localStorage.setItem(KEYS.standings(userTeamName), JSON.stringify(standings));

  return { championship, matches, standings };
}

export function getLocalMatches(teamName: string): LocalMatch[] {
  return JSON.parse(localStorage.getItem(KEYS.matches(teamName)) || "[]");
}

export function getLocalStandings(teamName: string): LocalStanding[] {
  return JSON.parse(localStorage.getItem(KEYS.standings(teamName)) || "[]");
}

export function getLocalChampionship(teamName: string): LocalChampionship | null {
  const data = localStorage.getItem(KEYS.championship(teamName));
  return data ? JSON.parse(data) : null;
}

export function saveLocalMatches(teamName: string, matches: LocalMatch[]) {
  localStorage.setItem(KEYS.matches(teamName), JSON.stringify(matches));
}

export function saveLocalStandings(teamName: string, standings: LocalStanding[]) {
  localStorage.setItem(KEYS.standings(teamName), JSON.stringify(standings));
}

export function saveLocalChampionship(teamName: string, championship: LocalChampionship) {
  localStorage.setItem(KEYS.championship(teamName), JSON.stringify(championship));
}

export function deleteLocalChampionship(teamName: string) {
  localStorage.removeItem(KEYS.championship(teamName));
  localStorage.removeItem(KEYS.matches(teamName));
  localStorage.removeItem(KEYS.standings(teamName));
  localStorage.removeItem(KEYS.budget(teamName));
}

export function getNextUserMatch(teamName: string): LocalMatch | null {
  const matches = getLocalMatches(teamName);
  return matches
    .filter(m => !m.is_played && (m.home_team_name === teamName || m.away_team_name === teamName))
    .sort((a, b) => a.round - b.round)[0] || null;
}

export function saveMatchResultLocal(
  teamName: string,
  matchId: string,
  homeScore: number,
  awayScore: number
) {
  const matches = getLocalMatches(teamName);
  const matchIndex = matches.findIndex(m => m.id === matchId);
  if (matchIndex === -1) return;

  const match = matches[matchIndex];
  const round = match.round;

  // Update the user's match
  matches[matchIndex] = { ...match, home_score: homeScore, away_score: awayScore, is_played: true };

  // Simulate other matches in the same round
  matches.forEach((m, i) => {
    if (m.round === round && !m.is_played && m.id !== matchId) {
      matches[i] = {
        ...m,
        home_score: Math.floor(Math.random() * 4),
        away_score: Math.floor(Math.random() * 4),
        is_played: true,
      };
    }
  });

  saveLocalMatches(teamName, matches);

  // Update standings
  const standings = getLocalStandings(teamName);
  const roundMatches = matches.filter(m => m.round === round && m.is_played);

  for (const m of roundMatches) {
    const hs = standings.find(s => s.team_name === m.home_team_name);
    const as_ = standings.find(s => s.team_name === m.away_team_name);
    if (!hs || !as_ || m.home_score === null || m.away_score === null) continue;

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

  // Sort standings
  standings.sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference || b.goals_for - a.goals_for);
  standings.forEach((s, i) => { s.position = i + 1; });

  saveLocalStandings(teamName, standings);

  // Update championship round
  const champ = getLocalChampionship(teamName);
  if (champ) {
    champ.current_round = round + 1;
    saveLocalChampionship(teamName, champ);
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
