import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TeamCard } from "@/components/TeamCard";
import { teams } from "@/data/teams";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const Campaign2PSelectPlayer2 = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const player1Team = searchParams.get("p1") || "";

  useEffect(() => { document.title = "Jogador 2 — Selecionar Time"; }, []);

  const filteredTeams = teams.filter(t => t.league === "brasileiro");

  const handleTeamSelect = (teamName: string) => {
    if (teamName === player1Team) {
      toast.error("Time já escolhido!", {
        description: "O Jogador 1 já selecionou este time. Escolha outro.",
      });
      return;
    }

    toast.success(`Jogador 2 escolheu ${teamName}!`, {
      description: "A campanha vai começar!",
    });
    navigate(`/jogo?time=${encodeURIComponent(player1Team)}&time2=${encodeURIComponent(teamName)}&modo=2p`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      <div className="flex-1 px-4 pt-6 pb-8">
        <button
          onClick={() => navigate("/campanha-2p/jogador1")}
          className="mb-4 p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1 block">Jogador 2</span>
          <h1 className="text-3xl font-extrabold text-foreground italic">
            Escolha seu time
          </h1>
          {player1Team && (
            <p className="text-sm text-white/30 mt-1">
              Jogador 1 escolheu: <span className="text-white/60 font-medium">{player1Team}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
          {filteredTeams.map((team) => {
            const isDisabled = team.name === player1Team;
            return (
              <div key={team.id} className={isDisabled ? "opacity-30 pointer-events-none" : ""}>
                <TeamCard
                  name={team.name}
                  logo={team.logo}
                  rating={team.rating}
                  onClick={() => handleTeamSelect(team.name)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Campaign2PSelectPlayer2;
