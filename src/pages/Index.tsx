import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TeamCard } from "@/components/TeamCard";
import { teams, leagues } from "@/data/teams";
import { LeagueSelector, type League } from "@/components/LeagueSelector";
import { ChevronDown } from "lucide-react";

const BrasileiroIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path
      d="M24 4L40 13V34L24 44L8 34V13L24 4Z"
      fill="white"
      stroke="white"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M24 10L34 16V30L24 36L14 30V16L24 10Z"
      fill="#0a0a0b"
    />
    <circle cx="24" cy="23" r="7" fill="white" />
    <path
      d="M18 28C20 30 22 31 24 31C26 31 28 30 30 28"
      stroke="#0a0a0b"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const InglesIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="24" cy="24" r="22" fill="white" />
    <path
      d="M24 10C24 10 18 14 16 19C14 24 16 30 24 36C32 30 34 24 32 19C30 14 24 10 24 10Z"
      fill="#0a0a0b"
    />
    <circle cx="20" cy="22" r="2" fill="white" />
    <circle cx="28" cy="22" r="2" fill="white" />
    <path d="M21 28C22 29 26 29 27 28" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M18 16C20 15 22 15 24 17C26 15 28 15 30 16"
      stroke="#0a0a0b"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const EspanholIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="3" y="8" width="42" height="32" rx="7" fill="white" />
    <text
      x="24"
      y="30"
      textAnchor="middle"
      fill="#dc2626"
      fontSize="13"
      fontWeight="900"
      fontFamily="Arial, Helvetica, sans-serif"
      letterSpacing="0"
    >
      LALIGA
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
              <span className="text-xl">🇧🇷</span>
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
