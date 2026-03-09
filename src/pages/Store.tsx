import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface LegendPlayer {
  name: string;
  position: string;
  overall: number;
  flag: string;
  description: string;
  price: string;
}

const legends: LegendPlayer[] = [
  {
    name: "Ronaldinho",
    position: "PE",
    overall: 93,
    flag: "🇧🇷",
    description: "Mágico do futebol, campeão do mundo em 2002 e duas vezes melhor do mundo pela FIFA.",
    price: "R$2,99",
  },
  {
    name: "Ronaldo",
    position: "ATA",
    overall: 96,
    flag: "🇧🇷",
    description: "O Fenômeno. Maior artilheiro de Copas do Mundo, bicampeão mundial e três vezes melhor do mundo.",
    price: "R$4,99",
  },
  {
    name: "Garrincha",
    position: "PD",
    overall: 92,
    flag: "🇧🇷",
    description: "Alegria do Povo. Gênio driblador, campeão do mundo em 1958 e 1962 pela seleção brasileira.",
    price: "R$2,99",
  },
  {
    name: "Cafu",
    position: "LD",
    overall: 91,
    flag: "🇧🇷",
    description: "O Pendolino. Lateral mais vitorioso da história, bicampeão do mundo em 1994 e 2002.",
    price: "R$1,99",
  },
];

const LegendCard = ({ player }: { player: LegendPlayer }) => {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsl(0 0% 10%) 0%, hsl(270 15% 12%) 50%, hsl(0 0% 8%) 100%)',
        border: '1px solid hsl(270 40% 25% / 0.4)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 50%, hsl(270 80% 50% / 0.08), transparent 60%)',
        }}
      />

      <div className="relative z-10 flex gap-4 items-center">
        {/* Left: Position + OVR Circle */}
        <div className="flex flex-col items-start flex-shrink-0">
          <span className="text-white/40 text-[11px] font-semibold mb-1.5 tracking-wider ml-1">
            {player.position}
          </span>
          <div className="relative">
            <div
              className="w-[90px] h-[90px] rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, hsl(270 80% 55%), hsl(280 90% 40%))',
                boxShadow: '0 0 25px hsl(270 80% 55% / 0.5), 0 0 60px hsl(270 80% 55% / 0.2)',
                border: '2px solid hsl(270 60% 70% / 0.6)',
              }}
            >
              <span className="text-[32px] font-black text-white leading-none relative z-10">
                {player.overall}
              </span>
              {/* Mirror/shine animation */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.04) 35%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.04) 65%, transparent 75%)',
                  backgroundSize: '300% 100%',
                  animation: 'mirrorShine 3s ease-in-out infinite',
                }}
              />
            </div>
            <span className="absolute -top-1 -right-1 text-lg">{player.flag}</span>
          </div>
        </div>

        {/* Right: Description */}
        <div className="flex-1 min-w-0">
          <p className="text-white/40 text-[12px] leading-relaxed">
            {player.description}
          </p>
        </div>
      </div>

      {/* Name + Price row */}
      <div className="relative z-10 mt-3 flex items-center justify-between">
        <span
          className="text-white text-[16px] font-bold"
          style={{ width: 90, textAlign: 'center' }}
        >
          {player.name}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-[14px] font-semibold">{player.price}</span>
          <button
            className="text-black text-[13px] font-bold px-5 py-1.5 rounded-full transition-all active:scale-[0.96]"
            style={{
              background: 'linear-gradient(135deg, hsl(270 80% 65%), hsl(280 90% 50%))',
              boxShadow: '0 0 15px hsl(270 80% 55% / 0.3)',
              color: 'white',
            }}
          >
            BUY
          </button>
        </div>
      </div>
    </div>
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
          className="self-start mb-6 p-2 -ml-2 text-white/35 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="text-[28px] font-bold text-white tracking-tight mb-2">
          Loja de Lendas
        </h1>
        <p className="text-white/30 text-[13px] mb-8">
          Jogadores icônicos para o seu time
        </p>

        <div className="space-y-4">
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
