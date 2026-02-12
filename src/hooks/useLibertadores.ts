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
  result1: "win" | "loss" | "draw" | "pending";
  score1: string;
  opponent2: string;
  opponent2_logo: string;
  result2: "win" | "loss" | "draw" | "pending";
  score2: string;
  qualified: boolean | null;
}

interface LibertadoresMatch {
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

export const useLibertadores = (userTeamName: string, brasileiraoChampionshipId: string | undefined) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<LibertadoresGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [libertadoresId, setLibertadoresId] = useState<string | null>(null);
  const [preLibertadoresId, setPreLibertadoresId] = useState<string | null>(null);
  const [preLibertadoresResults, setPreLibertadoresResults] = useState<PreLibertadoresResult[]>([]);
  const [nextLibertadoresMatch, setNextLibertadoresMatch] = useState<LibertadoresMatch | null>(null);
  const [nextLibertadoresChampionshipId, setNextLibertadoresChampionshipId] = useState<string | null>(null);
  const [userQualified, setUserQualified] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user || !brasileiraoChampionshipId) {
      setLoading(false);
      return;
    }
    initLibertadores();
  }, [user, brasileiraoChampionshipId]);

  const initLibertadores = async () => {
    setLoading(true);
    try {
      const isPreLibTeam = PRE_LIBERTADORES_FIRST_SEASON.includes(userTeamName);

      if (isPreLibTeam) {
        await handlePreLibTeam();
      } else {
        await handleDirectQualifier();
      }
    } catch (err) {
      console.error("Erro ao inicializar Libertadores:", err);
    } finally {
      setLoading(false);
    }
  };

  // ========== PRE-LIBERTADORES ==========
  const handlePreLibTeam = async () => {
    const preLibName = `Pré-Libertadores - ${userTeamName}`;

    // Check if pre-lib exists
    const { data: existing } = await supabase
      .from("championships")
      .select("id")
      .eq("name", preLibName)
      .eq("user_id", user!.id)
      .limit(1);

    if (existing && existing.length > 0) {
      const preLibId = existing[0].id;
      setPreLibertadoresId(preLibId);

      // Check if all pre-lib matches are played
      const { data: unplayed } = await supabase
        .from("matches")
        .select("id")
        .eq("championship_id", preLibId)
        .eq("is_played", false)
        .limit(1);

      if (!unplayed || unplayed.length === 0) {
        // All played - check qualification
        const qualified = await checkPreLibQualification(preLibId);
        setUserQualified(qualified);
        await loadPreLibResults(preLibId);

        // Create or load Libertadores groups
        await handleDirectQualifier();
      } else {
        // Pre-lib still in progress - find next match
        await loadNextPreLibMatch(preLibId);
        await loadPreLibResults(preLibId);
      }
      return;
    }

    // Create pre-Libertadores
    await createPreLibertadores(preLibName);
  };

  const createPreLibertadores = async (preLibName: string) => {
    const continentalTeams = teams.filter(t => t.league === "continental");
    const shuffled = [...continentalTeams].sort(() => Math.random() - 0.5);
    const opponents = shuffled.slice(0, 2);

    const userTeam = teams.find(t => t.name === userTeamName);
    if (!userTeam) return;

    const { data: newChamp } = await supabase
      .from("championships")
      .insert({
        name: preLibName,
        season: "2024",
        current_round: 1,
        total_rounds: 4,
        user_id: user!.id,
      })
      .select()
      .maybeSingle();

    if (!newChamp) return;
    setPreLibertadoresId(newChamp.id);

    // 4 matches: 2 ties × 2 legs (ida e volta)
    const matchData = [
      // Confronto 1 - Ida (casa)
      { round: 1, home: userTeam, away: opponents[0] },
      // Confronto 1 - Volta (fora)
      { round: 2, home: opponents[0], away: userTeam },
      // Confronto 2 - Ida (casa)
      { round: 3, home: userTeam, away: opponents[1] },
      // Confronto 2 - Volta (fora)
      { round: 4, home: opponents[1], away: userTeam },
    ].map(m => ({
      championship_id: newChamp.id,
      round: m.round,
      home_team_id: m.home.id,
      home_team_name: m.home.name,
      home_team_logo: m.home.logo,
      away_team_id: m.away.id,
      away_team_name: m.away.name,
      away_team_logo: m.away.logo,
      home_score: null,
      away_score: null,
      is_played: false,
    }));

    await supabase.from("matches").insert(matchData);

    // Load next match
    await loadNextPreLibMatch(newChamp.id);
  };

  const loadNextPreLibMatch = async (preLibId: string) => {
    const { data: nextMatch } = await supabase
      .from("matches")
      .select("*")
      .eq("championship_id", preLibId)
      .eq("is_played", false)
      .order("round", { ascending: true })
      .limit(1);

    if (nextMatch && nextMatch.length > 0) {
      setNextLibertadoresMatch(nextMatch[0]);
      setNextLibertadoresChampionshipId(preLibId);
    }
  };

  const loadPreLibResults = async (preLibId: string) => {
    const { data: allMatches } = await supabase
      .from("matches")
      .select("*")
      .eq("championship_id", preLibId)
      .order("round", { ascending: true });

    if (!allMatches || allMatches.length === 0) return;

    // Get opponents from rounds 1-2 and 3-4
    const tie1Matches = allMatches.filter(m => m.round <= 2);
    const tie2Matches = allMatches.filter(m => m.round >= 3);

    const getOpponentName = (matches: any[]) => {
      const m = matches[0];
      return m.home_team_name === userTeamName ? m.away_team_name : m.home_team_name;
    };

    const getOpponentLogo = (matches: any[]) => {
      const m = matches[0];
      return m.home_team_name === userTeamName ? m.away_team_logo : m.home_team_logo;
    };

    const getAggregateResult = (matches: any[]): { result: "win" | "loss" | "draw" | "pending"; score: string } => {
      const played = matches.filter(m => m.is_played);
      if (played.length < 2) return { result: "pending", score: "- x -" };

      let userGoals = 0, oppGoals = 0;
      for (const m of played) {
        if (m.home_team_name === userTeamName) {
          userGoals += m.home_score || 0;
          oppGoals += m.away_score || 0;
        } else {
          userGoals += m.away_score || 0;
          oppGoals += m.home_score || 0;
        }
      }
      const result = userGoals > oppGoals ? "win" : userGoals < oppGoals ? "loss" : "draw";
      return { result, score: `${userGoals} x ${oppGoals}` };
    };

    const tie1 = getAggregateResult(tie1Matches);
    const tie2 = getAggregateResult(tie2Matches);

    const qualified = tie1.result === "win" && tie2.result === "win" ? true
      : (tie1.result !== "pending" && tie2.result !== "pending") 
        ? false : null;

    const result: PreLibertadoresResult = {
      team_name: userTeamName,
      opponent1: tie1Matches.length > 0 ? getOpponentName(tie1Matches) : "",
      opponent1_logo: tie1Matches.length > 0 ? getOpponentLogo(tie1Matches) : "",
      result1: tie1.result,
      score1: tie1.score,
      opponent2: tie2Matches.length > 0 ? getOpponentName(tie2Matches) : "",
      opponent2_logo: tie2Matches.length > 0 ? getOpponentLogo(tie2Matches) : "",
      result2: tie2.result,
      score2: tie2.score,
      qualified,
    };

    setPreLibertadoresResults([result]);
  };

  const checkPreLibQualification = async (preLibId: string): Promise<boolean> => {
    const { data: allMatches } = await supabase
      .from("matches")
      .select("*")
      .eq("championship_id", preLibId)
      .order("round", { ascending: true });

    if (!allMatches || allMatches.length < 4) return false;

    // Check tie 1 (rounds 1-2) - aggregate
    const tie1 = allMatches.filter(m => m.round <= 2);
    let userGoals1 = 0, oppGoals1 = 0;
    for (const m of tie1) {
      if (m.home_team_name === userTeamName) {
        userGoals1 += m.home_score || 0;
        oppGoals1 += m.away_score || 0;
      } else {
        userGoals1 += m.away_score || 0;
        oppGoals1 += m.home_score || 0;
      }
    }

    // Check tie 2 (rounds 3-4) - aggregate
    const tie2 = allMatches.filter(m => m.round >= 3);
    let userGoals2 = 0, oppGoals2 = 0;
    for (const m of tie2) {
      if (m.home_team_name === userTeamName) {
        userGoals2 += m.home_score || 0;
        oppGoals2 += m.away_score || 0;
      } else {
        userGoals2 += m.away_score || 0;
        oppGoals2 += m.home_score || 0;
      }
    }

    return userGoals1 > oppGoals1 && userGoals2 > oppGoals2;
  };

  // ========== DIRECT QUALIFIER / GROUP STAGE ==========
  const handleDirectQualifier = async () => {
    const libertName = `Libertadores - ${userTeamName}`;

    // Check if exists
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

      // Find next user match in group stage
      await loadNextGroupMatch(libId);
      return;
    }

    // For pre-lib teams, check if qualified
    const isPreLibTeam = PRE_LIBERTADORES_FIRST_SEASON.includes(userTeamName);
    if (isPreLibTeam && userQualified !== true) {
      // Check again from DB
      const preLibName = `Pré-Libertadores - ${userTeamName}`;
      const { data: preLibChamp } = await supabase
        .from("championships")
        .select("id")
        .eq("name", preLibName)
        .eq("user_id", user!.id)
        .limit(1);

      if (preLibChamp && preLibChamp.length > 0) {
        const qualified = await checkPreLibQualification(preLibChamp[0].id);
        if (!qualified) {
          // Not qualified - simulate other pre-lib team and create groups without user
          await createLibertadoresWithoutPreLibTeam(libertName);
          return;
        }
      } else {
        // Pre-lib not started yet
        return;
      }
    }

    // Create Libertadores with full groups
    await createLibertadores(libertName, true);
  };

  const createLibertadoresWithoutPreLibTeam = async (libertName: string) => {
    // Same as createLibertadores but user not included
    await createLibertadores(libertName, false);
  };

  const createLibertadores = async (libertName: string, includeUser: boolean) => {
    const continentalTeams = teams.filter(t => t.league === "continental");

    // Determine qualified Brazilian teams
    const qualifiedBrazilians: string[] = [...DIRECT_QUALIFIERS_FIRST_SEASON];

    // For pre-lib teams, add qualified ones
    for (const preLibTeam of PRE_LIBERTADORES_FIRST_SEASON) {
      if (preLibTeam === userTeamName) {
        if (includeUser) qualifiedBrazilians.push(preLibTeam);
      } else {
        // Simulate other pre-lib team (50% chance)
        if (Math.random() < 0.5) qualifiedBrazilians.push(preLibTeam);
      }
    }

    const brazilianTeamObjs = qualifiedBrazilians
      .map(name => teams.find(t => t.name === name))
      .filter(Boolean) as Team[];

    // Fill 32 slots with continental teams
    const shuffledContinental = [...continentalTeams].sort(() => Math.random() - 0.5);
    const slotsToFill = 32 - brazilianTeamObjs.length;
    const selectedContinental = shuffledContinental.slice(0, slotsToFill);

    const allTeamsForGroups = [...brazilianTeamObjs, ...selectedContinental];
    const shuffledAll = [...allTeamsForGroups].sort(() => Math.random() - 0.5);
    const groupNames = ["A", "B", "C", "D", "E", "F", "G", "H"];

    // Create championship
    const { data: newChamp, error: champError } = await supabase
      .from("championships")
      .insert({
        name: libertName,
        season: "2024",
        current_round: 1,
        total_rounds: 6,
        user_id: user!.id,
      })
      .select()
      .maybeSingle();

    if (champError || !newChamp) throw champError || new Error("Failed to create Libertadores");

    const libId = newChamp.id;
    setLibertadoresId(libId);

    // Create standings
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

    await supabase.from("standings").insert(standingsData);

    // Generate group stage fixtures (6 rounds per group)
    const allFixtures: any[] = [];
    for (let g = 0; g < 8; g++) {
      const groupTeams = shuffledAll.slice(g * 4, g * 4 + 4);
      if (groupTeams.length < 4) continue;
      const [A, B, C, D] = groupTeams;

      // Round-robin home & away for 4 teams = 6 rounds
      const schedule = [
        { round: 1, matches: [[A, B], [C, D]] },
        { round: 2, matches: [[D, A], [B, C]] },
        { round: 3, matches: [[A, C], [D, B]] },
        { round: 4, matches: [[B, A], [D, C]] },
        { round: 5, matches: [[C, A], [B, D]] },
        { round: 6, matches: [[D, A], [C, B]] },
      ];

      for (const r of schedule) {
        for (const [home, away] of r.matches) {
          allFixtures.push({
            championship_id: libId,
            round: r.round,
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
      }
    }

    // Insert in batches if needed
    if (allFixtures.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < allFixtures.length; i += batchSize) {
        const batch = allFixtures.slice(i, i + batchSize);
        await supabase.from("matches").insert(batch);
      }
    }

    await loadGroups(libId);
    await loadNextGroupMatch(libId);
  };

  const loadNextGroupMatch = async (libId: string) => {
    const { data: nextMatch } = await supabase
      .from("matches")
      .select("*")
      .eq("championship_id", libId)
      .eq("is_played", false)
      .or(`home_team_name.eq.${userTeamName},away_team_name.eq.${userTeamName}`)
      .order("round", { ascending: true })
      .limit(1);

    if (nextMatch && nextMatch.length > 0) {
      setNextLibertadoresMatch(nextMatch[0]);
      setNextLibertadoresChampionshipId(libId);
    }
  };

  const loadGroups = async (libId: string) => {
    const { data: standings, error } = await supabase
      .from("standings")
      .select("*")
      .eq("championship_id", libId)
      .order("points", { ascending: false })
      .order("goal_difference", { ascending: false });

    if (error || !standings) return;

    const groupMap = new Map<string, LibertadoresGroup["teams"]>();
    const groupLabels = ["Grupo A", "Grupo B", "Grupo C", "Grupo D", "Grupo E", "Grupo F", "Grupo G", "Grupo H"];
    groupLabels.forEach(g => groupMap.set(g, []));

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

    const groupsArray: LibertadoresGroup[] = groupLabels
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
    preLibertadoresId,
    preLibertadoresResults,
    nextLibertadoresMatch,
    nextLibertadoresChampionshipId,
    userQualified,
  };
};
