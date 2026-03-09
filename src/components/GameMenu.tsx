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
        className="w-[50vw] max-w-[50vw] border-l border-white/10 flex flex-col p-0"
        style={{ background: '#000000' }}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{teamName}</SheetTitle>
        </SheetHeader>

        {/* Menu items */}
        <nav className="flex-1 flex flex-col pt-16 px-2">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="group flex items-center gap-4 px-5 py-4 rounded-xl text-[15px] font-medium text-white hover:bg-white/[0.08] transition-all duration-200 active:scale-[0.98]"
            >
              <item.icon className={`w-[18px] h-[18px] ${item.iconColor} transition-colors`} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Exit */}
        <div className="px-2 pb-8">
          <button
            onClick={onExit}
            className="group flex items-center gap-4 px-5 py-4 rounded-xl text-[15px] font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200 active:scale-[0.98] w-full"
          >
            <LogOut className="w-[18px] h-[18px] text-red-400/50 group-hover:text-red-400/80 transition-colors" />
            <span>Sair</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
