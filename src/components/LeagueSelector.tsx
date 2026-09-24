import { cn } from "@/lib/utils";

export interface League {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface LeagueSelectorProps {
  leagues: League[];
  selectedLeague: string;
  onSelect: (leagueId: string) => void;
}

export const LeagueSelector = ({ leagues, selectedLeague, onSelect }: LeagueSelectorProps) => {
  return (
    <div className="grid w-full min-w-0 grid-cols-3 gap-2 min-[402px]:gap-3 pb-1">
      {leagues.map((league) => {
        const isSelected = selectedLeague === league.id;
        const isDisabled = league.id !== "brasileiro";

        return (
          <button
            key={league.id}
            disabled={isDisabled}
            onClick={() => !isDisabled && onSelect(league.id)}
            className={cn(
              "flex min-w-0 w-full max-w-[100px] aspect-square flex-col items-center justify-center gap-2 rounded-2xl border transition-all",
              isSelected
                ? "bg-white/10 border-white/30 text-white"
                : "bg-[#141414] border-white/5 text-white/60",
              isDisabled && "opacity-40 cursor-not-allowed grayscale",
              !isDisabled && "active:scale-[0.97] cursor-pointer hover:bg-white/[0.08]"
            )}
          >
            <div className="flex h-[clamp(40px,12vw,48px)] w-[clamp(40px,12vw,48px)] items-center justify-center">
              {league.icon}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {league.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};
