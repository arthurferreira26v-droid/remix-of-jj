import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { teams } from "@/data/teams";
import brasileiraoLogo from "@/assets/brasileirao-logo.svg";

const PointedStar = ({ filled }: { filled: boolean }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2L14.9 8.6L22 9.3L16.8 14L18.2 21L12 17.3L5.8 21L7.2 14L2 9.3L9.1 8.6L12 2Z"
      fill={filled ? "#facc15" : "rgba(255,255,255,0.1)"}
      stroke={filled ? "#facc15" : "rgba(255,255,255,0.1)"}
      strokeWidth="0.5"
    />
  </svg>
);

const QuickMatchTeamSelect = () => {
  const navigate = useNavigate();
  const brasileiros = teams.filter((t) => t.league === "brasileiro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const team = brasileiros[currentIndex];

  useEffect(() => { document.title = "Escolher Time | Jogo Rápido"; }, []);

  const prev = () =>
    setCurrentIndex((i) => (i === 0 ? brasileiros.length - 1 : i - 1));
  const next = () =>
    setCurrentIndex((i) => (i === brasileiros.length - 1 ? 0 : i + 1));

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) =>
    setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50) diff > 0 ? prev() : next();
    setTouchStart(null);
  };

  const handleConfirm = () => {
    navigate(`/jogo-rapido/sala?time=${team.name}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-8">
        <button
          onClick={() => navigate("/jogo-rapido")}
          className="self-start mb-6 p-2 -ml-2 text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* League banner */}
        <div className="bg-white/[0.07] border border-white/[0.08] rounded-2xl px-6 py-4 flex items-center justify-between mb-10">
          <span className="text-[20px] font-bold text-white tracking-wide">BRASILEIRÃO</span>
          <img src={brasileiraoLogo} alt="Brasileirão" className="w-10 h-10 object-contain" />
        </div>

        {/* Team carousel */}
        <div
          className="bg-white/[0.05] border border-white/[0.08] rounded-3xl flex flex-col items-center py-8 px-4 relative select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <h2 className="text-[22px] font-bold text-white mb-4 tracking-wide uppercase">
            {team.name}
          </h2>

          <div className="flex items-center justify-between w-full px-2">
            <button onClick={prev} className="p-2 text-white/40 hover:text-white transition-colors">
              <span className="text-[40px] font-light leading-none">←</span>
            </button>

            <div className="w-36 h-36 flex items-center justify-center">
              <img src={team.logo} alt={team.name} className="max-w-full max-h-full object-contain" loading="eager" />
            </div>

            <button onClick={next} className="p-2 text-white/40 hover:text-white transition-colors">
              <span className="text-[40px] font-light leading-none">→</span>
            </button>
          </div>

          {/* Stars */}
          <div className="flex gap-1.5 mt-4">
            {[...Array(5)].map((_, i) => (
              <PointedStar key={i} filled={i < team.rating} />
            ))}
          </div>
        </div>
      </div>

      {/* OK button */}
      <div className="px-6 pb-8 pt-6">
        <button
          onClick={handleConfirm}
          className="w-full h-16 bg-white text-black hover:bg-white/90 rounded-2xl flex items-center justify-center transition-all active:scale-[0.98]"
        >
          <span className="text-[22px] font-bold">OK</span>
        </button>
      </div>
    </div>
  );
};

export default QuickMatchTeamSelect;
