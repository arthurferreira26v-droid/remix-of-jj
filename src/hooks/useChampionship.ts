import { useState, useEffect } from "react";
import { teams } from "@/data/teams";
import {
  getOrCreateLocalChampionship,
  getNextUserMatch,
  isChampionshipComplete,
  deleteLocalChampionship,
  getLocalStandings,
  type LocalMatch,
  type LocalChampionship,
} from "@/utils/localChampionship";

export const useChampionship = (userTeamName: string) => {
  const [championship, setChampionship] = useState<LocalChampionship | null>(null);
  const [nextMatch, setNextMatch] = useState<LocalMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChampionComplete, setIsChampionComplete] = useState(false);
  const [userWonChampionship, setUserWonChampionship] = useState(false);

  useEffect(() => {
    const init = () => {
      setLoading(true);

      const userTeam = teams.find(t => t.name === userTeamName);
      if (!userTeam) {
        setLoading(false);
        return;
      }

      try {
        const { championship: champ } = getOrCreateLocalChampionship(userTeamName);
        setChampionship(champ);

        // Check completion
        const { complete, winner } = isChampionshipComplete(userTeamName);
        if (complete) {
          setIsChampionComplete(true);
          setUserWonChampionship(winner === userTeamName);
          setLoading(false);
          return;
        }

        // Get next match
        const next = getNextUserMatch(userTeamName);
        setNextMatch(next);
      } catch (error) {
        console.error("Erro ao inicializar campeonato:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [userTeamName]);

  const resetChampionship = () => {
    // Get final standings for Libertadores qualifiers
    const standings = getLocalStandings(userTeamName);
    if (standings.length >= 6) {
      const sorted = [...standings].sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference);
      const directQualifiers = sorted.slice(0, 4).map(s => s.team_name);
      const preLibTeams = sorted.slice(4, 6).map(s => s.team_name);
      localStorage.setItem('lib_direct_qualifiers', JSON.stringify(directQualifiers));
      localStorage.setItem('lib_prelib_teams', JSON.stringify(preLibTeams));
    }

    deleteLocalChampionship(userTeamName);

    setIsChampionComplete(false);
    setUserWonChampionship(false);
    window.location.href = `/jogo?time=${encodeURIComponent(userTeamName)}`;
  };

  return {
    championship,
    nextMatch,
    loading,
    isChampionComplete,
    userWonChampionship,
    resetChampionship,
  };
};
