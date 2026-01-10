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
        (data || [])
          .map((team, i) => ({ ...team, position: i + 1 }))
          .slice(0, 12) // MOSTRA APENAS 12
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
    return "bg-white/30";
  };

  return (
    <div className="bg-black rounded-xl border border-border">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-lg font-bold text-white">
          BRASILEIRÃO – SÉRIE A
        </h2>
      </div>

      {/* HEADER */}
      <div className="flex items-center px-4 py-2 text-xs text-muted-foreground border-b border-border">
        <div className="w-1" />
        <div className="w-8">#</div>
        <div className="w-44">Time</div>
        <div className="w-10 text-center font-bold">PTS</div>
        <div className="w-10 text-center">J</div>

        {/* SCROLL HEADER */}
        <div className="flex gap-6 ml-4 min-w-[260px] overflow-x-auto">
          <span className="w-6 text-center">V</span>
          <span className="w-6 text-center">E</span>
          <span className="w-6 text-center">D</span>
          <span className="w-8 text-center">SG</span>
        </div>
      </div>

      {/* ROWS */}
      {standings.map((team) => (
        <div
          key={team.id}
          className="flex items-center px-4 py-3 border-b border-border"
        >
          <div className={`w-1 h-10 mr-2 rounded-full ${zoneColor(team.position)}`} />

          <div className="w-8 text-sm font-bold text-white">
            {team.position}
          </div>

          <div className="w-44 flex items-center gap-3">
            <img
              src={getTeamLogo(team.team_name, team.logo)}
              className="w-9 h-9"
            />
            <span className="text-sm font-medium text-white truncate">
              {team.team_name}
            </span>
          </div>

          <div className="w-10 text-center font-bold text-white">
            {team.points}
          </div>

          <div className="w-10 text-center text-white">
            {team.played}
          </div>

          {/* SCROLL COLUNAS */}
          <div className="flex gap-6 ml-4 min-w-[260px] overflow-x-auto">
            <span className="w-6 text-center">{team.wins}</span>
            <span className="w-6 text-center">{team.draws}</span>
            <span className="w-6 text-center">{team.losses}</span>
            <span
              className={`w-8 text-center font-semibold ${
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
        </div>
      ))}
    </div>
  );
};