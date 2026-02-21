import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TeamCard } from "@/components/TeamCard";
import { teams } from "@/data/teams";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => { document.title = "Selecionar Time | Gerenciador"; }, []);

  const filteredTeams = teams;

  const handleTeamSelect = (teamName: string) => {
    toast.success(`Time ${teamName} selecionado!`, {
      description: "Prepare-se para começar sua jornada rumo ao título!",
    });
    navigate(`/jogo?time=${teamName}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-black">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">Gerenciador</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">

        <div className="mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
            Escolha seu Time
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredTeams.map((team) => (
              <TeamCard
                key={team.id}
                name={team.name}
                logo={team.logo}
                rating={team.rating}
                onClick={() => handleTeamSelect(team.name)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2025 Gerenciador de Futebol
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;