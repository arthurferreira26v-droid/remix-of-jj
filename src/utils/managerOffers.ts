import { teams } from "@/data/teams";
import { getDefaultBudget } from "@/utils/teamBudgets";
import { getTeamRosterPlayers, saveTeamRosterPlayers } from "@/utils/teamRoster";
import { getLocalChampionship, getLocalMatches, getLocalStandings, saveLocalChampionship, saveLocalMatches, saveLocalStandings, saveLocalBudget, flushPendingWrites } from "@/utils/localChampionship";

export interface ManagerOffer {
  id: string;
  club: string;
  status: "pending" | "accepted" | "declined";
}

interface OfferState {
  events: string[];
  owner: string;
  offers: ManagerOffer[];
}

const key = (championshipId: string) => `manager_offers_${championshipId}`;
export const MANAGER_OFFER_ROUNDS = [10, 20, 30];

function readState(championshipId: string, owner: string): OfferState {
  try {
    const raw = localStorage.getItem(key(championshipId));
    if (raw) return JSON.parse(raw);
  } catch { /* Recover an invalid local save. */ }
  return { events: [], owner, offers: [] };
}

/** Higher finishes attract stronger clubs; all offers stay in the active league. */
export function selectManagerClubs(teamName: string, position: number, count: number, seed = 0): string[] {
  const team = teams.find(t => t.name === teamName);
  if (!team) return [];
  const candidates = teams.filter(t => t.league === team.league && t.playable !== false && t.name !== teamName)
    .sort((a, b) => b.rating - a.rating || getDefaultBudget(b.name) - getDefaultBudget(a.name) || a.name.localeCompare(b.name));
  const target = Math.round((Math.max(1, position) - 1) / Math.max(1, candidates.length) * Math.max(0, candidates.length - count));
  // Rotate within the performance band, without changing its strength tier.
  const band = candidates.slice(target, target + Math.max(count, 5));
  if (!band.length) return [];
  const offset = seed % band.length;
  return [...band.slice(offset), ...band.slice(0, offset)].slice(0, count).map(t => t.name);
}

export function getManagerOffers(teamName: string): ManagerOffer[] {
  const championship = getLocalChampionship(teamName);
  if (!championship) return [];
  const state = readState(championship.id, teamName);
  return state.owner === teamName ? state.offers.filter(o => o.status === "pending") : [];
}

export function generateManagerOffers(teamName: string, complete: boolean): ManagerOffer[] {
  const championship = getLocalChampionship(teamName);
  if (!championship) return [];
  const state = readState(championship.id, teamName);
  const played = getLocalMatches(teamName).filter(m => m.is_played && (m.home_team_name === teamName || m.away_team_name === teamName)).length;
  const eligibleRounds = MANAGER_OFFER_ROUNDS.filter(r => played >= r);
  const round = eligibleRounds[eligibleRounds.length - 1];
  const event = complete ? "season-end" : round ? `round-${round}` : null;
  if (!event || state.events.includes(event)) return getManagerOffers(teamName);
  const standings = [...getLocalStandings(teamName)].sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference || b.goals_for - a.goals_for);
  const position = standings.findIndex(s => s.team_name === teamName) + 1;
  const clubs = selectManagerClubs(teamName, position || standings.length, complete ? 5 : 1, played);
  state.events.push(event);
  state.owner = teamName;
  state.offers = clubs.map(club => ({ id: `${championship.id}:${event}:${club}`, club, status: "pending" }));
  localStorage.setItem(key(championship.id), JSON.stringify(state));
  return getManagerOffers(teamName);
}

export function declineManagerOffer(teamName: string, offerId: string): ManagerOffer[] {
  const championship = getLocalChampionship(teamName);
  if (!championship) return [];
  const state = readState(championship.id, teamName);
  if (state.owner !== teamName) return [];
  state.offers = state.offers.map(o => o.id === offerId ? { ...o, status: "declined" } : o);
  localStorage.setItem(key(championship.id), JSON.stringify(state));
  return getManagerOffers(teamName);
}

/** Transfer the campaign ownership, never the outgoing team's players or finances. */
export function acceptManagerOffer(teamName: string, offerId: string): string | null {
  const offer = getManagerOffers(teamName).find(o => o.id === offerId);
  if (!offer) return null;
  const championship = getLocalChampionship(teamName);
  if (!championship) return null;
  const state = readState(championship.id, teamName);
  state.offers = state.offers.map(o => ({ ...o, status: o.id === offerId ? "accepted" : "declined" }));
  state.owner = offer.club;
  localStorage.setItem(key(championship.id), JSON.stringify(state));
  moveManagerCampaign(teamName, offer.club);
  return offer.club;
}

export function moveManagerCampaign(fromTeam: string, toTeam: string): void {
  const championship = getLocalChampionship(fromTeam);
  if (!championship) throw new Error("Campanha não encontrada");
  const source = teams.find(t => t.name === fromTeam);
  const destination = teams.find(t => t.name === toTeam);
  if (!source || !destination || source.league !== destination.league || fromTeam === toTeam) throw new Error("Clube inválido");
  saveLocalChampionship(toTeam, { ...championship, name: championship.name.replace(fromTeam, toTeam) });
  saveLocalMatches(toTeam, getLocalMatches(fromTeam));
  saveLocalStandings(toTeam, getLocalStandings(fromTeam));
  saveLocalBudget(toTeam, getDefaultBudget(toTeam));
  saveTeamRosterPlayers(toTeam, getTeamRosterPlayers(toTeam));
  // Admin refresh must not resurrect athletes already sold by this CPU club.
  localStorage.setItem(`career_roster_${toTeam}`, "true");
  localStorage.setItem("manager_current_team", toTeam);
  flushPendingWrites();
}

export function clearManagerCareer(): void {
  Object.keys(localStorage).filter(k => k.startsWith("manager_offers_") || k.startsWith("career_roster_") || k === "manager_current_team")
    .forEach(k => localStorage.removeItem(k));
}