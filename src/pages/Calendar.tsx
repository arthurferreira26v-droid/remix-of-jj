import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Loader2, AlertTriangle, RotateCcw } from "lucide-react";
import { teams } from "@/data/teams";
import { toast } from "sonner";
import { getLocalMatches, getLocalChampionship, deleteLocalChampionship } from "@/utils/localChampionship";

interface CalendarMatch {
  id: string;
  round: number;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  is_played: boolean;
  isHome: boolean;
  opponentName: string;
  competitionLabel: string;
}

interface SingleMatchCard {
  type: "single";
  sortKey: number;
  match: CalendarMatch;
}

type CalendarCard = SingleMatchCard;

const Calendar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamName = searchParams.get("time") || "Botafogo";

  const [matches, setMatches] = useState<CalendarMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRounds, setTotalRounds] = useState(0);

  useEffect(() => { document.title = "Calendário | Gerenciador"; }, []);

  useEffect(() => {
    const champ = getLocalChampionship(teamName);
    if (!champ) {
      setMatches([]);
      setTotalRounds(0);
      setLoading(false);
      return;
    }

    setTotalRounds(champ.total_rounds);
    const allMatches = getLocalMatches(teamName);

    const teamMatches: CalendarMatch[] = allMatches
      .filter(m => m.home_team_name === teamName || m.away_team_name === teamName)
      .map(m => {
        const isHome = m.home_team_name === teamName;
        return {
          id: m.id,
          round: m.round,
          home_team_name: m.home_team_name,
          away_team_name: m.away_team_name,
          home_score: m.home_score,
          away_score: m.away_score,
          is_played: m.is_played,
          isHome,
          opponentName: isHome ? m.away_team_name : m.home_team_name,
          competitionLabel: "Brasileirão",
        };
      })
      .sort((a, b) => a.round - b.round);

    setMatches(teamMatches);
    setLoading(false);
  }, [teamName]);

  const handleBack = () => {
    navigate(`/jogo?time=${teamName}`);
  };

  const handleResetChampionship = () => {
    deleteLocalChampionship(teamName);
    toast.success("Campeonato reiniciado! Redirecionando...");
    setTimeout(() => {
      navigate(`/jogo?time=${teamName}`);
    }, 1000);
  };

  const needsReset = totalRounds > 0 && totalRounds < 38;

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-border bg-black backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Calendário</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {needsReset && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-yellow-500 font-bold text-sm mb-1">Campeonato Desatualizado</h3>
                <p className="text-yellow-500/80 text-xs mb-3">
                  Seu campeonato foi criado com {totalRounds} rodadas. 
                  Reinicie para jogar com 20 times e 38 rodadas.
                </p>
                <button
                  onClick={handleResetChampionship}
                  className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs py-2 px-4 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reiniciar com 20 times
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && matches.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {matches.filter(m => m.is_played).length} de {matches.length} partidas jogadas
            </span>
            <span className="text-xs text-muted-foreground">
              {totalRounds} rodadas
            </span>
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Carregando partidas...</p>
        ) : matches.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhuma partida encontrada para este campeonato.
          </p>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => {
              const isHome = match.isHome;
              const homeAwayLabel = isHome ? "Em casa" : "Fora";
              let resultLabel = "- x -";
              let resultColor = "text-white";

              if (match.is_played && match.home_score !== null && match.away_score !== null) {
                const userGoals = isHome ? match.home_score : match.away_score;
                const opponentGoals = isHome ? match.away_score : match.home_score;
                resultLabel = `${userGoals} x ${opponentGoals}`;
                resultColor = userGoals > opponentGoals ? "text-green-400" : userGoals < opponentGoals ? "text-red-400" : "text-yellow-400";
              }

              return (
                <div
                  key={match.id}
                  className="flex items-center justify-between rounded-lg bg-card px-4 py-3 border border-border/60"
                >
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Brasileirão • {match.round}ª rodada • {homeAwayLabel}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {teamName} vs {match.opponentName}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-base font-semibold ${resultColor}`}>{resultLabel}</span>
                    <span className="text-[0.7rem] text-muted-foreground">
                      {match.is_played ? "Jogada" : "Próxima"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
