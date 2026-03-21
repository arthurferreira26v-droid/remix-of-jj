import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TeamCard } from "@/components/TeamCard";
import { teams } from "@/data/teams";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const Campaign2PSelectPlayer1 = () => {
  const navigate = useNavigate();

  useEffect(() => { document.title = "Jogador 1 — Selecionar Time"; }, []);

  const filteredTeams = teams.filter(t => t.league === "brasileiro");

  const handleTeamSelect = (teamName: string) => {
    toast.success(`Jogador 1 escolheu ${teamName}!`, {
      description: "Agora é a vez do Jogador 2 escolher.",
    });
    navigate(`/campanha-2p/jogador2?p1=${encodeURIComponent(teamName)}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      <div className="flex-1 px-4 pt-6 pb-8">
        <button
          onClick={() => navigate("/")}
          className="mb-4 p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1 block">Jogador 1</span>
          <h1 className="text-3xl font-extrabold text-foreground italic">
            Escolha seu time
          </h1>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
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
  );
};

export default Campaign2PSelectPlayer1;
