import { TeamStanding } from "@/data/standings";

interface Props {
  standings: TeamStanding[];
}

export default function StandingsTable({ standings }: Props) {
  return (
    <div className="w-full">
      {/* HEADER */}
      <div className="flex items-center px-2 py-2 text-[11px] text-white/60 border-b border-white/10">
        <span className="w-6 text-center">#</span>
        <span className="w-[140px]">Time</span>
        <span className="w-10 text-center">PTS</span>
        <span className="w-8 text-center">J</span>

        <div className="flex gap-3 pl-2 overflow-x-auto">
          <HeaderStat label="V" />
          <HeaderStat label="E" />
          <HeaderStat label="D" />
          <HeaderStat label="SG" />
        </div>
      </div>

      {/* TIMES */}
      {standings.slice(0, 13).map((team) => (
        <div
          key={team.teamId}
          className="flex items-center border-b border-white/10 py-3"
        >
          {/* FAIXA LATERAL */}
          <div
            className={`w-1 h-10 rounded ${
              team.position <= 4
                ? "bg-green-500"
                : team.position <= 6
                ? "bg-blue-500"
                : team.position <= 12
                ? "bg-orange-500"
                : "bg-red-500"
            }`}
          />

          {/* POSIÇÃO */}
          <span className="w-6 text-center text-sm text-white/70">
            {team.position}
          </span>

          {/* TIME */}
          <div className="flex items-center gap-2 w-[140px]">
            <img
              src={team.logo}
              alt={team.teamName}
              className="w-9 h-9"
            />
            <span className="text-sm font-semibold text-white truncate">
              {team.teamName}
            </span>
          </div>

          {/* PONTOS */}
          <div className="w-10 text-center">
            <span className="text-sm font-bold text-white">
              {team.points}
            </span>
          </div>

          {/* JOGOS */}
          <div className="w-8 text-center">
            <span className="text-sm text-white">
              {team.played}
            </span>
          </div>

          {/* STATS SCROLL */}
          <div className="flex gap-3 pl-2 overflow-x-auto">
            <Stat value={team.wins} />
            <Stat value={team.draws} />
            <Stat value={team.losses} />
            <Stat value={team.goalDifference} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* COMPONENTES AUXILIARES */

function HeaderStat({ label }: { label: string }) {
  return (
    <span className="min-w-[28px] text-center">{label}</span>
  );
}

function Stat({ value }: { value: number }) {
  return (
    <div className="min-w-[28px] text-center">
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}
