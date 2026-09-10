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
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
      {leagues.map((league) => {
        const isSelected = selectedLeague === league.id;
        const isDisabled = league.id !== "brasileiro";

        return (
          <button
            key={league.id}
            disabled={isDisabled}
            onClick={() => !isDisabled && onSelect(league.id)}
            className={cn(
              "flex-shrink-0 flex flex-col items-center justify-center gap-2 w-[100px] h-[100px] rounded-2xl border transition-all",
              isSelected
                ? "bg-white/10 border-white/30 text-white"
                : "bg-[#141414] border-white/5 text-white/60",
              isDisabled && "opacity-40 cursor-not-allowed grayscale",
              !isDisabled && "active:scale-[0.97] cursor-pointer hover:bg-white/[0.08]"
            )}
          >
            <div className="w-12 h-12 flex items-center justify-center">
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
