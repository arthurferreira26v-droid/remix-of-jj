import { beforeEach, expect, test } from "bun:test";
import { readTeamTactics, persistTeamTactics, mergeMatchOutcomes } from "./teamConfiguration.ts";

beforeEach(() => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
});

test("home formation 4-5-1 and both tactical styles persist for the next match", () => {
  const tactics = { formation: "4-5-1", playStyle: "counter", gameStyle: "through_wings" };
  persistTeamTactics("Arsenal", tactics);
  expect(readTeamTactics("Arsenal")).toEqual(tactics);
});

test("temporary match formation and tactical styles never overwrite home settings", () => {
  const principal = { formation: "4-5-1", playStyle: "counter", gameStyle: "through_wings" };
  persistTeamTactics("Arsenal", principal);
  persistTeamTactics("Arsenal", { formation: "4-4-2", playStyle: "possession", gameStyle: "through_middle" }, false);
  expect(readTeamTactics("Arsenal")).toEqual(principal);
});

test("match substitutions preserve principal starters, bench, unlisted players and array order", () => {
  const principal = [
    { id: "starter", isStarter: true, isListed: true },
    { id: "bench", isStarter: false, isListed: true },
    { id: "unlisted", isStarter: false, isListed: false },
  ];
  const temporary = [
    { ...principal[1], isStarter: true, energy: 86 },
    { ...principal[0], isStarter: false, energy: 100 },
    { ...principal[2], isListed: true, energy: 100 },
  ];
  const result = mergeMatchOutcomes(principal, temporary);
  expect(result.map(({ id, isStarter, isListed }) => ({ id, isStarter, isListed }))).toEqual(principal);
  expect(principal[0].isStarter).toBe(true);
  expect(temporary[0].isStarter).toBe(true);
});

test("energy, season participation and suspensions persist without changing the chosen starter", () => {
  const principal = [{ id: "starter", isStarter: true, isListed: true, energy: 100 }];
  const result = mergeMatchOutcomes(principal, [{
    id: "starter", isStarter: false, energy: 86, consecutiveMatches: 1,
    seasonStarterMatches: 1, seasonBenchMatches: 0, accumulatedYellows: 0,
    suspensionMatches: 1, matchRedCard: true,
  }]);
  expect(result[0]).toMatchObject({ isStarter: true, isListed: true, energy: 86,
    consecutiveMatches: 1, seasonStarterMatches: 1, suspensionMatches: 1,
    matchYellowCards: 0, matchRedCard: false });
});