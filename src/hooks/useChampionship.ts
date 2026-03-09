import { useState, useEffect, useRef } from "react";
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
import { evolveTeamPlayers, clearOvrChanges } from "@/utils/playerEvolution";
import { toast } from "sonner";

export const useChampionship = (userTeamName: string) => {
  const [championship, setChampionship] = useState<LocalChampionship | null>(null);
  const [nextMatch, setNextMatch] = useState<LocalMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChampionComplete, setIsChampionComplete] = useState(false);
  const [userWonChampionship, setUserWonChampionship] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    // Anti-loop: only init once per team name
    if (initRef.current) return;
    initRef.current = true;

    const userTeam = teams.find(t => t.name === userTeamName);
    if (!userTeam) {
      setLoading(false);
      return;
    }

    try {
      const { championship: champ } = getOrCreateLocalChampionship(userTeamName);
      setChampionship(champ);

      const { complete, winner } = isChampionshipComplete(userTeamName);
      if (complete) {
        setIsChampionComplete(true);
        setUserWonChampionship(winner === userTeamName);
        setLoading(false);
        return;
      }

      setNextMatch(getNextUserMatch(userTeamName));
    } catch (error) {
      console.error("Erro ao inicializar campeonato:", error);
    } finally {
      setLoading(false);
    }

    return () => { initRef.current = false; };
  }, [userTeamName]);

  const resetChampionship = () => {
    // ══════════════════════════════════════════════════════════════════════════
    // EVOLUÇÃO DE JOGADORES AO FINAL DA TEMPORADA
    // ══════════════════════════════════════════════════════════════════════════
    const savedPlayers = localStorage.getItem(`players_${userTeamName}`);
    if (savedPlayers) {
      try {
        const currentPlayers = JSON.parse(savedPlayers);
        const { evolvedPlayers, improvements, declines, improvedNames, declinedNames } = evolveTeamPlayers(currentPlayers);
        
        // Limpar indicadores de mudança após salvar
        const finalPlayers = clearOvrChanges(evolvedPlayers);
        localStorage.setItem(`players_${userTeamName}`, JSON.stringify(finalPlayers));
        
        // Notificações de evolução
        if (improvements > 0) {
          toast.success(`📈 ${improvements} jogador(es) evoluíram na temporada!`, {
            description: improvedNames.slice(0, 5).join(", ") + (improvedNames.length > 5 ? ` e mais ${improvedNames.length - 5}...` : ""),
            duration: 6000,
          });
        }
        if (declines > 0) {
          toast.warning(`📉 ${declines} jogador(es) declinaram`, {
            description: declinedNames.slice(0, 5).join(", ") + (declinedNames.length > 5 ? ` e mais ${declinedNames.length - 5}...` : ""),
            duration: 6000,
          });
        }
      } catch (e) {
        console.error("Erro ao evoluir jogadores:", e);
      }
    }

    // Salvar qualificados para Libertadores
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
