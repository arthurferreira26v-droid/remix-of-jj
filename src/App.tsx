import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import PageContainer from "./components/PageContainer";

import Index from "./pages/Index";
import Game from "./pages/Game";
import Match from "./pages/Match";
import Standings from "./pages/Standings";
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PageContainer>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/jogo" element={<Game />} />
            <Route path="/partida" element={<Match />} />
            <Route path="/classificacao" element={<Standings />} />
            <Route path="/calendario" element={<Calendar />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageContainer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
 