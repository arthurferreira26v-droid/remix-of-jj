// App.tsx (final)
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Game from "./pages/Game";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ModeSelection />} />
          <Route path="/selecionar-time" element={<Index />} />
          <Route path="/jogo-rapido" element={<QuickMatchMenu />} />
          <Route path="/jogo-rapido/criar" element={<QuickMatchTeamSelect />} />
          <Route path="/jogo-rapido/sala" element={<QuickMatchRoom />} />
          <Route path="/jogo-rapido/entrar" element={<QuickMatchJoinRoom />} />
          <Route path="/jogo-rapido/entrar/time" element={<QuickMatchJoinTeamSelect />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-panel" element={<AdminPanel />} />
          <Route path="/jogo" element={<Game />} />
          <Route path="/partida" element={<Match />} />
          <Route path="/classificacao" element={<Standings />} />
          <Route path="/calendario" element={<Calendar />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;