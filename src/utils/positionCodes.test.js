import { test, expect } from "bun:test";
import { normalizePositionCode, normalizePlayerPositions } from "./positionCodes";
import { FORMATIONS } from "../data/formations";

test("PE vira ME, PD vira MD, MEI vira MC", () => {
  expect(normalizePositionCode("PE")).toBe("ME");
  expect(normalizePositionCode("PD")).toBe("MD");
  expect(normalizePositionCode("MEI")).toBe("MC");
  expect(normalizePositionCode("ATA")).toBe("ATA");
});

test("alternativas convertidas sem duplicar a principal", () => {
  const p = normalizePlayerPositions({ name: "x", position: "MEI", altPositions: ["MC", "PE", "ME"] });
  expect(p.position).toBe("MC");
  expect(p.altPositions).toEqual(["ME"]);
});

test("nenhuma formação usa códigos antigos", () => {
  const roles = Object.values(FORMATIONS).flatMap((f) => (f.positions ?? []).map((s) => s.role));
  expect(roles.length).toBeGreaterThan(0);
  expect(roles.filter((r) => ["PE", "PD", "MEI"].includes(r))).toEqual([]);
});
