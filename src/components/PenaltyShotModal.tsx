import { useState } from "react";
import { Player } from "@/data/players";

interface PenaltyShotModalProps {
  isOpen: boolean;
  kicker: Player | null;
  onResolve: (isGoal: boolean) => void;
}

type Spot = { id: string; label: string; x: string; y: string };

const SPOTS: Spot[] = [
  { id: "tl", label: "Ângulo esquerdo", x: "14%", y: "22%" },
  { id: "tr", label: "Ângulo direito", x: "86%", y: "22%" },
  { id: "c", label: "Meio", x: "50%", y: "46%" },
  { id: "bl", label: "Canto baixo esquerdo", x: "18%", y: "72%" },
  { id: "br", label: "Canto baixo direito", x: "82%", y: "72%" },
];

export function PenaltyShotModal({ isOpen, kicker, onResolve }: PenaltyShotModalProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [result, setResult] = useState<"goal" | "miss" | null>(null);

  if (!isOpen) return null;

  const handleShoot = (spot: Spot) => {
    if (chosen) return;
    setChosen(spot.id);
    const isGoal = Math.random() < 0.6;
    setResult(isGoal ? "goal" : "miss");
    setTimeout(() => {
      setChosen(null);
      setResult(null);
      onResolve(isGoal);
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <p className="text-center text-xs uppercase tracking-widest text-zinc-500">Pênalti</p>
        <h2 className="text-center text-xl font-bold text-white mt-1 mb-6">
          {kicker ? kicker.name : "Cobrança"}
        </h2>

        {/* Gol */}
        <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800">
          {/* Traves + rede */}
          <div className="absolute inset-x-[6%] top-[10%] bottom-[22%] border-[6px] border-white/90 rounded-sm overflow-hidden">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.5) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />
          </div>
          {/* Gramado */}
          <div className="absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-b from-emerald-800 to-emerald-950" />

          {/* Alvos */}
          {SPOTS.map((spot) => {
            const isChosen = chosen === spot.id;
            return (
              <button
                key={spot.id}
                aria-label={spot.label}
                onClick={() => handleShoot(spot)}
                style={{ left: spot.x, top: spot.y }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                  isChosen
                    ? result === "goal"
                      ? "bg-[#c8ff00] border-[#c8ff00] scale-110"
                      : "bg-red-500 border-red-500 scale-110"
                    : "bg-white/10 border-white/70 hover:bg-white/25 active:scale-95"
                } ${chosen && !isChosen ? "opacity-30" : ""}`}
              >
                <span
                  className={`w-6 h-6 rounded-full ${
                    isChosen ? "bg-black/20" : "bg-white/80"
                  }`}
                  style={
                    isChosen
                      ? undefined
                      : {
                          backgroundImage:
                            "radial-gradient(circle at 30% 30%, #fff 40%, #cbd5e1 100%)",
                        }
                  }
                />
              </button>
            );
          })}
        </div>

        <p className="text-center text-sm text-zinc-400 mt-5 h-6">
          {result === "goal"
            ? "GOL!"
            : result === "miss"
            ? "Perdeu!"
            : "Escolha onde bater"}
        </p>
      </div>
    </div>
  );
}
