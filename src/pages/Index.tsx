import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TeamCard } from "@/components/TeamCard";
import { teams } from "@/data/teams";


const Index = () => {
  const navigate = useNavigate();

  useEffect(() => { document.title = "Selecionar Time | Gerenciador"; }, []);

  const filteredTeams = teams.filter(t => t.league === "brasileiro");

  const handleTeamSelect = (teamName: string) => {
    navigate(`/confirmar-time?time=${encodeURIComponent(teamName)}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      <div className="flex-1 px-4 pt-6 pb-8">


        {/* Title */}
        <h1 className="text-3xl font-extrabold text-foreground mb-6 italic">
          Escolha seu time
        </h1>

        {/* Team grid */}
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

export default Index;