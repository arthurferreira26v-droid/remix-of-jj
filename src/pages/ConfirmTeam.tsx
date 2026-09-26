import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { teams } from "@/data/teams";
import { getTeamLogo } from "@/utils/teamLogos";
import { Button } from "@/components/ui/button";

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




  return (
    <div className="min-h-screen flex flex-col bg-[#4ade80]">
      <div className="p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="-ml-2 text-foreground hover:text-foreground hover:bg-transparent"
        >
          <ArrowLeft className="!w-6 !h-6" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col px-4 pt-8">
        <h1 className="text-foreground text-[28px] sm:text-4xl font-extrabold uppercase leading-tight text-left">
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
        <Button
          onClick={handleConfirm}
          className="w-full h-auto py-4 rounded-xl bg-black text-white font-bold text-base uppercase tracking-wide active:scale-[0.98] transition-transform"
        >
          Continuar
        </Button>
      </div>

    </div>
  );
};

export default ConfirmTeam;
