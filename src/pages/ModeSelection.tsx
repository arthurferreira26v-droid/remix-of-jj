import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Gamepad2, ShoppingBag, Shield } from "lucide-react";
import { motion } from "framer-motion";
import heroCampaign from "@/assets/hero-campaign.jpg";
import heroQuickmatch from "@/assets/hero-quickmatch.jpg";
import heroStore from "@/assets/hero-store.jpg";

// Preload images immediately on module load
[heroCampaign, heroQuickmatch, heroStore].forEach(src => {
  const img = new Image();
  img.src = src;
});
const allImages = [heroCampaign, heroQuickmatch, heroStore];

const ModeSelection = () => {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [imagesReady, setImagesReady] = useState(false);

  useEffect(() => {
    document.title = "Gerenciador de Futebol";
    let loaded = 0;
    allImages.forEach(src => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded >= allImages.length) setImagesReady(true);
      };
      img.src = src;
    });
  }, []);

  const modes = [
    {
      id: "campaign",
      label: "MODO CAMPANHA",
      description: "Gerencie seu clube rumo à glória",
      route: "/selecionar-time",
      bg: heroCampaign,
      icon: <Trophy className="w-5 h-5" />,
      accent: "from-amber-500/80 to-amber-600/40",
      badge: "CARREIRA",
    },
    {
      id: "quickmatch",
      label: "JOGO RÁPIDO",
      description: "Desafie amigos em tempo real",
      route: "/jogo-rapido",
      bg: heroQuickmatch,
      icon: <Gamepad2 className="w-5 h-5" />,
      accent: "from-emerald-500/80 to-emerald-600/40",
      badge: "MULTIPLAYER",
    },
    {
      id: "store",
      label: "LOJA",
      description: "Jogadores premium e reforços",
      route: "/loja",
      bg: heroStore,
      icon: <ShoppingBag className="w-5 h-5" />,
      accent: "from-yellow-500/80 to-yellow-600/40",
      badge: "PREMIUM",
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, x: -40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.23, ease: [0, 0, 0.2, 1] as const },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.23, ease: [0, 0, 0.2, 1] as const },
    },
  };

  const footerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.23, delay: 0.3 },
    },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col overflow-hidden relative">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[120px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
          className="absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-emerald-600/5 rounded-full blur-[100px]"
        />
      </div>

      {/* Header */}
      <motion.header
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-20 px-5 pt-6 pb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur flex items-center justify-center border border-white/10">
            <Shield className="w-4 h-4 text-white/80" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-white tracking-wide">GERENCIADOR</h1>
            <p className="text-[10px] text-white/40 font-medium tracking-[0.2em] uppercase">
              Football Manager
            </p>
          </div>
        </div>
      </motion.header>

      {/* Mode Cards */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col gap-3 px-4 pb-4 relative z-10"
      >
        {modes.map((mode, i) => (
          <motion.button
            key={mode.id}
            variants={cardVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(mode.route)}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`group relative flex-1 min-h-[140px] rounded-2xl overflow-hidden transition-opacity duration-500 ${
              hoveredIndex !== null && hoveredIndex !== i ? "opacity-50" : ""
            }`}
          >
            {/* Background Image with parallax on hover */}
            <motion.img
              src={mode.bg}
              alt={mode.label}
              loading="eager"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ scale: 1.05 }}
              whileHover={{ scale: 1.15 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            {/* Bottom accent line */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${mode.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
            />

            {/* Content */}
            <div className="relative z-10 h-full flex items-end p-5">
              <div>
                <h2 className="text-[20px] font-extrabold text-white tracking-tight leading-none mb-1">
                  {mode.label}
                </h2>
                <p className="text-[12px] text-white/45 font-medium">
                  {mode.description}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </motion.main>

      {/* Footer */}
      <motion.footer
        variants={footerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 pb-6 pt-2 flex justify-center"
      >
        <button
          onClick={() => navigate("/admin-login")}
          className="text-white/20 hover:text-white/50 text-[11px] font-medium tracking-wider uppercase transition-colors duration-300"
        >
          Área de Funcionários
        </button>
      </motion.footer>
    </div>
  );
};

export default ModeSelection;
