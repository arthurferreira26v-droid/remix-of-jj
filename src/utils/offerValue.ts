/**
 * Conversão de valores de oferta digitados pelo usuário.
 * O usuário digita o valor cheio (ex.: 5.000.000 ou 5.350.000);
 * os pontos são separadores de milhar e ignorados na conversão.
 */

/** Converte o texto digitado em unidades inteiras (ex.: "5.350.000" -> 5350000). */
export function parseOfferValue(text: string): number {
  const digits = String(text).replace(/\D/g, "");
  if (!digits) return 0;
  const value = parseInt(digits, 10);
  return Number.isFinite(value) ? value : 0;
}

/** Formata unidades inteiras com separador de milhar (ex.: 5350000 -> "5.350.000"). */
export function formatOfferValue(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  return Math.round(value).toLocaleString("pt-BR");
}
