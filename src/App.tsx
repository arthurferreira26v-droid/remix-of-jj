import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useSearchParams } from "react-router-dom";
import Index from "./pages/Index";
import Game from "./pages/Game";
import Game2P from "./pages/Game2P";
import Match from "./pages/Match";
import Standings from "./pages/Standings";
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import ModeSelection from "./pages/ModeSelection";
import QuickMatchMenu from "./pages/QuickMatchMenu";
import QuickMatchTeamSelect from "./pages/QuickMatchTeamSelect";
import QuickMatchRoom from "./pages/QuickMatchRoom";
import QuickMatchJoinRoom from "./pages/QuickMatchJoinRoom";
import QuickMatchJoinTeamSelect from "./pages/QuickMatchJoinTeamSelect";
import Store from "./pages/Store";
import Campaign2PSelectPlayer1 from "./pages/Campaign2PSelectPlayer1";
import Campaign2PSelectPlayer2 from "./pages/Campaign2PSelectPlayer2";
import PostMatch2P from "./pages/PostMatch2P";

const GameRouter = () => {
  const [params] = useSearchParams();
  return params.get("modo") === "2p" ? <Game2P /> : <Game />;
};

const MatchRouter = () => {
  const [params] = useSearchParams();
  const key = `${params.get("time")}-${params.get("modo")}`;
  return <Match key={key} />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/confirmar-time" element={<ConfirmTeam />} />
          <Route path="/selecionar-time" element={<Index />} />

          <Route path="/jogo" element={<GameRouter />} />
          <Route path="/partida" element={<MatchRouter />} />
          <Route path="/classificacao" element={<Standings />} />
          <Route path="/calendario" element={<Calendar />} />
          <Route path="/pos-jogo-2p" element={<PostMatch2P />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
