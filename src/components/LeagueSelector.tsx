import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
    <div aria-label="Campeonatos" className="flex w-full min-w-0 gap-2 min-[402px]:gap-3 overflow-x-auto overscroll-x-contain scrollbar-hide pb-1 snap-x snap-proximity">
      {leagues.map((league) => {
        const isSelected = selectedLeague === league.id;
        const isDisabled = false;

        return (
          <Button
            variant="ghost"
            key={league.id}
            aria-pressed={isSelected}
            disabled={isDisabled}
            onClick={() => !isDisabled && onSelect(league.id)}
            className={cn(
              "flex h-auto w-[calc((100%-1rem)/3)] min-[402px]:w-[100px] max-w-[100px] shrink-0 snap-start aspect-square flex-col items-center justify-center gap-2 p-0 rounded-2xl border transition-all",
              isSelected
                ? "bg-foreground/10 border-foreground/30 text-foreground"
                : "bg-card border-foreground/5 text-foreground/60",
              isDisabled && "opacity-40 cursor-not-allowed grayscale",
              !isDisabled && "active:scale-[0.97] cursor-pointer hover:bg-foreground/[0.08] hover:text-foreground"
            )}
          >
            <div className="flex h-[clamp(40px,12vw,48px)] w-[clamp(40px,12vw,48px)] items-center justify-center">
              {league.icon}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-normal">
              {league.name}
            </span>
          </Button>
        );
      })}
    </div>
  );
};
