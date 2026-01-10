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
  const [standings, setStandings] = useState<any[]>([]);
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

      if (!championships || !championships[0]) {
        setStandings([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("standings")
        .select("*")
        .eq("championship_id", championships[0].id)
        .order("points", { ascending: false })
        .order("goal_difference", { ascending: false });

      setStandings(
        Array.isArray(data)
          ? data.map((team, i) => ({ ...team, position: i + 1 }))
          : []
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

  return (
    <div className="bg-black rounded-xl border border-border">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-lg font-bold text-white">
          BRASILEIRÃO – SÉRIE A
        </h2>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">

          {/* HEADER */}
          <div className="grid grid-cols-[40px_1fr_60px_50px_50px_50px_60px] px-4 py-2 text-xs text-muted-foreground border-b border-border">
            <span>#</span>
            <span>Time</span>
            <span className="text-center">PTS</span>
            <span className="text-center">J</span>
            <span className="text-center">V</span>
            <span className="text-center">E</span>
            <span className="text-center">SG</span>
          </div>

          {/* ROWS */}
          {Array.isArray(standings) &&
            standings.map((team) => (
              <div
                key={team.id}
                className="grid grid-cols-[40px_1fr_60px_50px_50px_50px_60px] items-center px-4 py-3 border-b border-border hover:bg-white/5"
              >
                <span className="text-white/70 font-medium">
                  {team.position}
                </span>

                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={getTeamLogo(team.team_name, team.logo)}
                    className="w-8 h-8 flex-shrink-0"
                  />
                  <span className="truncate text-white font-medium">
                    {team.team_name}
                  </span>
                </div>

                <span className="text-center font-bold text-white">
                  {team.points}
                </span>

                <span className="text-center text-white/80">
                  {team.played}
                </span>

                <span className="text-center text-white/80">
                  {team.wins}
                </span>

                <span className="text-center text-white/80">
                  {team.draws}
                </span>

                <span
                  className={`text-center font-semibold ${
                    team.goal_difference > 0
                      ? "text-green-500"
                      : team.goal_difference < 0
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {team.goal_difference > 0 ? "+" : ""}
                  {team.goal_difference}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};