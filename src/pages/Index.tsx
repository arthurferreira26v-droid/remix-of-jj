import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TeamCard } from "@/components/TeamCard";
import { LeagueSelector } from "@/components/LeagueSelector";
import { teams, leagues } from "@/data/teams";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, LogOut } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [selectedLeague, setSelectedLeague] = useState("brasileiro");
  const navigate = useNavigate();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const filteredTeams = teams.filter((team) => team.league === selectedLeague);

  const handleTeamSelect = (teamName: string) => {
    toast.success(`Time ${teamName} selecionado!`, {
      description: "Prepare-se para começar sua jornada rumo ao título!",
    });
    navigate(`/jogo?time=${teamName}`);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Você saiu da sua conta");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with logout */}
      <header className="border-b border-border bg-black">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">⚽ Gerenciador</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Selecione a Liga
          </h2>
        </div>

        <LeagueSelector
          leagues={leagues}
          selectedLeague={selectedLeague}
          onSelect={setSelectedLeague}
        />

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