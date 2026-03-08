import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, LogIn } from "lucide-react";

const QuickMatchMenu = () => {
  const navigate = useNavigate();

  useEffect(() => { document.title = "Jogo Rápido | Gerenciador"; }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-12">
        <button
          onClick={() => navigate("/")}
          className="self-start mb-8 p-2 -ml-2 text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="text-[28px] font-bold text-white mb-2">
          Jogo Rápido
        </h1>
        <p className="text-[14px] text-white/40 mb-12">
          Desafie amigos em tempo real
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/jogo-rapido/criar")}
            className="w-full h-[72px] bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.08] rounded-2xl flex items-center gap-4 px-6 transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center">
              <Plus className="w-5 h-5 text-white/70" />
            </div>
            <div className="text-left">
              <span className="text-[17px] font-semibold text-white block">Criar Sala</span>
              <span className="text-[12px] text-white/35">Gere um código e convide seu amigo</span>
            </div>
          </button>

          <button
            onClick={() => navigate("/jogo-rapido/entrar")}
            className="w-full h-[72px] bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.08] rounded-2xl flex items-center gap-4 px-6 transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center">
              <LogIn className="w-5 h-5 text-white/70" />
            </div>
            <div className="text-left">
              <span className="text-[17px] font-semibold text-white block">Entrar em Sala</span>
              <span className="text-[12px] text-white/35">Use o código do seu amigo</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickMatchMenu;
