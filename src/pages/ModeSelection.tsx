import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ModeSelection = () => {
  const navigate = useNavigate();

  useEffect(() => { document.title = "Gerenciador de Futebol"; }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <h1 className="text-2xl font-bold text-foreground mb-12">
          Selecione um modo.
        </h1>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          <button
            onClick={() => navigate("/selecionar-time")}
            className="aspect-square bg-muted hover:bg-muted/80 rounded-2xl flex items-end p-5 transition-colors active:scale-[0.98]"
          >
            <span className="text-2xl font-bold text-foreground leading-tight text-left">
              Modo<br />Campanha
            </span>
          </button>

          <button
            onClick={() => navigate("/selecionar-time?modo=rapido")}
            className="aspect-square bg-muted hover:bg-muted/80 rounded-2xl flex items-end p-5 transition-colors active:scale-[0.98]"
          >
            <span className="text-2xl font-bold text-foreground leading-tight text-left">
              Jogo<br />Rápido
            </span>
          </button>
        </div>
      </div>

      <div className="pb-8 text-center">
        <button
          type="button"
          onClick={() => navigate("/admin-login")}
          className="text-muted-foreground/40 hover:text-muted-foreground text-xs transition-colors duration-200"
        >
          Área de Funcionários
        </button>
      </div>
    </div>
  );
};

export default ModeSelection;
