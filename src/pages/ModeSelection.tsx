import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import heroCampaign from "@/assets/hero-campaign.jpg";
import heroQuickmatch from "@/assets/hero-quickmatch.jpg";
import heroStore from "@/assets/hero-store.jpg";

const allImages = [heroCampaign, heroQuickmatch, heroStore];

const modes = [
  {
    id: "campaign",
    label: "Modo Campanha",
    description: "Gerencie seu time rumo à glória",
    route: "/selecionar-time",
    bg: heroCampaign,
  },
  {
    id: "quickmatch",
    label: "Jogo Rápido",
    description: "Desafie amigos em tempo real",
    route: "/jogo-rapido",
    bg: heroQuickmatch,
  },
  {
    id: "store",
    label: "Loja",
    description: "Jogadores premium e reforços",
    route: "/loja",
    bg: heroStore,
  },
];

const ModeSelection = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imagesReady, setImagesReady] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const isHorizontal = useRef<boolean | null>(null);

  useEffect(() => {
    document.title = "Gerenciador de Futebol";
    let loaded = 0;
    allImages.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded >= allImages.length) setImagesReady(true);
      };
      img.src = src;
    });
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isHorizontal.current = null;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      const dx = e.touches[0].clientX - touchStart.current.x;
      const dy = e.touches[0].clientY - touchStart.current.y;

      if (isHorizontal.current === null) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          isHorizontal.current = Math.abs(dx) > Math.abs(dy);
        }
        return;
      }
      if (!isHorizontal.current) return;
      e.preventDefault();

      // Rubber band at edges
      if ((currentIndex === 0 && dx > 0) || (currentIndex === modes.length - 1 && dx < 0)) {
        setDragOffset(dx * 0.25);
      } else {
        setDragOffset(dx);
      }
    },
    [currentIndex]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isHorizontal.current) {
      touchStart.current = null;
      setDragOffset(0);
      return;
    }

    const threshold = window.innerWidth * 0.2;
    if (dragOffset < -threshold && currentIndex < modes.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (dragOffset > threshold && currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }

    setDragOffset(0);
    touchStart.current = null;
    isHorizontal.current = null;
  }, [dragOffset, currentIndex]);

  if (!imagesReady) {
    return <div className="h-screen w-screen bg-background" />;
  }

  const mode = modes[currentIndex];

  // Fade out content as user drags
  const dragProgress = Math.min(Math.abs(dragOffset) / (window.innerWidth * 0.3), 1);
  const contentOpacity = 1 - dragProgress * 0.6;

  return (
    <div
      className="h-screen w-screen overflow-hidden relative bg-background select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Fullscreen background images — all mounted, toggle opacity */}
      {modes.map((m, i) => (
        <img
          key={m.id}
          src={m.bg}
          alt={m.label}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out"
          style={{
            opacity: i === currentIndex ? (dragOffset !== 0 ? contentOpacity : 1) : 0,
            transform: i === currentIndex ? `translateX(${dragOffset * 0.04}px)` : undefined,
          }}
        />
      ))}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Spacer */}
        <div className="flex-1" />

        {/* Title & description — Apple-style centered */}
        <div className="px-10 text-center mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-[34px] font-bold text-white leading-[1.1] tracking-tight mb-2">
                {mode.label}
              </h1>
              <p className="text-white/50 text-[15px] font-normal leading-relaxed">
                {mode.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom: dots + button */}
        <div className="px-10 pb-10 flex flex-col items-center gap-5">
          {/* Dots */}
          <div className="flex items-center justify-center gap-[10px]">
            {modes.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "w-[8px] h-[8px] bg-white"
                    : "w-[6px] h-[6px] bg-white/30"
                }`}
              />
            ))}
          </div>

          {/* CTA button */}
          <button
            onClick={() => navigate(mode.route)}
            className="w-full max-w-[320px] py-[15px] rounded-full bg-white text-black font-semibold text-[17px] active:scale-[0.97] transition-transform duration-150 shadow-lg"
          >
            {currentIndex === 0 ? "Iniciar Campanha" : currentIndex === 1 ? "Jogar Agora" : "Abrir Loja"}
          </button>
        </div>
      </div>

      {/* Admin link */}
      <button
        onClick={() => navigate("/admin-login")}
        className="absolute top-6 right-5 z-20 text-white/20 hover:text-white/50 text-[11px] font-medium tracking-wider uppercase transition-colors"
      >
        Admin
      </button>
    </div>
  );
};

export default ModeSelection;
