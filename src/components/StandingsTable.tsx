// @ts-nocheck - Database types will be updated after migration
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { getTeamLogo } from "@/utils/teamLogos";
import { useAuth } from "@/hooks/useAuth";

interface Standing {
  id: string;
  team_name: string;
  logo: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  position: number;
}

export const StandingsTable = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const teamName = searchParams.get("time") || "Botafogo";
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        if (!user) return;

        const { data: championships, error: champError } = await supabase
          .from("championships")
          .select("id")
          .eq("name", `Brasileirão - ${teamName}`)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (champError) throw champError;

        const championship = championships?.[0];
        if (!championship) return;

        const { data, error } = await supabase
          .from("standings")
          .select("*")
          .eq("championship_id", championship.id)
          .order("points", { ascending: false })
          .order("goal_difference", { ascending: false })
          .order("goals_for", { ascending: false });

        if (error) throw error;

        const standingsWithPositions =
          data?.map((team, index) => ({
            ...team,
            position: index + 1,
          })) || [];

        setStandings(standingsWithPositions);
      } catch (error) {
        console.error("Erro ao buscar classificação:", error);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchStandings();
  }, [teamName, user]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00]" />
      </div>
    );
  }

  const getPositionColor = (position: number) => {
    if (position <= 4) return "text-[#00ff87]";
    if (position <= 6) return "text-[#00b8ff]";
    if (position <= 12) return "text-orange-400";
    if (position <= 16) return "text-white";
    return "text-red-500";
  };

  return (
    <div className="bg-black border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-white/5 border-b border-border px-4 py-3">
        <h2 className="text-lg font-bold text-white">
          BRASILEIRÃO - SÉRIE A
        </h2>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:grid grid-cols-[auto_40px_1fr_repeat(8,48px)] px-4 py-2 border-b border-border text-xs font-bold text-muted-foreground">
        <div />
        <div className="text-center">#</div>
        <div>TIME</div>
        <div className="text-center">PTS</div>
        <div className="text-center">J</div>
        <div className="text-center">V</div>
        <div className="text-center">E</div>
        <div className="text-center">D</div>
        <div className="text-center">GP</div>
        <div className="text-center">GC</div>
        <div className="text-center">SG</div>
      </div>

      {/* Body */}
      <div className="divide-y divide-border">
        {standings.map((team) => (
          <div key={team.id}>
            {/* DESKTOP */}
            <div className="hidden md:grid grid-cols-[auto_40px_1fr_repeat(8,48px)] px-4 py-2 items-center hover:bg-white/5 transition-colors">
              <div className={`w-1 h-8 rounded-full ${
                team.position <= 4 ? 'bg-[#00ff87]' :
                team.position <= 6 ? 'bg-[#00b8ff]' :
                team.position <= 12 ? 'bg-orange-400' :
                team.position <= 16 ? 'bg-white/20' : 'bg-red-500'
              }`} />

              <div className={`text-center font-bold ${getPositionColor(team.position)}`}>
                {team.position}
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={getTeamLogo(team.team_name, team.logo)}
                  className="w-8 h-8 object-contain"
                  alt={team.team_name}
                />
                <span className="font-semibold text-white">
                  {team.team_name}
                </span>
              </div>

              <div className="text-center font-bold text-white">{team.points}</div>
              <div className="text-center text-muted-foreground">{team.played}</div>
              <div className="text-center text-green-500">{team.wins}</div>
              <div className="text-center text-muted-foreground">{team.draws}</div>
              <div className="text-center text-red-500">{team.losses}</div>
              <div className="text-center text-muted-foreground">{team.goals_for}</div>
              <div className="text-center text-muted-foreground">{team.goals_against}</div>
              <div className={`text-center font-semibold ${
                team.goal_difference > 0
                  ? "text-green-500"
                  : team.goal_difference < 0
                    ? "text-red-500"
                    : "text-muted-foreground"
              }`}>
                {team.goal_difference > 0 ? "+" : ""}
                {team.goal_difference}
              </div>
            </div>

            {/* MOBILE COM SCROLL */}
            <div className="md:hidden overflow-x-auto">
              <div className="min-w-[560px] flex items-center gap-4 px-4 py-3 hover:bg-white/5">
                <div className={`w-1 h-10 rounded-full ${
                  team.position <= 4 ? 'bg-[#00ff87]' :
                  team.position <= 6 ? 'bg-[#00b8ff]' :
                  team.position <= 12 ? 'bg-orange-400' :
                  team.position <= 16 ? 'bg-white/20' : 'bg-red-500'
                }`} />

                <div className={`w-6 text-center font-bold ${getPositionColor(team.position)}`}>
                  {team.position}
                </div>

                <div className="flex items-center gap-3 min-w-[200px]">
                  <img
                    src={getTeamLogo(team.team_name, team.logo)}
                    className="w-9 h-9 object-contain"
                    alt={team.team_name}
                  />
                  <span className="font-semibold text-white text-sm truncate">
                    {team.team_name}
                  </span>
                </div>

                <div className="w-12 text-center font-bold text-white">
                  {team.points}
                </div>
                <div className="w-10 text-center text-muted-foreground">
                  {team.played}
                </div>
                <div className={`w-12 text-center font-bold ${
                  team.goal_difference > 0
                    ? "text-green-500"
                    : team.goal_difference < 0
                      ? "text-red-500"
                      : "text-muted-foreground"
                }`}>
                  {team.goal_difference > 0 ? "+" : ""}
                  {team.goal_difference}
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};