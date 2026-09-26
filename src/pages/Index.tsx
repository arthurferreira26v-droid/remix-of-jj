import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TeamCard } from "@/components/TeamCard";
import { teams, leagues } from "@/data/teams";
import { LeagueSelector, type League } from "@/components/LeagueSelector";
import { ChevronDown } from "lucide-react";
import brasileiraoIcon from "@/assets/brasileirao-icon.png.asset.json";
import laligaIcon from "@/assets/laliga-icon.png.asset.json";

const BrasileiroIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path
      d="M24 3L40 13V34L24 45L8 34V13L24 3Z"
      fill="white"
      stroke="white"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <text
      x="24"
      y="31"
      textAnchor="middle"
      fill="#0a0a0b"
      fontSize="14"
      fontWeight="900"
      fontFamily="Arial, Helvetica, sans-serif"
    >
      BR
    </text>
  </svg>
);

const leagueIcons: Record<string, React.ReactNode> = {
  brasileiro: (
    <img
      src={brasileiraoIcon.url}
      alt="Brasileirão"
      className="w-full h-full object-contain"
      draggable={false}
    />
  ),
  ingles: <InglesIcon />,
  espanhol: (
    <img
      src={laligaIcon.url}
      alt="LaLiga"
      className="w-full h-full object-contain"
      draggable={false}
    />
  ),
};

const Index = () => {
  const navigate = useNavigate();
  const [selectedLeague, setSelectedLeague] = useState("brasileiro");

  useEffect(() => { document.title = "Selecionar Time | Gerenciador"; }, []);

  const filteredTeams = teams.filter(t => t.league === selectedLeague && t.playable !== false);

  const handleTeamSelect = (teamName: string) => {
    navigate(`/confirmar-time?time=${encodeURIComponent(teamName)}`);
  };

  const enrichedLeagues: League[] = leagues.map((l) => ({
    ...l,
    icon: leagueIcons[l.id] ?? <span className="text-2xl">{l.flag}</span>,
  }));

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      <div className="flex-1 px-4 pt-6 pb-8">
        {/* Title */}
        <h1 className="text-3xl font-extrabold text-foreground mb-6 italic">
          Escolha seu time
        </h1>

        {/* Leagues */}
        <div className="mb-4">
          <LeagueSelector
            leagues={enrichedLeagues}
            selectedLeague={selectedLeague}
            onSelect={setSelectedLeague}
          />
        </div>

        {/* Competition dropdown (only Brasileirão available) */}
        <div className="mb-6">
          <button
            disabled
            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-[#141414] border border-white/5 text-white/40 cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <BrazilFlagIcon />
              <span className="text-sm font-semibold">Campeonato Brasileiro Série A</span>
            </div>
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

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
