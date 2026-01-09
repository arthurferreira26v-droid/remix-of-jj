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

        // Atualizar posições
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
    if (position <= 4) return "text-[#00ff87]"; // Libertadores
    if (position <= 6) return "text-[#00b8ff]"; // Pré-Libertadores
    if (position <= 12) return "text-orange-400"; // Sul-Americana
    if (position <= 16) return "text-white"; // Meio de tabela
    return "text-red-500"; // Rebaixamento (17-20)
  };

  const getPositionIndicator = (position: number) => {
    if (position <= 4) return <div className="w-1 h-8 bg-[#00ff87] rounded-full" />;
    if (position <= 6) return <div className="w-1 h-8 bg-[#00b8ff] rounded-full" />;
    if (position <= 12) return <div className="w-1 h-8 bg-orange-400 rounded-full" />;
    if (position <= 16) return <div className="w-1 h-8 bg-white/20 rounded-full" />;
    return <div className="w-1 h-8 bg-red-500 rounded-full" />;
  };

  return (
    <div className="bg-black border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-white/5 border-b border-border px-3 sm:px-4 py-2 sm:py-3">
        <h2 className="text-sm sm:text-lg font-bold text-white">BRASILEIRÃO - SÉRIE A</h2>
      </div>

      {/* Table Header */}
      <div className="hidden md:grid grid-cols-[auto_40px_1fr_repeat(8,40px)] gap-1 px-3 py-2 border-b border-border text-xs font-bold text-muted-foreground">
        <div className="w-1"></div>
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

      {/* Mobile Table Header */}
      <div className="md:hidden grid grid-cols-[auto_28px_1fr_36px_28px_36px] gap-1 px-2 py-2 border-b border-border text-[10px] font-bold text-muted-foreground">
        <div className="w-0.5"></div>
        <div className="text-center">#</div>
        <div>TIME</div>
        <div className="text-center">PTS</div>
        <div className="text-center">J</div>
        <div className="text-center">SG</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border">
        {standings.map((team) => (
          <div key={team.id}>
            {/* Desktop View */}
            <div className="hidden md:grid grid-cols-[auto_40px_1fr_repeat(8,40px)] gap-1 px-3 py-2 hover:bg-white/5 transition-colors items-center">
              {/* Position Indicator */}
              <div className="flex items-center">
                {getPositionIndicator(team.position)}
              </div>
              
              {/* Position Number */}
              <div className={`text-center font-bold text-sm ${getPositionColor(team.position)}`}>
                {team.position}
              </div>
              
              {/* Team Name & Logo */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center p-0.5">
                  <img src={getTeamLogo(team.team_name, team.logo)} alt={team.team_name} className="w-full h-full object-contain" />
                </div>
                <span className="font-medium text-white truncate text-sm">{team.team_name}</span>
              </div>
              
              {/* Stats */}
              <div className="text-center font-bold text-white text-sm">{team.points}</div>
              <div className="text-center text-muted-foreground text-sm">{team.played}</div>
              <div className="text-center text-green-500 text-sm">{team.wins}</div>
              <div className="text-center text-muted-foreground text-sm">{team.draws}</div>
              <div className="text-center text-red-500 text-sm">{team.losses}</div>
              <div className="text-center text-muted-foreground text-sm">{team.goals_for}</div>
              <div className="text-center text-muted-foreground text-sm">{team.goals_against}</div>
              <div className={`text-center font-medium text-sm ${
                team.goal_difference > 0 
                  ? 'text-green-500' 
                  : team.goal_difference < 0 
                    ? 'text-red-500' 
                    : 'text-muted-foreground'
              }`}>
                {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
              </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden grid grid-cols-[auto_28px_1fr_36px_28px_36px] gap-1 px-2 py-2 hover:bg-white/5 transition-colors items-center">
              {/* Position Indicator */}
              <div className="flex items-center">
                <div className={`w-0.5 h-6 rounded-full ${
                  team.position <= 4 ? 'bg-[#00ff87]' :
                  team.position <= 6 ? 'bg-[#00b8ff]' :
                  team.position <= 12 ? 'bg-orange-400' :
                  team.position <= 16 ? 'bg-white/20' : 'bg-red-500'
                }`} />
              </div>
              
              {/* Position Number */}
              <div className={`text-center font-bold text-xs ${getPositionColor(team.position)}`}>
                {team.position}
              </div>
              
              {/* Team Name & Logo */}
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 bg-white/10 rounded flex-shrink-0 flex items-center justify-center p-0.5">
                  <img src={getTeamLogo(team.team_name, team.logo)} alt={team.team_name} className="w-full h-full object-contain" />
                </div>
                <span className="font-medium text-white truncate text-xs">{team.team_name}</span>
              </div>
              
              {/* Stats */}
              <div className="text-center font-bold text-white text-xs">{team.points}</div>
              <div className="text-center text-muted-foreground text-xs">{team.played}</div>
              <div className={`text-center font-medium text-xs ${
                team.goal_difference > 0 
                  ? 'text-green-500' 
                  : team.goal_difference < 0 
                    ? 'text-red-500' 
                    : 'text-muted-foreground'
              }`}>
                {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-white/5 border-t border-border px-2 sm:px-4 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#00ff87] rounded-full" />
            <span className="text-muted-foreground">Libertadores</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#00b8ff] rounded-full" />
            <span className="text-muted-foreground">Pré-Liberta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-400 rounded-full" />
            <span className="text-muted-foreground">Sul-Americana</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white/20 rounded-full" />
            <span className="text-muted-foreground">Meio tabela</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full" />
            <span className="text-muted-foreground">Rebaixamento</span>
          </div>
        </div>
      </div>
    </div>
  );
};
