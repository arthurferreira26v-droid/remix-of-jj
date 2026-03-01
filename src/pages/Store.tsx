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
        <div className="bg-[#1c1c1e] rounded-3xl p-6">
          <div className="flex gap-5 items-center">
            {/* Left: Position + Circle */}
            <div className="flex flex-col items-center flex-shrink-0">
              <span className="text-[#aeaeb2] text-[13px] font-semibold mb-2 tracking-wide">
                {featuredPlayer.position}
              </span>
              <div className="relative">
                <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center"
                  style={{
                    background: 'hsl(270 100% 65%)',
                    boxShadow: '0 0 24px hsl(270 100% 65% / 0.4)',
                    border: '3px solid white',
                  }}
                >
                  <span className="text-[44px] font-bold text-white leading-none">
                    {featuredPlayer.overall}
                  </span>
                </div>
                <span className="absolute -top-1 -right-1 text-2xl">{featuredPlayer.flag}</span>
              </div>
            </div>

            {/* Right: Description */}
            <div className="flex-1 min-w-0">
              <p className="text-[#aeaeb2] text-[13px] leading-relaxed text-center">
                {featuredPlayer.description}
              </p>
            </div>
          </div>

          {/* Name below card */}
          <div className="mt-4 mb-3 text-center">
            <span className="inline-block bg-[#2c2c2e] text-white text-[15px] font-semibold px-4 py-1.5 rounded-lg">
              {featuredPlayer.name}
            </span>
          </div>

          {/* Bottom: Price + Buy */}
          <div className="flex items-center gap-3 ml-2">
            <span className="text-white text-[17px] font-semibold">{featuredPlayer.price}</span>
            <button className="bg-white text-black text-[14px] font-semibold px-5 py-1.5 rounded-full hover:bg-[#e5e5ea] transition-colors active:scale-[0.97]">
              BUY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Store;
