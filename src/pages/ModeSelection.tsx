import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Gamepad2, Trophy } from "lucide-react";
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

  const sections = [
    {
      label: "Modo Campanha",
      route: "/selecionar-time",
      bg: campanhaBgImg,
      icon: <Trophy className="w-10 h-10 text-white/90" />,
      subtitle: "Comece sua jornada",
      overlay: "bg-black/40 group-hover:bg-black/30",
      textColor: "text-white",
      delay: "delay-0",
    },
    {
      label: "Jogo Rápido",
      route: "/jogo-rapido",
      bg: quickmatchBgImg,
      icon: <Gamepad2 className="w-10 h-10 text-white/90" />,
      subtitle: "Jogo Rápido",
      overlay: "bg-black/40 group-hover:bg-black/30",
      textColor: "text-white",
      delay: "delay-150",
    },
    {
      label: "Loja",
      route: "/loja",
      bg: lojaBgImg,
      icon: <ShoppingBag className="w-9 h-9 text-[#8b7355]" />,
      subtitle: "Jogadores exclusivos",
      overlay: "bg-black/10 group-hover:bg-black/5",
      textColor: "text-[#5a4a35]",
      delay: "delay-300",
    },
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {sections.map((s, i) => (
        <div
          key={s.label}
          className={`flex-1 flex flex-col transition-all duration-700 ${s.delay} ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="bg-[#1a1a1a] px-5 py-2.5">
            <span className="text-white text-[13px] font-bold tracking-[0.15em] uppercase">
              {s.label}
            </span>
          </div>
          <button
            onClick={() => navigate(s.route)}
            className="relative w-full overflow-hidden group cursor-pointer flex-1"
            style={{ minHeight: 200 }}
          >
            <img
              src={s.bg}
              alt={s.label}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className={`absolute inset-0 ${s.overlay} transition-colors duration-300`} />
            <div className="relative z-10 flex items-center justify-center h-full gap-6">
              {s.icon}
              <span className={`${s.textColor} text-[15px] font-semibold tracking-wide`}>
                {s.subtitle}
              </span>
            </div>
            {i === 2 && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute w-1 h-1 bg-[#d4af37]/40 rounded-full animate-float-1" />
                <div className="absolute w-1.5 h-1.5 bg-[#d4af37]/30 rounded-full animate-float-2" />
                <div className="absolute w-1 h-1 bg-[#d4af37]/50 rounded-full animate-float-3" />
              </div>
            )}
          </button>
        </div>
      ))}

      {/* Footer */}
      <div
        className={`py-6 flex flex-col items-center transition-all duration-700 delay-[450ms] ${
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
