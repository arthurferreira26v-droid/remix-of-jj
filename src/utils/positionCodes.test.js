import { test, expect } from "bun:test";
import { normalizePlayerPositions } from "./positionCodes";
import { formations } from "../data/formations";

test("PE também joga de ME, PD de MD, MEI de MC (e vice-versa)", () => {
  expect(normalizePlayerPositions({ position: "PE" }).altPositions).toEqual(["ME"]);
  expect(normalizePlayerPositions({ position: "PD" }).altPositions).toEqual(["MD"]);
  expect(normalizePlayerPositions({ position: "MEI" }).altPositions).toEqual(["MC"]);
  expect(normalizePlayerPositions({ position: "ME" }).altPositions).toEqual(["PE"]);
});

test("posição principal é mantida", () => {
  const p = normalizePlayerPositions({ position: "PE", altPositions: ["ATA"] });
  expect(p.position).toBe("PE");
  expect(p.altPositions).toEqual(["ATA", "ME"]);
});

test("formações voltaram a usar PE, PD e MEI", () => {
  const roles = formations.flatMap((f) => (f.positions ?? []).map((s) => s.role));
  expect(roles).toContain("PE");
  expect(roles).toContain("PD");
  expect(roles).toContain("MEI");
});
