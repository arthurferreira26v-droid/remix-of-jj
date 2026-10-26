import { beforeAll, expect, test } from "bun:test";

let squads;
beforeAll(async () => {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing project connection for roster checks");
  const response = await fetch(`${url}/rest/v1/admin_player_overrides?select=team_id,players&team_id=in.(santos,flamengo)`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) throw new Error(`Roster read failed: ${response.status}`);
  squads = Object.fromEntries((await response.json()).map(row => [row.team_id, row.players]));
});

test("Santos has Neymar, Gabigol, Everton Cebolinha and Rodinei in the verified roster update", () => {
  const names = squads.santos.map(player => player.name);
  for (const name of ["Neymar", "Gabigol", "Everton Cebolinha", "Rodinei"]) expect(names).toContain(name);
});

test("departed Santos players are removed from the official base roster", () => {
  const names = squads.santos.map(player => player.name);
  for (const name of ["Vladimir", "Hayner", "Gil", "Jair", "Soteldo", "Otero", "Willian Bigode"]) expect(names).not.toContain(name);
});

test("Flamengo reflects arrivals and departures in the verified roster update", () => {
  const names = squads.flamengo.map(player => player.name);
  for (const name of ["Anthony Valencia", "Joaquín Freitas", "Lucas Paquetá"]) expect(names).toContain(name);
  for (const name of ["Everton", "Everton Cebolinha", "Wallace Yan", "Rodinei", "Gabigol"]) expect(names).not.toContain(name);
});