import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Store = () => {
  const navigate = useNavigate();

  useEffect(() => { document.title = "Loja | Gerenciador"; }, []);

  // Example featured player
  const featuredPlayer = {
    name: "Ronaldinho",
    position: "PE",
    overall: 93,
    flag: "🇧🇷",
    description: "Campeão do mundo com a seleção brasileira de Futebol em 2002 e duas vezes eleito o melhor do mundo pela FIFA.",
    price: "R$2,99",
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-12">
        <button
          onClick={() => navigate("/")}
          className="self-start mb-6 p-2 -ml-2 text-[#8e8e93] hover:text-black transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="text-[32px] font-bold text-black tracking-tight mb-10">
          Loja
        </h1>

        {/* Featured Player Card */}
        <div className="bg-[#1c1c1e] rounded-2xl p-5">
          <div className="flex gap-4 items-center">
            {/* Left: Position + Circle */}
            <div className="flex flex-col items-start flex-shrink-0">
              <span className="text-[#aeaeb2] text-[11px] font-semibold mb-1.5 tracking-wide ml-1">
                {featuredPlayer.position}
              </span>
              <div className="relative">
                <div className="w-[100px] h-[100px] rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    background: 'hsl(270 100% 65%)',
                    boxShadow: '0 0 20px hsl(270 100% 65% / 0.4)',
                    border: '2.5px solid white',
                  }}
                >
                  <span className="text-[36px] font-bold text-white leading-none relative z-10">
                    {featuredPlayer.overall}
                  </span>
                  {/* Dark shine on circle */}
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 60%, transparent 70%)',
                      backgroundSize: '250% 100%',
                      animation: 'orbShine 3s ease-in-out infinite',
                    }}
                  />
                </div>
                <span className="absolute -top-1 -right-1 text-xl">{featuredPlayer.flag}</span>
              </div>
            </div>

            {/* Right: Description */}
            <div className="flex-1 min-w-0">
              <p className="text-[#aeaeb2] text-[13px] leading-relaxed text-center">
                {featuredPlayer.description}
              </p>
            </div>
          </div>

          {/* Name + Price row */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-white text-[17px] font-bold" style={{ width: 100, textAlign: 'center' }}>
              {featuredPlayer.name}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-white text-[15px] font-semibold">{featuredPlayer.price}</span>
              <button className="bg-white text-black text-[14px] font-semibold px-5 py-1.5 rounded-full hover:bg-[#e5e5ea] transition-colors active:scale-[0.97]">
                BUY
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes orbShine {
            0% { background-position: 250% 0; }
            100% { background-position: -250% 0; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Store;
