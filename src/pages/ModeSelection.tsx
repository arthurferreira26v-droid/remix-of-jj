import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Gamepad2, Trophy } from "lucide-react";
import heroManagerImg from "@/assets/hero-manager.jpg";
import campanhaBgImg from "@/assets/campanha-bg.jpg";
import quickmatchBgImg from "@/assets/quickmatch-bg.jpg";
import lojaBgImg from "@/assets/loja-bg.jpg";

const ModeSelection = () => {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    document.title = "Gerenciador de Futebol";
    setTimeout(() => setLoaded(true), 100);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Hero Banner */}
      <button
        onClick={() => navigate("/selecionar-time")}
        className="relative w-full overflow-hidden group cursor-pointer"
        style={{ minHeight: 320 }}
      >
        <img
          src={heroManagerImg}
          alt="Football Manager"
          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div
          className={`relative z-10 flex flex-col justify-end h-full p-6 pb-8 transition-all duration-700 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ minHeight: 320 }}
        >
          <div className="text-right">
            <p className="text-white text-[28px] font-extrabold leading-tight tracking-tight">
              VENÇA.
            </p>
            <p className="text-white text-[28px] font-extrabold leading-tight tracking-tight">
              EVOLUA.
            </p>
            <p className="text-[#d4af37] text-[28px] font-extrabold leading-tight tracking-tight">
              CONQUISTE.
            </p>
          </div>
        </div>
      </button>

      {/* MODO CAMPANHA */}
      <div
        className={`transition-all duration-700 delay-150 ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="bg-[#1a1a1a] px-5 py-2.5">
          <span className="text-white text-[13px] font-bold tracking-[0.15em] uppercase">
            Modo Campanha
          </span>
        </div>
        <button
          onClick={() => navigate("/selecionar-time")}
          className="relative w-full overflow-hidden group cursor-pointer"
          style={{ height: 200 }}
        >
          <img
            src={campanhaBgImg}
            alt="Modo Campanha"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />
          <div className="relative z-10 flex items-center justify-center h-full gap-8">
            <Trophy className="w-10 h-10 text-white/80" />
            <span className="text-white text-[15px] font-semibold tracking-wide">
              Comece sua jornada
            </span>
          </div>
        </button>
      </div>

      {/* JOGO RÁPIDO */}
      <div
        className={`transition-all duration-700 delay-300 ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="bg-[#1a1a1a] px-5 py-2.5">
          <span className="text-white text-[13px] font-bold tracking-[0.15em] uppercase">
            Jogo Rápido
          </span>
        </div>
        <button
          onClick={() => navigate("/jogo-rapido")}
          className="relative w-full overflow-hidden group cursor-pointer"
          style={{ height: 200 }}
        >
          <img
            src={quickmatchBgImg}
            alt="Jogo Rápido"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />
          <div className="relative z-10 flex items-center justify-center h-full gap-8">
            <Gamepad2 className="w-10 h-10 text-white/80" />
            <span className="text-white text-[15px] font-semibold tracking-wide">
              Desafie um amigo
            </span>
          </div>
        </button>
      </div>

      {/* LOJA */}
      <div
        className={`transition-all duration-700 delay-[450ms] ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="bg-[#1a1a1a] px-5 py-2.5">
          <span className="text-white text-[13px] font-bold tracking-[0.15em] uppercase">
            Loja
          </span>
        </div>
        <button
          onClick={() => navigate("/loja")}
          className="relative w-full overflow-hidden group cursor-pointer"
          style={{ height: 180 }}
        >
          <img
            src={lojaBgImg}
            alt="Loja"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300" />
          <div className="relative z-10 flex items-center justify-center h-full gap-6">
            <ShoppingBag className="w-9 h-9 text-[#8b7355]" />
            <span className="text-[#5a4a35] text-[15px] font-semibold tracking-wide">
              Jogadores exclusivos
            </span>
          </div>
          {/* Floating particles animation */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute w-1 h-1 bg-[#d4af37]/40 rounded-full animate-float-1" />
            <div className="absolute w-1.5 h-1.5 bg-[#d4af37]/30 rounded-full animate-float-2" />
            <div className="absolute w-1 h-1 bg-[#d4af37]/50 rounded-full animate-float-3" />
          </div>
        </button>
      </div>

      {/* Footer */}
      <div
        className={`py-8 flex flex-col items-center transition-all duration-700 delay-[600ms] ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={() => navigate("/admin-login")}
          className="text-[#666] hover:text-[#999] text-[12px] transition-colors duration-200"
        >
          Área de Funcionários
        </button>
      </div>

      <style>{`
        @keyframes float-1 {
          0%, 100% { top: 80%; left: 20%; opacity: 0; }
          50% { top: 20%; left: 25%; opacity: 1; }
        }
        @keyframes float-2 {
          0%, 100% { top: 70%; left: 60%; opacity: 0; }
          50% { top: 10%; left: 55%; opacity: 1; }
        }
        @keyframes float-3 {
          0%, 100% { top: 90%; left: 80%; opacity: 0; }
          50% { top: 30%; left: 75%; opacity: 1; }
        }
        .animate-float-1 { animation: float-1 4s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 5s ease-in-out infinite 1s; }
        .animate-float-3 { animation: float-3 6s ease-in-out infinite 2s; }
      `}</style>
    </div>
  );
};

export default ModeSelection;
