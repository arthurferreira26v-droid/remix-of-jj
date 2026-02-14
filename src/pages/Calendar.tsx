// @ts-nocheck - Database types will be updated after migration
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Loader2, AlertTriangle, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { teams } from "@/data/teams";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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

interface AggregateConfrontoCard {
  type: "aggregate";
  sortKey: number;
  opponentName: string;
  competitionLabel: string;
  leg1: CalendarMatch | null;
  leg2: CalendarMatch | null;
  aggregateUserGoals: number;
  aggregateOpponentGoals: number;
  isComplete: boolean;
}

interface SingleMatchCard {
  type: "single";
  sortKey: number;
  match: CalendarMatch;
}

type CalendarCard = AggregateConfrontoCard | SingleMatchCard;

const Calendar = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamName = searchParams.get("time") || "Botafogo";

  const [matches, setMatches] = useState<CalendarMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRounds, setTotalRounds] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadMatches = async () => {
      setLoading(true);
      try {
        const userTeam = teams.find((t) => t.name === teamName);
        if (!userTeam || !user) {
          setMatches([]);
          return;
        }

        const championshipNames = [
          userTeam.league === "brasileiro"
            ? `Brasileirão - ${teamName}`
            : `Liga dos Campeões - ${teamName}`,
          `Pré-Libertadores - ${teamName}`,
          `Libertadores - ${teamName}`,
        ];

        const { data: championships } = await supabase
          .from("championships")
          .select("id, name, total_rounds")
          .eq("user_id", user.id)
          .in("name", championshipNames)
          .order("created_at", { ascending: false });

        if (!championships || championships.length === 0) {
          setMatches([]);
          setTotalRounds(0);
          return;
        }

        const brasileirao = championships.find(c => c.name.startsWith("Brasileirão"));
        setTotalRounds(brasileirao?.total_rounds || 0);

        const allChampIds = championships.map(c => c.id);
        const champNameMap = new Map(championships.map(c => [c.id, c.name]));

        const { data: allMatches } = await supabase
          .from("matches")
          .select("id, round, home_team_name, away_team_name, home_score, away_score, is_played, championship_id")
          .in("championship_id", allChampIds)
          .order("round", { ascending: true });

        if (!allMatches) {
          setMatches([]);
          return;
        }

        const teamMatches: CalendarMatch[] = allMatches
          .filter(
            (match) =>
              match.home_team_name === teamName || match.away_team_name === teamName,
          )
          .map((match) => {
            const isHome = match.home_team_name === teamName;
            const opponentName = isHome ? match.away_team_name : match.home_team_name;
            const champName = champNameMap.get(match.championship_id) || "";
            let competitionLabel = "";
            if (champName.startsWith("Pré-Libertadores")) competitionLabel = "Pré-Lib";
            else if (champName.startsWith("Libertadores")) competitionLabel = "Libertadores";
            else competitionLabel = "Brasileirão";

            return {
              id: match.id,
              round: match.round,
              home_team_name: match.home_team_name,
              away_team_name: match.away_team_name,
              home_score: match.home_score,
              away_score: match.away_score,
              is_played: match.is_played,
              isHome,
              opponentName,
              competitionLabel,
            };
          });

        setMatches(teamMatches);
      } catch (error) {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadMatches();
    }
  }, [teamName, user]);

  const handleBack = () => {
    navigate(`/jogo?time=${teamName}`);
  };

  const handleResetChampionship = async () => {
    if (!user) return;
    const userTeam = teams.find((t) => t.name === teamName);
    if (!userTeam) return;
    const championshipName =
      userTeam.league === "brasileiro"
        ? `Brasileirão - ${teamName}`
        : `Liga dos Campeões - ${teamName}`;
    try {
      const { data: championships } = await supabase
        .from("championships")
        .select("id")
        .eq("name", championshipName)
        .eq("user_id", user.id);
      if (championships && championships.length > 0) {
        for (const champ of championships) {
          await supabase.from("matches").delete().eq("championship_id", champ.id);
          await supabase.from("standings").delete().eq("championship_id", champ.id);
          await supabase.from("team_budgets").delete().eq("championship_id", champ.id);
          await supabase.from("championships").delete().eq("id", champ.id);
        }
      }
      toast.success("Campeonato reiniciado! Redirecionando...");
      setTimeout(() => {
        navigate(`/jogo?time=${teamName}`);
      }, 1000);
    } catch (error) {
      toast.error("Erro ao reiniciar campeonato");
    }
  };

  // Build calendar cards: group Pré-Lib into aggregate confrontos
  const buildCalendarCards = (): CalendarCard[] => {
    const preLibMatches = matches.filter(m => m.competitionLabel === "Pré-Lib");
    const otherMatches = matches.filter(m => m.competitionLabel !== "Pré-Lib");

    // Group Pré-Lib by opponent
    const confrontoMap = new Map<string, CalendarMatch[]>();
    for (const m of preLibMatches) {
      const existing = confrontoMap.get(m.opponentName) || [];
      existing.push(m);
      confrontoMap.set(m.opponentName, existing);
    }

    const LIB_ROUND_AFTER_BR = [3, 6, 10, 14, 18, 22];
    const cards: CalendarCard[] = [];

    // Add aggregate confronto cards (Pré-Lib always first)
    confrontoMap.forEach((legs, opponent) => {
      const sorted = [...legs].sort((a, b) => a.round - b.round);
      const leg1 = sorted[0] || null;
      const leg2 = sorted[1] || null;

      let aggregateUserGoals = 0;
      let aggregateOpponentGoals = 0;
      let isComplete = true;

      for (const leg of sorted) {
        if (!leg.is_played || leg.home_score === null || leg.away_score === null) {
          isComplete = false;
        } else {
          const userGoals = leg.isHome ? leg.home_score : leg.away_score;
          const oppGoals = leg.isHome ? leg.away_score : leg.home_score;
          aggregateUserGoals += userGoals;
          aggregateOpponentGoals += oppGoals;
        }
      }

      cards.push({
        type: "aggregate",
        sortKey: 0,
        opponentName: opponent,
        competitionLabel: "Pré-Libertadores",
        leg1,
        leg2,
        aggregateUserGoals,
        aggregateOpponentGoals,
        isComplete,
      });
    });

    // Add single match cards for other competitions with interleaved sort keys
    for (const m of otherMatches) {
      const isLib = m.competitionLabel === "Libertadores";
      const sortKey = isLib 
        ? (LIB_ROUND_AFTER_BR[m.round - 1] || m.round + 22) + 0.5
        : m.round;
      cards.push({ type: "single", sortKey, match: m });
    }

    // Sort by calendar position (Pre-Lib first, then interleaved BR/Lib)
    cards.sort((a, b) => a.sortKey - b.sortKey);

    return cards;
  };

  const needsReset = totalRounds > 0 && totalRounds < 38;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const calendarCards = buildCalendarCards();

  const renderLegRow = (leg: CalendarMatch | null, label: string) => {
    if (!leg) return null;
    const isHome = leg.isHome;
    let scoreText = "- x -";
    let scoreColor = "text-muted-foreground";

    if (leg.is_played && leg.home_score !== null && leg.away_score !== null) {
      const userGoals = isHome ? leg.home_score : leg.away_score;
      const oppGoals = isHome ? leg.away_score : leg.home_score;
      scoreText = `${userGoals} x ${oppGoals}`;
      scoreColor = userGoals > oppGoals ? "text-green-400" : userGoals < oppGoals ? "text-red-400" : "text-yellow-400";
    }

    return (
      <div className="flex items-center justify-between text-xs py-1.5">
        <span className="text-muted-foreground">{label} • {isHome ? "Casa" : "Fora"}</span>
        <span className={`font-semibold ${scoreColor}`}>{scoreText}</span>
      </div>
    );
  };

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
                  Seu campeonato foi criado com {totalRounds} rodadas ({totalRounds === 22 ? 12 : Math.floor(totalRounds/2)+1} times). 
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
        ) : calendarCards.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhuma partida encontrada para este campeonato.
          </p>
        ) : (
          <div className="space-y-3">
            {calendarCards.map((card, idx) => {
              if (card.type === "aggregate") {
                const { opponentName, competitionLabel, leg1, leg2, aggregateUserGoals, aggregateOpponentGoals, isComplete } = card;
                let aggregateColor = "text-white";
                let aggregateText = "- x -";
                let statusLabel = "Em andamento";

                if (isComplete) {
                  aggregateText = `${aggregateUserGoals} x ${aggregateOpponentGoals}`;
                  statusLabel = aggregateUserGoals > aggregateOpponentGoals
                    ? "Classificado ✓"
                    : aggregateUserGoals < aggregateOpponentGoals
                    ? "Eliminado"
                    : "Pênaltis";
                  aggregateColor = aggregateUserGoals > aggregateOpponentGoals
                    ? "text-green-400"
                    : aggregateUserGoals < aggregateOpponentGoals
                    ? "text-red-400"
                    : "text-yellow-400";
                }

                return (
                  <div
                    key={`prelib-${opponentName}`}
                    className="rounded-lg bg-card border border-border/60 overflow-hidden"
                  >
                    <div className="px-4 py-3 flex items-center justify-between border-b border-border/40">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#c8ff00] font-bold">Fase Preliminar • {competitionLabel}</span>
                        <p className="text-sm font-medium text-white mt-0.5">
                          {teamName} vs {opponentName}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-base font-bold ${aggregateColor}`}>{aggregateText}</span>
                        <span className={`text-[10px] ${aggregateColor}`}>{statusLabel}</span>
                      </div>
                    </div>
                    <div className="px-4 py-2 divide-y divide-border/30">
                      {renderLegRow(leg1, "Ida")}
                      {renderLegRow(leg2, "Volta")}
                      {isComplete && (
                        <div className="flex items-center justify-between text-xs pt-1.5 pb-1">
                          <span className="text-muted-foreground font-medium">Agregado</span>
                          <span className={`font-bold ${aggregateColor}`}>{aggregateText}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Single match card
              const match = card.match;
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
                      {match.competitionLabel === "Brasileirão" ? "Sáb" : "Qua"} • {match.competitionLabel} • {match.round}ª rodada • {homeAwayLabel}
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
