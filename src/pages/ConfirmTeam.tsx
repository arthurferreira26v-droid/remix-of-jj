import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { teams } from "@/data/teams";
import { getTeamLogo } from "@/utils/teamLogos";

const ConfirmTeam = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const teamName = params.get("time") ?? "";
  const team = teams.find((t) => t.name.toLowerCase() === teamName.toLowerCase());

  useEffect(() => {
    document.title = `Confirmar ${teamName} | Gerenciador`;
  }, [teamName]);

  useEffect(() => {
    if (!teamName) navigate("/", { replace: true });
  }, [teamName, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-[#4c1d95]">
      <div className="p-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="p-2 -ml-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <span className="text-black/30 text-sm font-semibold uppercase tracking-widest mb-4">
          Time selecionado
        </span>
        <img
          src={getTeamLogo(teamName, team?.logo)}
          alt={`Escudo do ${teamName}`}
          className="w-20 h-20 object-contain"
        />
        <h1 className="mt-3 text-2xl font-extrabold text-white text-center">{teamName}</h1>
      </div>

      <div className="p-4">
        <button
          onClick={() => navigate(`/jogo?time=${encodeURIComponent(teamName)}`)}
          className="w-full py-4 rounded-xl bg-black text-white font-semibold text-base active:scale-[0.98] transition-transform"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};

export default ConfirmTeam;
