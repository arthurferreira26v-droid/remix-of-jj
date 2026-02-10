import { Loader2 } from "lucide-react";

interface GroupTeam {
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
}

interface Group {
  name: string;
  teams: GroupTeam[];
}

const GROUPS: Group[] = Array.from({ length: 8 }, (_, i) => ({
  name: `Grupo ${String.fromCharCode(65 + i)}`,
  teams: [],
}));

export const LibertadoresGroups = () => {
  return (
    <div className="space-y-6">
      {GROUPS.map((group) => (
        <div
          key={group.name}
          className="bg-black rounded-xl border border-border overflow-hidden"
        >
          {/* Group Header */}
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-base font-bold text-white">{group.name}</h2>
          </div>

          {/* Table Header */}
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

              {group.teams.length === 0 ? (
                <div className="px-4 py-6 text-center text-white/40 text-sm">
                  Sem times definidos
                </div>
              ) : (
                group.teams.map((team) => (
                  <div
                    key={team.team_name}
                    className="grid grid-cols-[32px_1fr_40px_32px_32px_32px_32px_40px] items-center px-4 py-3 border-b border-border hover:bg-white/5 transition-colors"
                  >
                    <span className="text-white/70 font-medium text-sm">
                      {team.position}
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={team.logo}
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
                ))
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
