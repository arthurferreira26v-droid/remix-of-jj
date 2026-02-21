import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { teams } from "@/data/teams";

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

  // Swipe support
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
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-8">
        {/* Back */}
        <button
          onClick={() => navigate("/jogo-rapido")}
          className="self-start mb-6 p-2 -ml-2 text-black/60 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* League banner */}
        <div className="bg-[#e8e8e8] rounded-2xl px-6 py-4 flex items-center justify-between mb-10">
          <span className="text-[20px] font-bold text-black tracking-wide">BRASILEIRÃO</span>
        </div>

        {/* Team carousel */}
        <div
          className="bg-[#f28b82] rounded-3xl flex flex-col items-center py-8 px-4 relative select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <h2 className="text-[22px] font-bold text-black mb-4 tracking-wide uppercase">
            {team.name}
          </h2>

          <div className="flex items-center justify-between w-full px-2">
            <button
              onClick={prev}
              className="p-2 text-black/70 hover:text-black transition-colors"
            >
              <ChevronLeft className="w-10 h-10" strokeWidth={2.5} />
            </button>

            <div className="w-36 h-36 flex items-center justify-center">
              <img
                src={team.logo}
                alt={team.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            <button
              onClick={next}
              className="p-2 text-black/70 hover:text-black transition-colors"
            >
              <ChevronRight className="w-10 h-10" strokeWidth={2.5} />
            </button>
          </div>

          {/* Stars */}
          <div className="flex gap-1.5 mt-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-8 h-8 ${
                  i < team.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-yellow-900/40 text-yellow-900/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* OK button */}
      <div className="px-6 pb-8 pt-6">
        <button
          onClick={handleConfirm}
          className="w-full h-16 bg-[#c8ff00] hover:bg-[#b8ef00] rounded-2xl flex items-center justify-center transition-colors active:scale-[0.98]"
        >
          <span className="text-[22px] font-bold text-black">OK</span>
        </button>
      </div>
    </div>
  );
};

export default QuickMatchTeamSelect;
