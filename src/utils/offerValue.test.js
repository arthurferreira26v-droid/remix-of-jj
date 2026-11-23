import { describe, expect, test } from "bun:test";
import { parseOfferValue, formatOfferValue } from "./offerValue";

describe("parseOfferValue", () => {
  test("converte valor cheio com pontos de milhar", () => {
    expect(parseOfferValue("5.000.000")).toBe(5000000);
    expect(parseOfferValue("5.350.000")).toBe(5350000);
  });

  test("aceita valor sem pontos", () => {
    expect(parseOfferValue("5350000")).toBe(5350000);
  });

  test("ignora caracteres não numéricos", () => {
    expect(parseOfferValue("$ 5.350.000,00")).toBe(535000000);
  });

  test("retorna 0 para texto vazio ou inválido", () => {
    expect(parseOfferValue("")).toBe(0);
    expect(parseOfferValue("abc")).toBe(0);
  });
});

describe("formatOfferValue", () => {
  test("formata com separador de milhar", () => {
    expect(formatOfferValue(5000000)).toBe("5.000.000");
    expect(formatOfferValue(5350000)).toBe("5.350.000");
  });

  test("retorna vazio para zero ou inválido", () => {
    expect(formatOfferValue(0)).toBe("");
    expect(formatOfferValue(NaN)).toBe("");
  });
});
