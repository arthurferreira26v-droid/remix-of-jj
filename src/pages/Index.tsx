import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TeamCard } from "@/components/TeamCard";
import { teams, leagues } from "@/data/teams";
import { LeagueSelector, type League } from "@/components/LeagueSelector";
import { ChevronDown } from "lucide-react";

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

const InglesIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="24" cy="24" r="22" fill="white" />
    <path
      d="M24 8C20 8 14 12 14 20C14 28 22 34 24 38C26 34 34 28 34 20C34 12 28 8 24 8Z"
      fill="#0a0a0b"
    />
    <circle cx="20" cy="21" r="2" fill="white" />
    <circle cx="28" cy="21" r="2" fill="white" />
    <path d="M20 28C21 29 23 30 24 30C25 30 27 29 28 28" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M16 16C19 14 21 14 24 17C27 14 29 14 32 16"
      stroke="#0a0a0b"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const EspanholIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="3" y="7" width="42" height="34" rx="8" fill="white" />
    <text
      x="24"
      y="23"
      textAnchor="middle"
      fill="#dc2626"
      fontSize="11"
      fontWeight="900"
      fontFamily="Arial, Helvetica, sans-serif"
    >
      LA
    </text>
    <text
      x="24"
      y="36"
      textAnchor="middle"
      fill="#dc2626"
      fontSize="11"
      fontWeight="900"
      fontFamily="Arial, Helvetica, sans-serif"
    >
      LIGA
    </text>
  </svg>
);

const BrazilFlagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <rect width="24" height="24" rx="4" fill="#009c3b" />
    <path d="M12 3L22 12L12 21L2 12L12 3Z" fill="#ffdf00" />
    <circle cx="12" cy="12" r="5" fill="#002776" />
    <path d="M8 12C10 11 14 11 16 12C14 13 10 13 8 12Z" fill="white" />
  </svg>
);

const leagueIcons: Record<string, React.ReactNode> = {
  brasileiro: <BrasileiroIcon />,
  ingles: <InglesIcon />,
  espanhol: <EspanholIcon />,
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
