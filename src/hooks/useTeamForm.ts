import { useState, useEffect } from "react";
import { getLocalTeamForm } from "@/utils/localChampionship";

export type MatchResult = 'V' | 'E' | 'D' | '-';

export const useTeamForm = (teamName: string, championshipId: string | undefined) => {
  const [form, setForm] = useState<MatchResult[]>(['-', '-', '-', '-', '-']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teamName) {
      setForm(['-', '-', '-', '-', '-']);
      return;
    }

    // Get user team name from URL or context to look up local matches
    // We need the "owner" team name to find the right localStorage key
    // The championshipId format is "local-xxx" - we extract from matches stored under the user's team
    // For simplicity, search all possible local match stores
    const searchParams = new URLSearchParams(window.location.search);
    const userTeam = searchParams.get("time") || "";

    if (userTeam) {
      const result = getLocalTeamForm(userTeam, teamName);
      setForm(result);
    }
  }, [teamName, championshipId]);

  return { form, loading };
};
