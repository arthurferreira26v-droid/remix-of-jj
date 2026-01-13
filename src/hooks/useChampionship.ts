// @ts-nocheck - Database types will be updated after migration
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { teams, Team } from "@/data/teams";
import { useAuth } from "@/hooks/useAuth";

interface Match {
  id: string;
  championship_id: string;
  round: number;
  home_team_id: string;
  home_team_name: string;
  home_team_logo: string;
  away_team_id: string;
  away_team_name: string;
  away_team_logo: string;
  home_score: number | null;
  away_score: number | null;
  is_played: boolean;
}

interface Championship {
  id: string;
  name: string;
  season: string;
  current_round: number;
  total_rounds: number;
}

interface Standing {
  team_name: string;
  points: number;
  played: number;
  goal_difference: number;
}

export const useChampionship = (userTeamName: string) => {
  const { user } = useAuth();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChampionComplete, setIsChampionComplete] = useState(false);
  const [userWonChampionship, setUserWonChampionship] = useState(false);

  const generateChampionshipFixtures = (userTeam: Team, allTeams: Team[]) => {
    const fixtures: Omit<Match, "id" | "championship_id">[] = [];
    const numTeams = allTeams.length;
    const rounds = (numTeams - 1) * 2; // Turno e returno
    
    // Algoritmo round-robin para gerar todos os jogos
    // Cada time joga contra todos os outros 2 vezes (casa e fora)
    const teams = [...allTeams];
    
    // Primeiro turno
    for (let round = 0; round < numTeams - 1; round++) {
      // Em cada rodada, metade dos times joga em casa e metade fora
      for (let match = 0; match < numTeams / 2; match++) {
        const home = teams[match];
        const away = teams[numTeams - 1 - match];
        
        fixtures.push({
          round: round + 1,
          home_team_id: home.id,
          home_team_name: home.name,
          home_team_logo: home.logo,
          away_team_id: away.id,
          away_team_name: away.name,
          away_team_logo: away.logo,
          home_score: null,
          away_score: null,
          is_played: false,
        });
      }
      
      // Rotacionar times (exceto o primeiro)
      const lastTeam = teams.pop()!;
      teams.splice(1, 0, lastTeam);
    }
    
    // Segundo turno (inverter casa e fora)
    const firstTurnMatches = [...fixtures];
    firstTurnMatches.forEach((match) => {
      fixtures.push({
        round: match.round + (numTeams - 1),
        home_team_id: match.away_team_id,
        home_team_name: match.away_team_name,
        home_team_logo: match.away_team_logo,
        away_team_id: match.home_team_id,
        away_team_name: match.home_team_name,
        away_team_logo: match.home_team_logo,
        home_score: null,
        away_score: null,
        is_played: false,
      });
    });

    return fixtures;
  };

  useEffect(() => {
    const initChampionship = async () => {
      setLoading(true);
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      const userTeam = teams.find(t => t.name === userTeamName);
      if (!userTeam) {
        setLoading(false);
        return;
      }

      // Buscar times da mesma liga do usuário
      const leagueTeams = teams.filter(t => t.league === userTeam.league);
      const championshipName = userTeam.league === "brasileiro" 
        ? `Brasileirão - ${userTeamName}`
        : `Liga dos Campeões - ${userTeamName}`;

      // Verificar se veio de um load de save (flag no sessionStorage)
      const isLoadedFromSave = sessionStorage.getItem(`loaded_save_${userTeamName}`) === 'true';

      try {
        const { data: existingChampionships, error: fetchError } = await supabase
          .from("championships")
          .select("*")
          .eq("name", championshipName)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        let championshipId: string;

        // Se existe campeonato E veio de um save carregado, manter o campeonato
        if (existingChampionships && existingChampionships.length > 0 && isLoadedFromSave) {
          championshipId = existingChampionships[0].id;
          
          // Limpar a flag após usar
          sessionStorage.removeItem(`loaded_save_${userTeamName}`);
          
          // Verificar se todas as partidas foram jogadas
          const { data: remainingMatches } = await supabase
            .from("matches")
            .select("id")
            .eq("championship_id", championshipId)
            .eq("is_played", false)
            .limit(1);
          
          // Se não há partidas restantes, verificar vencedor
          if (!remainingMatches || remainingMatches.length === 0) {
            setIsChampionComplete(true);
            
            // Verificar se o usuário ganhou o campeonato
            const { data: standings } = await supabase
              .from("standings")
              .select("team_name, points, played, goal_difference")
              .eq("championship_id", championshipId)
              .order("points", { ascending: false })
              .order("goal_difference", { ascending: false })
              .limit(1);
            
            if (standings && standings.length > 0) {
              const winner = standings[0];
              setUserWonChampionship(winner.team_name === userTeamName);
            }
            
            setChampionship(existingChampionships[0]);
            setLoading(false);
            return;
          } else {
            setChampionship(existingChampionships[0]);
          }
        } else {
          // Deletar campeonato existente se houver (começar do zero)
          if (existingChampionships && existingChampionships.length > 0) {
            const oldChampionshipId = existingChampionships[0].id;
            await supabase.from("matches").delete().eq("championship_id", oldChampionshipId);
            await supabase.from("standings").delete().eq("championship_id", oldChampionshipId);
            await supabase.from("team_budgets").delete().eq("championship_id", oldChampionshipId);
            await supabase.from("championships").delete().eq("id", oldChampionshipId);
          }

          // Limpar dados locais do time (sempre começar fresh)
          localStorage.removeItem(`players_${userTeamName}`);
          localStorage.removeItem(`tactics_formation_${userTeamName}`);
          localStorage.removeItem(`tactics_playstyle_${userTeamName}`);
          localStorage.removeItem(`investment_${userTeamName}`);

          // Criar novo campeonato começando da rodada 1
          const { data: newChampionship, error: createError } = await supabase
            .from("championships")
            .insert({
              name: championshipName,
              season: "2024",
              current_round: 1,
              total_rounds: (leagueTeams.length - 1) * 2,
              user_id: user.id,
            })
            .select()
            .maybeSingle();

          if (createError) throw createError;
          if (!newChampionship) throw new Error("Falha ao criar campeonato");
          
          championshipId = newChampionship.id;
          setChampionship(newChampionship);

          const fixtures = generateChampionshipFixtures(userTeam, leagueTeams);
          const fixturesWithChampionship = fixtures.map(f => ({
            ...f,
            championship_id: championshipId,
          }));

          const { error: insertError } = await supabase
            .from("matches")
            .insert(fixturesWithChampionship);

          if (insertError) throw insertError;

          const standingsData = leagueTeams.map(team => ({
            championship_id: championshipId,
            team_id: team.id,
            team_name: team.name,
            logo: team.logo,
            points: 0,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
            goal_difference: 0,
            position: 1,
          }));

          const { error: standingsError } = await supabase
            .from("standings")
            .insert(standingsData);

          if (standingsError) throw standingsError;
        }

        const { data: matches, error: matchError } = await supabase
          .from("matches")
          .select("*")
          .eq("championship_id", championshipId)
          .eq("is_played", false)
          .or(`home_team_name.eq.${userTeamName},away_team_name.eq.${userTeamName}`)
          .order("round", { ascending: true })
          .limit(1);

        if (matchError) throw matchError;

        if (matches && matches.length > 0) {
          setNextMatch(matches[0]);
        }
      } catch (error) {
        console.error("Erro ao inicializar campeonato:", error);
      } finally {
        setLoading(false);
      }
    };

    initChampionship();
  }, [userTeamName, user]);

  const resetChampionship = async () => {
    if (!championship) return;
    
    setLoading(true);
    
    // Deletar campeonato atual e dados relacionados
    await supabase.from("matches").delete().eq("championship_id", championship.id);
    await supabase.from("standings").delete().eq("championship_id", championship.id);
    await supabase.from("championships").delete().eq("id", championship.id);
    
    // Reinicializar
    setIsChampionComplete(false);
    setUserWonChampionship(false);
    window.location.href = "/";
  };

  return { 
    championship, 
    nextMatch, 
    loading, 
    isChampionComplete, 
    userWonChampionship,
    resetChampionship 
  };
};
