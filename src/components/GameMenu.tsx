import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Users, TrendingUp, Briefcase, Calendar, Trophy, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GameMenuProps {
  teamName: string;
  onManageSquad?: () => void;
  onTransferMarket?: () => void;
  onFinances?: () => void;
  onExit?: () => void;
}

const menuItems = (
  teamName: string,
  navigate: ReturnType<typeof useNavigate>,
  handlers: Pick<GameMenuProps, "onManageSquad" | "onTransferMarket" | "onFinances">
) => [
  { icon: Trophy, label: "Classificação", iconColor: "text-yellow-400", onClick: () => navigate(`/classificacao?time=${teamName}`) },
  { icon: Users, label: "Elenco", iconColor: "text-blue-400", onClick: handlers.onManageSquad },
  { icon: TrendingUp, label: "Transferências", iconColor: "text-emerald-400", onClick: handlers.onTransferMarket },
  { icon: Calendar, label: "Calendário", iconColor: "text-white", onClick: () => navigate(`/calendario?time=${teamName}`) },
  { icon: Briefcase, label: "Finanças", iconColor: "text-white", onClick: handlers.onFinances },
];

export const GameMenu = ({
  teamName,
  onManageSquad,
  onTransferMarket,
  onFinances,
  onExit,
}: GameMenuProps) => {
  const navigate = useNavigate();
  const items = menuItems(teamName, navigate, { onManageSquad, onTransferMarket, onFinances });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-foreground">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[75vw] max-w-[75vw] border-l border-white/[0.06] flex flex-col p-0"
        style={{ background: '#000000' }}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{teamName}</SheetTitle>
        </SheetHeader>

        {/* Menu items */}
        <nav className="flex-1 flex flex-col pt-14 px-3">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="group flex items-center gap-4 px-5 py-[18px] rounded-xl text-[15px] font-medium text-white/90 hover:text-white hover:bg-[#1a1a1a] active:bg-[#1a1a1a] transition-all duration-150 active:scale-[0.97]"
            >
              <item.icon className={`w-5 h-5 ${item.iconColor} transition-colors`} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Separator + Exit */}
        <div className="px-5">
          <div className="h-px w-full" style={{ background: '#2a2a2a' }} />
        </div>
        <div className="px-3 pb-8 pt-2">
          <button
            onClick={onExit}
            className="group flex items-center gap-4 px-5 py-[18px] rounded-xl text-[15px] font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.08] active:bg-red-500/[0.08] transition-all duration-150 active:scale-[0.97] w-full"
          >
            <LogOut className="w-5 h-5 text-red-400/50 group-hover:text-red-400/80 transition-colors" />
            <span>Sair</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
