import { beforeAll, expect, test } from "bun:test";
import { plugin } from "bun";

plugin({ name: "test-image-imports", setup(build) {
  build.onLoad({ filter: /\.(png|svg)$/ }, args => ({ contents: `export default ${JSON.stringify(args.path)}`, loader: "js" }));
} });

let registry;
beforeAll(async () => { registry = await import("./teams"); });

test("France is the fourth selectable playable league", () => {
  expect(registry.leagues.map(l => l.id)).toEqual(["brasileiro", "ingles", "espanhol", "frances"]);
  expect(registry.PLAYABLE_LEAGUES).toContain("frances");
});

test("Ligue 1 includes all 18 clubs from 2025/26 without duplicate ids", () => {
  const clubs = registry.teams.filter(t => t.league === "frances");
  expect(clubs.map(t => t.id).sort()).toEqual(["psg", "monaco", "marseille", "strasbourg", "lyon", "lille", "rennes", "lens", "nice", "toulouse", "paris-fc", "nantes", "lorient", "brest", "auxerre", "le-havre", "angers", "metz"].sort());
  expect(clubs.every(t => t.playable === true)).toBe(true);
  expect(new Set(registry.teams.map(t => t.id)).size).toBe(registry.teams.length);
  expect(registry.getLeagueTeamNames("Paris Saint-Germain")).toHaveLength(18);
  expect(registry.getCompetitionShortName("Paris Saint-Germain")).toBe("Ligue 1");
});