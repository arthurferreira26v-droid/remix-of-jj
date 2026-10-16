/**
 * Verba inicial (caixa) de cada clube, por poder de mercado da sua liga.
 * Fonte única usada por useTeamBudget e localChampionship.
 * Times sem entrada no mapa recebem o valor padrão.
 */

export const TEAM_INITIAL_BUDGETS: Record<string, number> = {
  // ─── Brasileirão Série A ────────────────────────────────────────────────
  "Flamengo": 18000000,
  "Palmeiras": 17000000,
  "Botafogo": 15000000,
  "Corinthians": 12000000,
  "Internacional": 11000000,
  "São Paulo": 10000000,
  "Fluminense": 9000000,
  "Cruzeiro": 9000000,
  "Atlético Paranaense": 8000000,
  "Bahia": 8000000,
  "Santos": 7000000,
  "Grêmio": 7000000,
  "Atlético Mineiro": 7000000,
  "Bragantino": 7000000,
  "Vasco da Gama": 5000000,
  "Vitória": 5000000,
  "Coritiba": 4000000,
  "Chapecoense": 4000000,
  "Mirassol": 4000000,
  "Remo": 3000000,

  // ─── Premier League 2025/26 ─────────────────────────────────────────────
  "Manchester City": 120000000,
  "Arsenal": 110000000,
  "Liverpool": 110000000,
  "Chelsea": 100000000,
  "Manchester United": 95000000,
  "Tottenham": 80000000,
  "Newcastle": 80000000,
  "Aston Villa": 60000000,
  "Brighton": 50000000,
  "West Ham": 45000000,
  "Nottingham Forest": 40000000,
  "Crystal Palace": 35000000,
  "Everton": 35000000,
  "Fulham": 35000000,
  "Bournemouth": 30000000,
  "Brentford": 30000000,
  "Wolverhampton": 30000000,
  "Leeds United": 25000000,
  "Burnley": 25000000,
  "Sunderland": 25000000,

  // ─── LaLiga 2025/26 ─────────────────────────────────────────────────────
  "Real Madrid": 130000000,
  "Barcelona": 110000000,
  "Atlético de Madrid": 80000000,
  "Athletic Bilbao": 50000000,
  "Real Sociedad": 45000000,
  "Villarreal": 45000000,
  "Real Betis": 45000000,
  "Sevilla": 40000000,
  "Valencia": 35000000,
  "Girona": 35000000,
  "Celta de Vigo": 30000000,
  "Osasuna": 25000000,
  "Rayo Vallecano": 25000000,
  "Mallorca": 25000000,
  "Getafe": 20000000,
  "Alavés": 20000000,
  "Espanyol": 20000000,
  "Elche": 15000000,
  "Levante": 15000000,
  "Real Oviedo": 15000000,
};

export const DEFAULT_BUDGET = 5000000;

export function getDefaultBudget(teamName: string): number {
  return TEAM_INITIAL_BUDGETS[teamName] ?? DEFAULT_BUDGET;
}
