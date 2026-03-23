import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Game2PInner from "./Game2PInner";
import { deleteLocalChampionship } from "@/utils/localChampionship";
import { clearAllOffers } from "@/utils/transferOffers";
import { teams } from "@/data/teams";

const Game2P = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const player1Team = searchParams.get("time") || "";
  const player2Team = searchParams.get("time2") || "";
  const [currentTurn, setCurrentTurn] = useState(1);

  // Sync championship: P2 uses same championship as P1
  useEffect(() => {
    const p1Champ = localStorage.getItem(`local_championship_${player1Team}`);
    const p1Matches = localStorage.getItem(`local_matches_${player1Team}`);
    const p1Standings = localStorage.getItem(`local_standings_${player1Team}`);
    if (p1Champ && p1Matches && p1Standings) {
      localStorage.setItem(`local_championship_${player2Team}`, p1Champ);
      localStorage.setItem(`local_matches_${player2Team}`, p1Matches);
      localStorage.setItem(`local_standings_${player2Team}`, p1Standings);
    }
  }, [player1Team, player2Team, currentTurn]);

  const activeTeam = currentTurn === 1 ? player1Team : player2Team;

  const handlePlay = (opponentName: string) => {
    const savedPlayers = localStorage.getItem(`players_${activeTeam}`);

    if (currentTurn === 1) {
      if (savedPlayers) localStorage.setItem('match_players_p1', savedPlayers);
      localStorage.setItem('2p_p1_match_pending', JSON.stringify({ team: player1Team, opponent: opponentName }));
      setCurrentTurn(2);
    } else {
      if (savedPlayers) localStorage.setItem('match_players_p2', savedPlayers);
      localStorage.setItem('2p_p2_match_pending', JSON.stringify({ team: player2Team, opponent: opponentName }));
      const p1Players = localStorage.getItem('match_players_p1');
      if (p1Players) localStorage.setItem('match_players', p1Players);
      const p1Match = JSON.parse(localStorage.getItem('2p_p1_match_pending') || '{}');
      navigate(`/partida?time=${encodeURIComponent(p1Match.team)}&adversario=${encodeURIComponent(p1Match.opponent)}&modo=2p&time2=${encodeURIComponent(player2Team)}`);
    }
  };

  const handleExit = () => {
    deleteLocalChampionship(player1Team);
    deleteLocalChampionship(player2Team);
    // Limpar dados de todos os times
    const brazilianTeams = teams.filter(t => t.league === "brasileiro").map(t => t.name);
    brazilianTeams.forEach(t => {
      localStorage.removeItem(`players_${t}`);
      localStorage.removeItem(`starter_order_${t}`);
      localStorage.removeItem(`investment_${t}`);
      localStorage.removeItem(`local_budget_${t}`);
    });
    // Limpar dados específicos do 2P
    [player1Team, player2Team].forEach(t => {
      localStorage.removeItem(`lib_championship_${t}`);
      localStorage.removeItem(`lib_matches_${t}`);
      localStorage.removeItem(`lib_standings_${t}`);
    });
    localStorage.removeItem('2p_p1_match_pending');
    localStorage.removeItem('2p_p2_match_pending');
    localStorage.removeItem('match_players_p1');
    localStorage.removeItem('match_players_p2');
    localStorage.removeItem('lib_prelib_teams');
    localStorage.removeItem('lib_direct_qualifiers');
    clearAllOffers();
    navigate("/");
  };

  return (
    <Game2PInner
      key={`${activeTeam}-${currentTurn}`}
      activeTeam={activeTeam}
      currentTurn={currentTurn}
      onPlay={handlePlay}
      onExit={handleExit}
      turnLabel={currentTurn === 1 ? "PRONTO" : "JOGAR"}
    />
  );
};

export default Game2P;
