import { beforeEach, expect, test } from "bun:test";
import { generateManagerOffers, getManagerOffers, declineManagerOffer, acceptManagerOffer, selectManagerClubs } from "./managerOffers";
import { getOrCreateLocalChampionship, saveLocalMatches, saveLocalStandings, saveLocalChampionship, getLocalChampionship, getLocalMatches, getLocalStandings, getLocalBudget, saveLocalBudget, flushPendingWrites, deleteLocalChampionship } from "./localChampionship";
import { getTeamRosterPlayers, saveTeamRosterPlayers } from "./teamRoster";
import { teams } from "../data/teams";

beforeEach(() => {
  const store = new Map();
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  for (const team of teams) deleteLocalChampionship(team.name);
  getOrCreateLocalChampionship("Botafogo");
});

function advance(count) {
  const fixtures = getLocalMatches("Botafogo").map(m => ({ ...m, is_played: m.round <= count }));
  saveLocalMatches("Botafogo", fixtures);
  const champ = getLocalChampionship("Botafogo");
  saveLocalChampionship("Botafogo", { ...champ, current_round: count + 1 });
  flushPendingWrites();
}

test("proposals appear only after the configured completed rounds, and never duplicate on return", () => {
  advance(9);
  expect(generateManagerOffers("Botafogo", false)).toHaveLength(0);
  advance(10);
  const first = generateManagerOffers("Botafogo", false);
  expect(first).toHaveLength(1);
  expect(generateManagerOffers("Botafogo", false)).toEqual(first);
  declineManagerOffer("Botafogo", first[0].id);
  expect(generateManagerOffers("Botafogo", false)).toHaveLength(0);
  advance(20);
  expect(generateManagerOffers("Botafogo", false)).toHaveLength(1);
  advance(30);
  expect(generateManagerOffers("Botafogo", false)).toHaveLength(1);
});

test("season end supplies exactly five distinct clubs other than the current club", () => {
  advance(38);
  const offers = generateManagerOffers("Botafogo", true);
  expect(offers).toHaveLength(5);
  expect(new Set(offers.map(o => o.club)).size).toBe(5);
  expect(offers.some(o => o.club === "Botafogo")).toBe(false);
  expect(offers.every(o => teams.find(t => t.name === o.club)?.league === "brasileiro")).toBe(true);
});

test("a first-place finish attracts stronger clubs than last place", () => {
  const ratings = names => names.reduce((sum, name) => sum + teams.find(t => t.name === name).rating, 0);
  expect(ratings(selectManagerClubs("Botafogo", 1, 5))).toBeGreaterThan(ratings(selectManagerClubs("Botafogo", 20, 5)));
});

test("declining keeps Botafogo's finances, roster and championship intact", () => {
  advance(10);
  const before = getTeamRosterPlayers("Botafogo");
  saveLocalBudget("Botafogo", 123456);
  const champ = getLocalChampionship("Botafogo");
  const [offer] = generateManagerOffers("Botafogo", false);
  declineManagerOffer("Botafogo", offer.id);
  expect(getManagerOffers("Botafogo")).toHaveLength(0);
  expect(getLocalBudget("Botafogo")).toBe(123456);
  expect(getTeamRosterPlayers("Botafogo")).toEqual(before);
  expect(getLocalChampionship("Botafogo")).toEqual(champ);
});

test("accepting Santos starts with its $7M initial cash and current roster, retaining round and standings", () => {
  advance(10);
  const champ = getLocalChampionship("Botafogo");
  localStorage.setItem(`manager_offers_${champ.id}`, JSON.stringify({ owner: "Botafogo", events: ["round-10"], offers: [{ id: "santos-offer", club: "Santos", status: "pending" }] }));
  const live = getTeamRosterPlayers("Santos").slice(1);
  live.push({ ...live[0], id: "cpu-new-signing", name: "Contratação atual", isStarter: false });
  saveTeamRosterPlayers("Santos", live);
  const savedLive = getTeamRosterPlayers("Santos");
  saveLocalBudget("Santos", 1);
  saveLocalBudget("Botafogo", 123456);
  const outgoing = getTeamRosterPlayers("Botafogo");
  expect(acceptManagerOffer("Botafogo", "santos-offer")).toBe("Santos");
  expect(getLocalBudget("Santos")).toBe(7000000);
  expect(getTeamRosterPlayers("Santos")).toEqual(savedLive);
  expect(getTeamRosterPlayers("Botafogo")).toEqual(outgoing);
  expect(getLocalBudget("Botafogo")).toBe(123456);
  expect(getLocalChampionship("Santos").current_round).toBe(11);
  expect(getLocalMatches("Santos")).toEqual(getLocalMatches("Botafogo"));
  expect(getLocalStandings("Santos")).toEqual(getLocalStandings("Botafogo"));
  expect(getManagerOffers("Santos")).toHaveLength(0);
  expect(acceptManagerOffer("Botafogo", "santos-offer")).toBeNull();
});