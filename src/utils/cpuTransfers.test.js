import { test, expect } from "bun:test";
import { cpuAskingPrice } from "./cpuTransfers";
test("bot pede entre 105% e 130% do valor", () => {
  expect(cpuAskingPrice(10_000_000, 0)).toBe(10_500_000);
  expect(cpuAskingPrice(10_000_000, 1)).toBe(13_000_000);
});
