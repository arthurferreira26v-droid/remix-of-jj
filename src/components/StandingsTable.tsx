// @ts-nocheck
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getTeamLogo } from "@/utils/teamLogos";
import { Loader2 } from "lucide-react";

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

      if (!championships?.[0]) {
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
          ? data.map((t, i) => ({ ...t, position: i + 1 }))
          : []
      );

      setLoading(false);
    };

    fetchStandings();
  }, [user, teamName]);

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

      {/* HEADER FIXO */}
      <div className="grid grid-cols-[36px_1fr_56px_40px] px-4 py-2 text-xs text-muted-foreground border-b border-border">
        <span>#</span>
        <span>Time</span>
        <span className="text-center">PTS</span>
        <span className="text-center">J</span>
      </div>

      {/* LISTA */}
      {standings.map((team) => (
        <div
          key={team.id}
          className="border-b border-border"
        >
          {/* LINHA PRINCIPAL */}
          <div className="grid grid-cols-[36px_1fr_56px_40px] items-center px-4 py-3">
            <span className="text-white/70 font-medium">
              {team.position}
            </span>

            <div className="flex items-center gap-3 min-w-0">
              <img
                src={getTeamLogo(team.team_name, team.logo)}
                className="w-7 h-7 flex-shrink-0"
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
          </div>

          {/* SCROLL HORIZONTAL – STATS */}
          <div className="overflow-x-auto">
            <div className="flex gap-6 px-4 pb-3 text-sm text-white/80 min-w-max">
              <div className="flex gap-1">
                <span className="text-muted-foreground">V</span>
                <span>{team.wins}</span>
              </div>
              <div className="flex gap-1">
                <span className="text-muted-foreground">E</span>
                <span>{team.draws}</span>
              </div>
              <div className="flex gap-1">
                <span className="text-muted-foreground">D</span>
                <span>{team.losses}</span>
              </div>
              <div className="flex gap-1">
                <span className="text-muted-foreground">SG</span>
                <span
                  className={
                    team.goal_difference > 0
                      ? "text-green-500"
                      : team.goal_difference < 0
                      ? "text-red-500"
                      : ""
                  }
                >
                  {team.goal_difference > 0 ? "+" : ""}
                  {team.goal_difference}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};