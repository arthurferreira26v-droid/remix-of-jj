import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TeamCard } from "@/components/TeamCard";
import { teams, leagues } from "@/data/teams";
import { LeagueSelector, type League } from "@/components/LeagueSelector";
import { ChevronDown } from "lucide-react";

const BrasileiroIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path
      d="M24 2L42 12V36L24 46L6 36V12L24 2Z"
      fill="white"
      stroke="white"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M24 8L36 15V31L24 38L12 31V15L24 8Z"
      fill="#0a0a0b"
    />
    <circle cx="24" cy="23" r="6" fill="white" />
    <path d="M18 28C18 28 21 32 24 32C27 32 30 28 30 28" stroke="white" strokeWidth="2" fill="none" />
  </svg>
);

const InglesIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="24" cy="24" r="22" fill="white" />
    <path
      d="M32 14C30 12 26 11 24 14C22 11 18 12 16 14C12 18 12 24 16 28C18 31 22 34 24 36C26 34 30 31 32 28C36 24 36 18 32 14Z"
      fill="#0a0a0b"
    />
    <circle cx="20" cy="21" r="2" fill="white" />
    <circle cx="28" cy="21" r="2" fill="white" />
    <path d="M22 27C23 28 25 28 26 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const EspanholIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="4" y="10" width="40" height="28" rx="6" fill="white" />
    <text
      x="24"
      y="30"
      textAnchor="middle"
      fill="#ef4444"
      fontSize="11"
      fontWeight="900"
      fontFamily="Arial, sans-serif"
      letterSpacing="0.5"
    >
      LALIGA
    </text>
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
