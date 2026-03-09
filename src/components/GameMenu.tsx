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

export const GameMenu = ({ 
  teamName, 
  onManageSquad, 
  onTransferMarket, 
  onFinances,
  onExit,
}: GameMenuProps) => {
  const navigate = useNavigate();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-foreground">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
       <SheetContent side="right" className="w-64 sm:w-80 p-4 flex flex-col">
        <SheetHeader className="sr-only">
          <SheetTitle>{teamName}</SheetTitle>
        </SheetHeader>
        
        <div className="mt-8 space-y-1 flex-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-11 text-sm"
            onClick={() => navigate(`/classificacao?time=${teamName}`)}
          >
            <Trophy className="h-4 w-4" />
            <span>Classificação</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-11 text-sm"
            onClick={onManageSquad}
          >
            <Users className="h-4 w-4" />
            <span>Gerenciar Elenco</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-11 text-sm"
            onClick={onTransferMarket}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Transferências</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-11 text-sm"
            onClick={() => navigate(`/calendario?time=${teamName}`)}
          >
            <Calendar className="h-4 w-4" />
            <span>Calendário</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-11 text-sm"
            onClick={onFinances}
          >
            <Briefcase className="h-4 w-4" />
            <span>Finanças</span>
          </Button>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start gap-2 h-11 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 mb-4"
          onClick={onExit}
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </Button>
      </SheetContent>
    </Sheet>
  );
};
