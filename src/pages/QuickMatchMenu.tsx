import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const QuickMatchMenu = () => {
  const navigate = useNavigate();

  useEffect(() => { document.title = "Jogo Rápido | Gerenciador"; }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-12">
        <button
          onClick={() => navigate("/")}
          className="self-start mb-8 p-2 -ml-2 text-black/60 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="text-[28px] font-bold text-black mb-16">
          Jogo Rápido
        </h1>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate("/jogo-rapido/criar")}
            className="w-full h-16 bg-[#e8e8e8] hover:bg-[#ddd] rounded-2xl flex items-center justify-center transition-colors active:scale-[0.98]"
          >
            <span className="text-[20px] font-bold text-black">Criar Sala</span>
          </button>

          <button
            onClick={() => navigate("/jogo-rapido/entrar")}
            className="w-full h-16 bg-[#e8e8e8] hover:bg-[#ddd] rounded-2xl flex items-center justify-center transition-colors active:scale-[0.98]"
          >
            <span className="text-[20px] font-bold text-black">Entrar em Sala</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickMatchMenu;
