import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Gamepad2, ShoppingBag, ChevronRight, Shield } from "lucide-react";
import heroCampaign from "@/assets/hero-campaign.jpg";
import heroQuickmatch from "@/assets/hero-quickmatch.jpg";
import heroStore from "@/assets/hero-store.jpg";

const ModeSelection = () => {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Gerenciador de Futebol";
    requestAnimationFrame(() => setLoaded(true));
  }, []);

  const modes = [
    {
      id: "campaign",
      label: "MODO CAMPANHA",
      subtitle: "Construa sua dinastia",
      description: "Gerencie seu clube rumo à glória",
      route: "/selecionar-time",
      bg: heroCampaign,
      icon: <Trophy className="w-6 h-6" />,
      accent: "from-amber-500/80 to-amber-600/40",
      glowColor: "shadow-amber-500/20",
      badge: "CARREIRA",
    },
    {
      id: "quickmatch",
      label: "JOGO RÁPIDO",
      subtitle: "Partida instantânea",
      description: "Desafie amigos em tempo real",
      route: "/jogo-rapido",
      bg: heroQuickmatch,
      icon: <Gamepad2 className="w-6 h-6" />,
      accent: "from-emerald-500/80 to-emerald-600/40",
      glowColor: "shadow-emerald-500/20",
      badge: "MULTIPLAYER",
    },
    {
      id: "store",
      label: "LOJA",
      subtitle: "Mercado exclusivo",
      description: "Jogadores premium e reforços",
      route: "/loja",
      bg: heroStore,
      icon: <ShoppingBag className="w-6 h-6" />,
      accent: "from-yellow-500/80 to-yellow-600/40",
      glowColor: "shadow-yellow-500/20",
      badge: "PREMIUM",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col overflow-hidden relative">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-emerald-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header
        className={`relative z-20 px-5 pt-6 pb-4 transition-all duration-700 ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur flex items-center justify-center border border-white/10">
            <Shield className="w-4 h-4 text-white/80" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-white tracking-wide">GERENCIADOR</h1>
            <p className="text-[10px] text-white/40 font-medium tracking-[0.2em] uppercase">Football Manager</p>
          </div>
        </div>
      </header>

      {/* Mode Cards */}
      <main className="flex-1 flex flex-col gap-3 px-4 pb-4 relative z-10">
        {modes.map((mode, i) => (
          <button
            key={mode.id}
            onClick={() => navigate(mode.route)}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`group relative flex-1 min-h-[140px] rounded-2xl overflow-hidden transition-all duration-700 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            } ${hoveredIndex !== null && hoveredIndex !== i ? "opacity-60 scale-[0.98]" : ""}`}
            style={{ transitionDelay: `${i * 120}ms` }}
          >
            {/* Background Image */}
            <img
              src={mode.bg}
              alt={mode.label}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            
            {/* Bottom accent line */}
            <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${mode.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between p-5">
              {/* Top: Badge */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold tracking-[0.25em] text-white/50 bg-white/5 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
                  {mode.badge}
                </span>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70 group-hover:translate-x-1 transition-all duration-300" />
              </div>

              {/* Bottom: Info */}
              <div className="flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center border border-white/10 group-hover:bg-white/15 transition-colors duration-300">
                      {mode.icon}
                    </div>
                    <h2 className="text-[18px] font-extrabold text-white tracking-tight leading-none">
                      {mode.label}
                    </h2>
                  </div>
                  <p className="text-[12px] text-white/50 font-medium ml-[42px]">
                    {mode.description}
                  </p>
                </div>
              </div>
            </div>
          </button>
        ))}
      </main>

      {/* Footer */}
      <footer
        className={`relative z-10 pb-6 pt-2 flex justify-center transition-all duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ transitionDelay: "500ms" }}
      >
        <button
          onClick={() => navigate("/admin-login")}
          className="text-white/20 hover:text-white/50 text-[11px] font-medium tracking-wider uppercase transition-colors duration-300"
        >
          Área de Funcionários
        </button>
      </footer>
    </div>
  );
};

export default ModeSelection;
