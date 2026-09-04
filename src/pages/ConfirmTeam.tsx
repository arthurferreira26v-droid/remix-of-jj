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

  const handleConfirm = () => {
    navigate(`/jogo?time=${encodeURIComponent(teamName)}`);
  };

  const handleContinueWithoutSave = () => {
    navigate(`/jogo?time=${encodeURIComponent(teamName)}&temp=1`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#4ade80]">
      <div className="p-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="p-2 -ml-2 text-black/70 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col px-4 pt-8">
        <h1 className="text-white text-3xl sm:text-4xl font-extrabold uppercase leading-tight text-left">
          Conquiste o mundo
          <br />
          com seu time
        </h1>

        <div className="flex-1 flex flex-col items-center justify-center">
          <img
            src={getTeamLogo(teamName, team?.logo)}
            alt={`Escudo do ${teamName}`}
            className="w-24 h-24 object-contain drop-shadow-lg"
          />
          <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-black text-center">
            {teamName}
          </h2>
        </div>
      </div>

      <div className="p-4">
        <button
          onClick={handleConfirm}
          className="w-full py-4 rounded-xl bg-black text-white font-bold text-base uppercase tracking-wide active:scale-[0.98] transition-transform"
        >
          Continuar
        </button>
      </div>

    </div>
  );
};

export default ConfirmTeam;
