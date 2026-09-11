import { ArrowLeftRight } from "lucide-react";
import { getLocalMatches } from "@/utils/localChampionship";
import { getTeamLogo } from "@/utils/teamLogos";
import { useEffect, useRef } from "react";

interface RoundsCalendarProps {
  teamName: string;
  currentRound: number;
  onMarketClick?: () => void;
}

export const RoundsCalendar = ({ teamName, currentRound, onMarketClick }: RoundsCalendarProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLDivElement>(null);

  const matches = getLocalMatches(teamName)
    .filter((m) => m.home_team_name === teamName || m.away_team_name === teamName)
    .sort((a, b) => a.round - b.round);

  useEffect(() => {
    if (currentRef.current && scrollRef.current) {
      const parent = scrollRef.current;
      parent.scrollTo({ left: Math.max(0, currentRef.current.offsetLeft - 16), behavior: "smooth" });
    }
  }, [currentRound, matches.length]);

  if (matches.length === 0) return null;

  return (
    <div className="flex items-center gap-2.5 w-full px-4 py-1">
      {/* Mercado fixo à esquerda */}
      <button
        onClick={onMarketClick}
        className="shrink-0 w-[86px] h-[86px] rounded-xl flex flex-col items-start justify-between p-2.5 bg-[#111113] border border-zinc-800 active:scale-95 transition-transform"
      >
        <ArrowLeftRight className="w-5 h-5 text-white" strokeWidth={2.5} />
        <span className="text-[10px] font-extrabold tracking-wide uppercase text-white text-left leading-tight">
          Mercado
        </span>
      </button>

      {/* Scroll apenas dos jogos */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden no-scrollbar"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex gap-2.5 w-max">
          {matches.map((m) => {
            const isHome = m.home_team_name === teamName;
            const opp = isHome ? m.away_team_name : m.home_team_name;
            const oppLogo = isHome ? m.away_team_logo : m.home_team_logo;
            const isCurrent = m.round === currentRound;
            const past = m.is_played;

            return (
              <div
                key={m.id}
                ref={isCurrent ? currentRef : undefined}
                className={`shrink-0 w-[86px] h-[86px] rounded-xl flex flex-col justify-between p-2.5 border transition-all ${
                  isCurrent
                    ? "bg-white border-white"
                    : "bg-[#111113] border-zinc-800"
                } ${past ? "opacity-40" : ""}`}
              >
                <div className="flex justify-center">
                  <img src={getTeamLogo(opp, oppLogo)} alt={opp} className="w-8 h-8 object-contain" />
                </div>

                <div className="text-left leading-tight">
                  <div className={`text-[10px] font-extrabold tracking-wide ${isCurrent ? "text-black" : "text-white"}`}>
                    {isHome ? "CASA" : "FORA"}
                  </div>
                  <div className={`text-[8px] font-bold uppercase tracking-wider ${isCurrent ? "text-black/60" : "text-zinc-400"}`}>
                    Brasileirão
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
