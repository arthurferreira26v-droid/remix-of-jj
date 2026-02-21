import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ModeSelection = () => {
  const navigate = useNavigate();

  useEffect(() => { document.title = "Gerenciador de Futebol"; }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-24">
        <h1 className="text-[28px] font-bold text-black mb-16">
          Selecione um modo.
        </h1>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/selecionar-time")}
            className="aspect-square bg-[#e8e8e8] hover:bg-[#ddd] rounded-2xl flex items-end p-5 transition-colors active:scale-[0.98]"
          >
            <span className="text-[22px] font-bold text-black leading-tight text-left">
              Modo<br />Campanha
            </span>
          </button>

          <button
            onClick={() => navigate("/jogo-rapido")}
            className="aspect-square bg-[#e8e8e8] hover:bg-[#ddd] rounded-2xl flex items-end p-5 transition-colors active:scale-[0.98]"
          >
            <span className="text-[22px] font-bold text-black leading-tight text-left">
              Jogo<br />Rápido
            </span>
          </button>
        </div>
      </div>

      <div className="pb-8 text-center">
        <button
          type="button"
          onClick={() => navigate("/admin-login")}
          className="text-[#aaa] hover:text-[#666] text-xs transition-colors duration-200"
        >
          Área de Funcionários
        </button>
      </div>
    </div>
  );
};

export default ModeSelection;
