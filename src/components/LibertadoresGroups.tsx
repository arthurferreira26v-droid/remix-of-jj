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

interface Props {
  groups: Group[];
  loading: boolean;
  preLibertadoresResults: PreLibertadoresResult[];
}

export const LibertadoresGroups = ({ groups, loading, preLibertadoresResults }: Props) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pre-Libertadores Results */}
      {preLibertadoresResults.length > 0 && (
        <div className="bg-zinc-900 rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-base font-bold text-white">Pré-Libertadores</h2>
          </div>
          <div className="p-4 space-y-4">
            {preLibertadoresResults.map((result) => (
              <div key={result.team_name} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-bold text-sm">{result.team_name}</span>
                   <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    result.qualified === true
                      ? "bg-green-500/20 text-green-400" 
                      : result.qualified === false
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {result.qualified === true ? "Classificado" : result.qualified === false ? "Eliminado" : "Em andamento"}
                  </span>
                </div>
                {/* Match 1 */}
                <div className="flex items-center gap-3 bg-black/50 rounded-lg px-3 py-2">
                  <span className="text-white text-xs flex-1">{result.team_name}</span>
                  <span className={`text-sm font-bold ${
                    result.result1 === "win" ? "text-green-400" : result.result1 === "loss" ? "text-red-400" : "text-yellow-400"
                  }`}>{result.score1}</span>
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    <span className="text-white/70 text-xs">{result.opponent1}</span>
                    <img src={result.opponent1_logo} alt={result.opponent1} className="w-5 h-5" />
                  </div>
                </div>
                {/* Match 2 */}
                <div className="flex items-center gap-3 bg-black/50 rounded-lg px-3 py-2">
                  <span className="text-white text-xs flex-1">{result.team_name}</span>
                  <span className={`text-sm font-bold ${
                    result.result2 === "win" ? "text-green-400" : result.result2 === "loss" ? "text-red-400" : "text-yellow-400"
                  }`}>{result.score2}</span>
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    <span className="text-white/70 text-xs">{result.opponent2}</span>
                    <img src={result.opponent2_logo} alt={result.opponent2} className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Groups */}
      {groups.length === 0 && !loading ? (
        <div className="text-center text-white/40 py-12">Nenhum grupo definido ainda</div>
      ) : (
        groups.map((group) => (
          <div
            key={group.name}
            className="bg-black rounded-xl border border-border overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-base font-bold text-white">{group.name}</h2>
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

                {group.teams.map((team) => (
                  <div
                    key={team.team_name}
                    className={`grid grid-cols-[32px_1fr_40px_32px_32px_32px_32px_40px] items-center px-4 py-3 border-b border-border hover:bg-white/5 transition-colors ${
                      team.position <= 2 ? "border-l-2 border-l-green-500" : ""
                    }`}
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
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
