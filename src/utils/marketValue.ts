import { Player } from "@/data/players";

// Calcula o valor de mercado baseado no overall do jogador (ou usa valor customizado)
export const calculateMarketValue = (overallOrPlayer: number | Player): number => {
  if (typeof overallOrPlayer !== 'number') {
    // Player object - check for custom value
    if (overallOrPlayer.marketValue) return overallOrPlayer.marketValue;
    return calculateMarketValueByOvr(overallOrPlayer.overall);
  }
  return calculateMarketValueByOvr(overallOrPlayer);
};

const calculateMarketValueByOvr = (overall: number): number => {
  if (overall <= 70) return 500000;
  if (overall <= 75) return 1000000 + (overall - 70) * 200000;
  if (overall <= 80) return 2000000 + (overall - 75) * 600000;
  if (overall <= 85) return 5000000 + (overall - 80) * 2000000;
  if (overall <= 90) return 15000000 + (overall - 85) * 5000000;
  return 40000000 + (overall - 90) * 10000000;
};

// Formata o valor em milhões ou milhares
export const formatMarketValue = (value: number): string => {
  if (value >= 1000000) {
    const millions = value / 1000000;
    return `$ ${millions.toFixed(1)}M`;
  }
  const thousands = value / 1000;
  return `$ ${thousands.toFixed(0)}K`;
};
