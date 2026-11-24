import { beforeEach, expect, test } from "bun:test";
import { saveTeamRosterPlayers, transferPlayerToTeamRoster, getDepartedPlayerIds } from "./teamRoster.ts";

beforeEach(() => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: k => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, String(v)),
    removeItem: k => values.delete(k),
  };
});

const p = (id) => ({ id, name: id, position: "ATA", overall: 70, age: 25, number: 9, isStarter: false });

test("player sold to a CPU club is marked as departed so admin refresh cannot bring him back", () => {
  saveTeamRosterPlayers("Santos", [p("neymar"), p("x")]);
  saveTeamRosterPlayers("Bahia", [p("y")]);
  transferPlayerToTeamRoster("Santos", "Bahia", "neymar");
  expect(getDepartedPlayerIds("Santos").has("neymar")).toBe(true);
  expect(getDepartedPlayerIds("Bahia").has("neymar")).toBe(false);
});

test("buying a player back clears his departed mark", () => {
  saveTeamRosterPlayers("Santos", [p("neymar")]);
  saveTeamRosterPlayers("Bahia", [p("y")]);
  transferPlayerToTeamRoster("Santos", "Bahia", "neymar");
  transferPlayerToTeamRoster("Bahia", "Santos", "neymar");
  expect(getDepartedPlayerIds("Santos").has("neymar")).toBe(false);
});
