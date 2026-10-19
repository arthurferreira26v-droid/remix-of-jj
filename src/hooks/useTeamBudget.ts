import { useState, useEffect } from "react";
import { getLocalBudget, saveLocalBudget } from "@/utils/localChampionship";
import { getDefaultBudget } from "@/utils/teamBudgets";

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

  return { budget, setBudget, loading, getDefaultBudget };
};
