import { useState, useEffect } from "react";
import { getLocalBudget, saveLocalBudget } from "@/utils/localChampionship";

const TEAM_INITIAL_BUDGETS: Record<string, number> = {
  "Flamengo": 18000000,
  "Palmeiras": 17000000,
  "Botafogo": 15000000,
  "Corinthians": 12000000,
  "Internacional": 11000000,
  "São Paulo": 10000000,
  "Fluminense": 9000000,
  "Cruzeiro": 9000000,
  "Santos": 7000000,
  "Grêmio": 7000000,
  "Atlético Mineiro": 7000000,
  "Vasco da Gama": 5000000,
};

export const useTeamBudget = (teamName: string, championshipId: string | undefined) => {
  const [budget, setBudgetState] = useState<number>(() => getLocalBudget(teamName));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBudgetState(getLocalBudget(teamName));
  }, [teamName]);

  const setBudget = (newBudget: number) => {
    setBudgetState(newBudget);
    saveLocalBudget(teamName, newBudget);
  };

  return { budget, setBudget, loading };
};
