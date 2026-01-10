// @ts-nocheck
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { getTeamLogo } from "@/utils/teamLogos";
import { useAuth } from "@/hooks/useAuth";

export const StandingsTable = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const teamName = searchParams.get("time") || "Botafogo";
  const [standings, setStandings] = useState([]);
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
        .order("goal_difference", { ascending: false });

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

  const zoneColor = (pos: number) => {
    if (pos <= 4) return "bg-green-500";
    if (pos <= 6) return "bg-blue-500";
    if (pos <= 12) return "bg-orange-400";
    if (pos <= 16) return "bg-white/30";
    return "bg-red-500";
  };

  return (
    <div className="bg-black rounded-xl border border-border">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-lg font-bold text-white">
          BRASILEIRÃO – SÉRIE A
        </h2>
      </div>

      {/* SCROLL HORIZONTAL (APENAS STATS) */}
      <div className="overflow-x-auto">
        <div className="min-w-[1050px]">

          {/* Header */}
          <div className="flex px-3 py-2 text-[11px] text-muted-foreground border-b border-border">
            <div className="w-5" />
            <div className="w-10">#</div>
            <div className="w-56">Time</div>
            <div className="w-12 text-center font-semibold text-white">PTS</div>
            <div className="w-10 text-center">J</div>
            <div className="w-10 text-center">V</div>
            <div className="w-10 text-center">E</div>
            <div className="w-10 text-center">D</div>
            <div className="w-12 text-center">SG</div>
          </div>

          {/* Rows */}
          {standings.map((team) => (
            <div
              key={team.id}
              className="flex items-center px-3 py-2 border-b border-border hover:bg-white/5"
            >
              <div
                className={`w-1 h-8 mr-2 rounded-full ${zoneColor(
                  team.position
                )}`}
              />

              <div className="w-10 text-sm font-bold text-white">
                {team.position}
              </div>

              <div className="w-56 flex items-center gap-2">
                <img
                  src={getTeamLogo(team.team_name, team.logo)}
                  className="w-7 h-7"
                />
                <span className="text-sm font-medium text-white truncate">
                  {team.team_name}
                </span>
              </div>

              <div className="w-12 text-center font-bold text-white">
                {team.points}
              </div>
              <div className="w-10 text-center text-sm">{team.played}</div>
              <div className="w-10 text-center text-sm">{team.wins}</div>
              <div className="w-10 text-center text-sm">{team.draws}</div>
              <div className="w-10 text-center text-sm">{team.losses}</div>
              <div
                className={`w-12 text-center text-sm font-semibold ${
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