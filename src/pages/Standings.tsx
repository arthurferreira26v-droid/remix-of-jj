import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StandingsTable } from "@/components/StandingsTable";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Standings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamName = searchParams.get("time") || "Botafogo";

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleBack = () => {
    navigate(`/jogo?time=${teamName}`);
  };

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

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-border bg-black backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={handleBack}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Classificação</h1>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <StandingsTable />
      </div>
    </div>
  );
};

export default Standings;