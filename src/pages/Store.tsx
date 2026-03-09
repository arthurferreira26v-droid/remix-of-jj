import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface LegendPlayer {
  name: string;
  position: string;
  overall: number;
  flag: string;
  price: string;
}

const legends: LegendPlayer[] = [
  { name: "Ronaldinho", position: "PE", overall: 93, flag: "🇧🇷", price: "R$2,99" },
  { name: "Ronaldo", position: "ATA", overall: 96, flag: "🇧🇷", price: "R$4,99" },
  { name: "Garrincha", position: "PD", overall: 92, flag: "🇧🇷", price: "R$2,99" },
  { name: "Cafu", position: "LD", overall: 91, flag: "🇧🇷", price: "R$1,99" },
];

const LegendCard = ({ player }: { player: LegendPlayer }) => {
  return (
    <button
      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98]"
      style={{
        background: 'hsl(0 0% 100% / 0.06)',
        border: '1px solid hsl(0 0% 100% / 0.08)',
      }}
    >
      {/* OVR Circle */}
      <div className="relative flex-shrink-0">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(270 80% 55%), hsl(280 90% 40%))',
            boxShadow: '0 0 16px hsl(270 80% 55% / 0.35)',
          }}
        >
          <span className="text-[16px] font-black text-white leading-none relative z-10">
            {player.overall}
          </span>
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.04) 35%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.04) 65%, transparent 75%)',
              backgroundSize: '300% 100%',
              animation: 'mirrorShine 3s ease-in-out infinite',
            }}
          />
        </div>
        <span className="absolute -top-1 -right-1 text-[12px]">{player.flag}</span>
      </div>

      {/* Name + Position */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="text-white text-[15px] font-semibold truncate">{player.name}</span>
          <span className="text-[13px]">{player.flag}</span>
        </div>
        <span className="text-white/35 text-[13px]">{player.position}</span>
      </div>

      {/* Price + Buy */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span
          className="text-[13px] font-semibold px-4 py-1.5 rounded-full"
          style={{
            background: 'hsl(270 80% 55% / 0.15)',
            color: 'hsl(270 80% 70%)',
            border: '1px solid hsl(270 80% 55% / 0.25)',
          }}
        >
          {player.price}
        </span>
      </div>
    </button>
  );
};

const Store = () => {
  const navigate = useNavigate();
  useEffect(() => { document.title = "Loja | Gerenciador"; }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0b' }}>
      <div className="flex-1 flex flex-col px-5 pt-12 pb-8">
        <button
          onClick={() => navigate("/")}
          className="self-start mb-8 p-2 -ml-2 text-white/35 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="text-[28px] font-bold text-white tracking-tight mb-1">
          Lendas
        </h1>
        <p className="text-white/30 text-[13px] mb-8">
          Jogadores icônicos disponíveis
        </p>

        <div className="space-y-2.5">
          {legends.map((legend) => (
            <LegendCard key={legend.name} player={legend} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes mirrorShine {
          0% { background-position: 300% 0; }
          100% { background-position: -300% 0; }
        }
      `}</style>
    </div>
  );
};

export default Store;
