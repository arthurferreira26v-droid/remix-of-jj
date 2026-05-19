import { ArrowLeftRight, ChevronsRight, ChevronsLeft } from "lucide-react";
import { getLocalMatches } from "@/utils/localChampionship";
import { getTeamLogo } from "@/utils/teamLogos";
import { isMarketOpen } from "@/utils/marketWindow";
import { useEffect, useRef } from "react";

interface RoundsCalendarProps {
  teamName: string;
  currentRound: number;
}

export const RoundsCalendar = ({ teamName, currentRound }: RoundsCalendarProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLDivElement>(null);

  const matches = getLocalMatches(teamName)
    .filter((m) => m.home_team_name === teamName || m.away_team_name === teamName)
    .sort((a, b) => a.round - b.round);

  const marketOpen = isMarketOpen(currentRound);

  // Auto-scroll to keep the current round in view
  useEffect(() => {
    if (currentRef.current && scrollRef.current) {
      const el = currentRef.current;
      const parent = scrollRef.current;
      const offset = el.offsetLeft - 16;
      parent.scrollTo({ left: offset, behavior: "smooth" });
    }
  }, [currentRound, matches.length]);

  if (matches.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="w-full overflow-x-auto overflow-y-hidden no-scrollbar"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="flex gap-3 px-4 py-2 w-max">
        {/* Mercado card */}
        <div
          className={`shrink-0 w-[104px] h-[104px] rounded-2xl flex flex-col items-start justify-between p-3 ${
            marketOpen ? "bg-white text-black" : "bg-zinc-900 text-zinc-500 border border-zinc-800"
          }`}
        >
          <ArrowLeftRight className="w-6 h-6" strokeWidth={2.5} />
          <div className="text-left leading-tight">
            <div className="text-[11px] font-extrabold tracking-wide uppercase">Mercado</div>
            <div className="text-[9px] font-semibold uppercase opacity-70">
              {marketOpen ? "Aberto" : "Fechado"}
            </div>
          </div>
        </div>

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
              className={`relative shrink-0 w-[104px] h-[104px] rounded-2xl flex flex-col justify-between p-3 overflow-hidden bg-[#0a0f24] border transition-all ${
                isCurrent
                  ? "border-[#c8ff00] shadow-[0_0_18px_rgba(200,255,0,0.25)]"
                  : "border-zinc-800/80"
              } ${past ? "opacity-40" : ""}`}
            >
              {isCurrent && (
                <>
                  <ChevronsRight
                    className="absolute -left-1 top-1/2 -translate-y-1/2 w-5 h-5 text-[#c8ff00]"
                    strokeWidth={3}
                  />
                  <ChevronsLeft
                    className="absolute -right-1 top-1/2 -translate-y-1/2 w-5 h-5 text-[#c8ff00]"
                    strokeWidth={3}
                  />
                </>
              )}

              <div className="flex justify-end">
                <img
                  src={getTeamLogo(opp, oppLogo)}
                  alt={opp}
                  className="w-9 h-9 object-contain"
                />
              </div>

              <div className="text-left leading-tight">
                <div className="text-[12px] font-extrabold text-white tracking-wide">
                  {isHome ? "CASA" : "FORA"}
                </div>
                <div className="text-[8.5px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Brasileirão
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
