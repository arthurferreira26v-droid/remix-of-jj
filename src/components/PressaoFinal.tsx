import { useState, useEffect } from "react";

interface PressaoFinalProps {
  active: boolean;
  eventText?: string;
}

export const PressaoFinal = ({ active, eventText }: PressaoFinalProps) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    if (active) {
      setFadeOut(false);
      setShowText(true);
    } else if (showText) {
      setFadeOut(true);
      const timer = setTimeout(() => {
        setShowText(false);
        setFadeOut(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!showText && !active) return null;

  return (
    <div
      className={`fixed inset-0 z-[45] pointer-events-none transition-opacity duration-1000 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Red vignette pulsing overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(255,42,42,0.35) 100%)",
          animation: "pressao-pulse 1.2s ease-in-out infinite",
        }}
      />

      {/* Title text */}
      {active && !eventText && (
        <div className="absolute top-20 left-0 right-0 flex justify-center">
          <div
            className="px-6 py-3 rounded-xl bg-black/70 border border-red-500/50"
            style={{ animation: "pressao-pulse 1.2s ease-in-out infinite" }}
          >
            <span className="text-red-400 font-bold text-lg tracking-wider">
              🔥 PRESSÃO TOTAL
            </span>
          </div>
        </div>
      )}

      {/* Event result text */}
      {eventText && (
        <div className="absolute top-20 left-0 right-0 flex justify-center">
          <div className="px-6 py-3 rounded-xl bg-black/80 border border-red-500/60">
            <span className="text-white font-bold text-base">{eventText}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pressao-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
