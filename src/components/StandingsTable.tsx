import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getLocalStandings, type LocalStanding } from "@/utils/localChampionship";
import { getTeamLogo } from "@/utils/teamLogos";
import { Loader2 } from "lucide-react";

export const StandingsTable = () => {
  const [searchParams] = useSearchParams();
  const teamName = searchParams.get("time") || "Botafogo";

  const [standings, setStandings] = useState<(LocalStanding & { position: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = getLocalStandings(teamName);
    const sorted = [...data].sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference || b.goals_for - a.goals_for);
    setStandings(sorted.map((t, i) => ({ ...t, position: i + 1 })));
    setLoading(false);
  }, [teamName]);

  if (loading) {
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
        <div className="min-w-[500px]">
          <div className="grid grid-cols-[32px_1fr_40px_32px_32px_32px_32px_40px] px-4 py-2 text-xs text-muted-foreground border-b border-border">
            <span></span>
            <span>Clube</span>
            <span className="text-center">Pts</span>
            <span className="text-center">PJ</span>
            <span className="text-center">VIT</span>
            <span className="text-center">E</span>
            <span className="text-center">DER</span>
            <span className="text-center">SG</span>
          </div>

          {standings.map((team) => (
            <div
              key={team.id}
              className="grid grid-cols-[32px_1fr_40px_32px_32px_32px_32px_40px] items-center px-4 py-3 border-b border-border hover:bg-white/5 transition-colors"
            >
              <span className="text-white/70 font-medium text-sm">
                {team.position}
              </span>

              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={getTeamLogo(team.team_name, team.logo)}
                  className="w-6 h-6 flex-shrink-0"
                  alt={team.team_name}
                />
                <span className="truncate text-white font-medium text-sm">
                  {team.team_name}
                </span>
              </div>

              <span className="text-center font-bold text-white text-sm">
                {team.points}
              </span>

              <span className="text-center text-white/80 text-sm">
                {team.played}
              </span>

              <span className="text-center text-white/80 text-sm">
                {team.wins}
              </span>

              <span className="text-center text-white/80 text-sm">
                {team.draws}
              </span>

              <span className="text-center text-white/80 text-sm">
                {team.losses}
              </span>

              <span
                className={`text-center text-sm font-medium ${
                  team.goal_difference > 0
                    ? "text-green-500"
                    : team.goal_difference < 0
                    ? "text-red-500"
                    : "text-white/80"
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
