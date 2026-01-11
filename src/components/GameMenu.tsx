import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Users, TrendingUp, Briefcase, Calendar, Trophy, LogOut, Save, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GameMenuProps {
  teamName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onManageSquad?: () => void;
  onTransferMarket?: () => void;
  onFinances?: () => void;
  onSaveGame?: () => void;
  onLoadGame?: () => void;
}

export const GameMenu = ({ 
  teamName, 
  open,
  onOpenChange,
  onManageSquad, 
  onTransferMarket, 
  onFinances,
  onSaveGame,
  onLoadGame
}: GameMenuProps) => {
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-64 sm:w-80 p-4">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">{teamName}</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-1">
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

          {/* Save/Load Section */}
          <div className="pt-3 mt-3 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 h-11 text-sm"
              onClick={onSaveGame}
            >
              <Save className="h-4 w-4" />
              <span>Salvar Jogo</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-2 h-11 text-sm"
              onClick={onLoadGame}
            >
              <Download className="h-4 w-4" />
              <span>Carregar Jogo</span>
            </Button>
          </div>

          <div className="pt-3 mt-3 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 h-11 text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10"
              onClick={() => navigate("/")}
            >
              <LogOut className="h-4 w-4" />
              <span className="font-semibold">Sair</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
