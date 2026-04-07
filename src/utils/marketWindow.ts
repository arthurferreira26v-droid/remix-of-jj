/**
 * Market Transfer Window Logic
 * 
 * The transfer market is open during specific rounds:
 * - Rounds 1-10: OPEN (início da temporada)
 * - Rounds 11-20: CLOSED (meio da temporada)
 * - Rounds 21-28: OPEN (janela de meio de ano)
 * - Rounds 29-38: CLOSED (reta final)
 */

export const MARKET_WINDOWS = [
  { start: 1, end: 10, label: "Janela 1" },
  { start: 21, end: 28, label: "Janela 2" },
];

export function isMarketOpen(currentRound: number): boolean {
  return MARKET_WINDOWS.some(w => currentRound >= w.start && currentRound <= w.end);
}

export function getMarketStatusForRound(round: number): { open: boolean; label: string } {
  const window = MARKET_WINDOWS.find(w => round >= w.start && round <= w.end);
  return {
    open: !!window,
    label: window ? `${window.label} (aberta)` : "Mercado fechado",
  };
}
