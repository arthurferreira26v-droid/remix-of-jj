// @ts-nocheck - Database types will be updated after migration
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { teams, Team } from "@/data/teams";
import { useAuth } from "@/hooks/useAuth";

// Times classificados diretamente na primeira temporada
const DIRECT_QUALIFIERS_FIRST_SEASON = [
  "Flamengo", "Palmeiras", "Fluminense", "Mirassol", "Cruzeiro"
];

// Times que jogam a pré-Libertadores na primeira temporada
const PRE_LIBERTADORES_FIRST_SEASON = [
  "Botafogo", "Bahia"
];

interface LibertadoresGroup {
  name: string;
  teams: {
    position: number;
    team_name: string;
    logo: string;
    points: number;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goal_difference: number;
  }[];
}

interface PreLibertadoresResult {
  team_name: string;
  opponent1: string;
  opponent1_logo: string;
  result1: "win" | "loss" | "draw";
  score1: string;
  opponent2: string;
  opponent2_logo: string;
  result2: "win" | "loss" | "draw";
  score2: string;
  qualified: boolean;
}

export const useLibertadores = (userTeamName: string, championshipId: string | undefined) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<LibertadoresGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [libertadoresId, setLibertadoresId] = useState<string | null>(null);
  const [preLibertadoresResults, setPreLibertadoresResults] = useState<PreLibertadoresResult[]>([]);

  useEffect(() => {
    if (!user || !championshipId) {
      setLoading(false);
      return;
    }
    initLibertadores();
  }, [user, championshipId]);

  const initLibertadores = async () => {
    setLoading(true);
    try {
      const libertName = `Libertadores - ${userTeamName}`;

      // Check if already exists
      const { data: existing } = await supabase
        .from("championships")
        .select("id")
        .eq("name", libertName)
        .eq("user_id", user!.id)
        .limit(1);

      if (existing && existing.length > 0) {
        const libId = existing[0].id;
        setLibertadoresId(libId);
        await loadGroups(libId);
        setLoading(false);
        return;
      }

      // Create Libertadores championship
      await createLibertadores(libertName);
    } catch (err) {
      console.error("Erro ao inicializar Libertadores:", err);
    } finally {
      setLoading(false);
    }
  };

  const simulateMatch = (): { homeScore: number; awayScore: number } => {
    // Simple simulation
    const homeScore = Math.floor(Math.random() * 4);
    const awayScore = Math.floor(Math.random() * 3);
    return { homeScore, awayScore };
  };

  const createLibertadores = async (libertName: string) => {
    // 1. Simulate pre-Libertadores
    const continentalTeams = teams.filter(t => t.league === "continental");
    const shuffled = [...continentalTeams].sort(() => Math.random() - 0.5);

    // Pick 4 random opponents for pre-Libertadores (2 per team)
    const preOpponents = shuffled.slice(0, 4);

    const preResults: PreLibertadoresResult[] = PRE_LIBERTADORES_FIRST_SEASON.map((teamName, i) => {
      const opp1 = preOpponents[i * 2];
      const opp2 = preOpponents[i * 2 + 1];

      const match1 = simulateMatch();
      const match2 = simulateMatch();

      const r1 = match1.homeScore > match1.awayScore ? "win" as const 
        : match1.homeScore < match1.awayScore ? "loss" as const : "draw" as const;
      const r2 = match2.homeScore > match2.awayScore ? "win" as const 
        : match2.homeScore < match2.awayScore ? "loss" as const : "draw" as const;

      // Must WIN both (not draw)
      const qualified = r1 === "win" && r2 === "win";

      return {
        team_name: teamName,
        opponent1: opp1.name,
        opponent1_logo: opp1.logo,
        result1: r1,
        score1: `${match1.homeScore}-${match1.awayScore}`,
        opponent2: opp2.name,
        opponent2_logo: opp2.logo,
        result2: r2,
        score2: `${match2.homeScore}-${match2.awayScore}`,
        qualified,
      };
    });

    setPreLibertadoresResults(preResults);

    // 2. Determine qualified Brazilian teams
    const qualifiedBrazilians = [
      ...DIRECT_QUALIFIERS_FIRST_SEASON,
      ...preResults.filter(r => r.qualified).map(r => r.team_name),
    ];

    // 3. Get Brazilian team objects
    const brazilianTeamObjs = qualifiedBrazilians
      .map(name => teams.find(t => t.name === name))
      .filter(Boolean) as Team[];

    // 4. Pick continental teams to fill 32 slots
    const usedOpponentIds = new Set(preOpponents.map(t => t.id));
    const availableContinental = continentalTeams.filter(t => !usedOpponentIds.has(t.id));
    const shuffledContinental = [...availableContinental].sort(() => Math.random() - 0.5);

    const slotsToFill = 32 - brazilianTeamObjs.length;
    const selectedContinental = shuffledContinental.slice(0, slotsToFill);

    const allLibertadoresTeams = [...brazilianTeamObjs, ...selectedContinental];

    // 5. Shuffle and assign to 8 groups of 4
    const shuffledAll = [...allLibertadoresTeams].sort(() => Math.random() - 0.5);
    const groupNames = ["A", "B", "C", "D", "E", "F", "G", "H"];

    // 6. Create championship in DB
    const { data: newChamp, error: champError } = await supabase
      .from("championships")
      .insert({
        name: libertName,
        season: "2024",
        current_round: 1,
        total_rounds: 6, // 6 rodadas na fase de grupos
        user_id: user!.id,
      })
      .select()
      .maybeSingle();

    if (champError || !newChamp) throw champError || new Error("Failed to create Libertadores");

    const libId = newChamp.id;
    setLibertadoresId(libId);

    // 7. Create standings for each team in their group
    const standingsData = shuffledAll.map((team, index) => {
      const groupIndex = Math.floor(index / 4);
      const posInGroup = (index % 4) + 1;
      return {
        championship_id: libId,
        team_id: team.id,
        team_name: team.name,
        logo: team.logo,
        group_name: `Grupo ${groupNames[groupIndex]}`,
        points: 0,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        position: posInGroup,
      };
    });

    const { error: standError } = await supabase
      .from("standings")
      .insert(standingsData);

    if (standError) throw standError;

    // 8. Load groups
    await loadGroups(libId);
  };

  const loadGroups = async (libId: string) => {
    const { data: standings, error } = await supabase
      .from("standings")
      .select("*")
      .eq("championship_id", libId)
      .order("points", { ascending: false })
      .order("goal_difference", { ascending: false });

    if (error || !standings) {
      console.error("Erro ao carregar grupos:", error);
      return;
    }

    // Group by group_name
    const groupMap = new Map<string, LibertadoresGroup["teams"]>();
    const groupNames = ["Grupo A", "Grupo B", "Grupo C", "Grupo D", "Grupo E", "Grupo F", "Grupo G", "Grupo H"];
    groupNames.forEach(g => groupMap.set(g, []));

    standings.forEach((s: any) => {
      const gName = s.group_name || "Grupo A";
      if (!groupMap.has(gName)) groupMap.set(gName, []);
      groupMap.get(gName)!.push({
        position: s.position,
        team_name: s.team_name,
        logo: s.logo,
        points: s.points,
        played: s.played,
        wins: s.wins,
        draws: s.draws,
        losses: s.losses,
        goals_for: s.goals_for,
        goal_difference: s.goal_difference,
      });
    });

    // Sort teams within each group by points, then GD
    const groupsArray: LibertadoresGroup[] = groupNames
      .filter(name => groupMap.has(name) && groupMap.get(name)!.length > 0)
      .map(name => ({
        name,
        teams: groupMap.get(name)!
          .sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference)
          .map((t, i) => ({ ...t, position: i + 1 })),
      }));

    setGroups(groupsArray);
  };

  return {
    groups,
    loading,
    libertadoresId,
    preLibertadoresResults,
  };
};
