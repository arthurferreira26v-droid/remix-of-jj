// @ts-nocheck
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
      if (!user) return;

      const { data: championships } = await supabase
        .from("championships")
        .select("id")
        .eq("name", `Brasileirão - ${teamName}`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!championships?.[0]) return;

      const { data } = await supabase
        .from("standings")
        .select("*")
        .eq("championship_id", championships[0].id)
        .order("points", { ascending: false })
        .order("goal_difference", { ascending: false })
        .order("goals_for", { ascending: false });

      setStandings(
        data?.map((team, i) => ({ ...team, position: i + 1 })) || []
      );
      setLoading(false);
    };

    fetchStandings();
  }, [teamName, user]);

  if (loading || authLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00]" />
      </div>
    );
  }

  const indicatorColor = (pos: number) => {
    if (pos <= 4) return "bg-[#00ff87]";
    if (pos <= 6) return "bg-[#00b8ff]";
    if (pos <= 12) return "bg-orange-400";
    if (pos <= 16) return "bg-white/30";
    return "bg-red-500";
  };

  return (
    <div className="bg-black rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-lg font-bold text-white">
          BRASILEIRÃO – SÉRIE A
        </h2>
      </div>

      {/* Scroll horizontal */}
      <div className="overflow-x-auto">
        <div className="min-w-[620px]">
          {/* Header row */}
          <div className="flex items-center px-4 py-2 text-xs text-muted-foreground border-b border-border">
            <div className="w-6" />
            <div className="w-10 text-center">#</div>
            <div className="flex-1">Time</div>
            <div className="w-14 text-center">PTS</div>
            <div className="w-12 text-center">J</div>
            <div className="w-12 text-center">SG</div>
          </div>

          {/* Rows */}
          {standings.map((team) => (
            <div
              key={team.id}
              className="flex items-center px-4 py-3 border-b border-border hover:bg-white/5"
            >
              {/* Indicator */}
              <div className={`w-1 h-10 rounded-full ${indicatorColor(team.position)}`} />

              {/* Position */}
              <div className="w-10 text-center text-base font-bold text-white">
                {team.position}
              </div>

              {/* Team */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img
                  src={getTeamLogo(team.team_name, team.logo)}
                  alt={team.team_name}
                  className="w-8 h-8 object-contain"
                />
                <span className="text-base text-white truncate">
                  {team.team_name}
                </span>
              </div>

              {/* Stats */}
              <div className="w-14 text-center text-lg font-bold text-white">
                {team.points}
              </div>
              <div className="w-12 text-center text-sm text-muted-foreground">
                {team.played}
              </div>
              <div
                className={`w-12 text-center text-sm font-medium ${
                  team.goal_difference > 0
                    ? "text-green-500"
                    : team.goal_difference < 0
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
              >
                {team.goal_difference > 0 ? "+" : ""}
                {team.goal_difference}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};