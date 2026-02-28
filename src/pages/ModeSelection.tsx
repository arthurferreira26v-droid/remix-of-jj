import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ModeSelection = () => {
  const navigate = useNavigate();

  useEffect(() => { document.title = "Gerenciador de Futebol"; }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div className="flex-1 flex flex-col justify-center px-6">
        <h1 className="text-[32px] font-bold text-black tracking-tight mb-10">
          Selecione um modo.
        </h1>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/selecionar-time")}
            className="aspect-[1/1.05] bg-[#f2f2f7] hover:bg-[#e5e5ea] rounded-2xl flex items-end p-5 transition-all duration-200 active:scale-[0.97]"
          >
            <span className="text-[20px] font-semibold text-black leading-tight text-left">
              Modo<br />Campanha
            </span>
          </button>

          <button
            onClick={() => navigate("/jogo-rapido")}
            className="aspect-[1/1.05] bg-[#f2f2f7] hover:bg-[#e5e5ea] rounded-2xl flex items-end p-5 transition-all duration-200 active:scale-[0.97]"
          >
            <span className="text-[20px] font-semibold text-black leading-tight text-left">
              Jogo<br />Rápido
            </span>
          </button>

          <button
            onClick={() => navigate("/loja")}
            className="aspect-[1/1.05] bg-[#f2f2f7] hover:bg-[#e5e5ea] rounded-2xl flex items-end p-5 transition-all duration-200 active:scale-[0.97]"
          >
            <span className="text-[20px] font-semibold text-black leading-tight text-left">
              Loja
            </span>
          </button>
        </div>
      </div>

      <div className="pb-10 pt-6 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/auth")}
          className="text-[#8e8e93] hover:text-[#3a3a3c] text-[15px] font-medium transition-colors duration-200"
        >
          Fazer login ou cadastro
        </button>
        <button
          type="button"
          onClick={() => navigate("/admin-login")}
          className="text-[#aeaeb2] hover:text-[#636366] text-[13px] transition-colors duration-200"
        >
          Área de Funcionários
        </button>
      </div>
    </div>
  );
};

export default ModeSelection;
