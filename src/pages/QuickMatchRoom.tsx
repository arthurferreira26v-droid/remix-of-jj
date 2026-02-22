import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { teams } from "@/data/teams";
import { formations, playStyles } from "@/data/formations";
import { botafogoPlayers, flamengoPlayers, generateTeamPlayers, Player } from "@/data/players";
import { FormationField } from "@/components/FormationField";
import { fetchAdminPlayers } from "@/hooks/useAdminData";
import { TrendingUp, TrendingDown } from "lucide-react";

const generateRoomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const QuickMatchRoom = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const teamName = params.get("time") || "";
  const team = teams.find((t) => t.name === teamName);

  const roomCode = useMemo(() => generateRoomCode(), []);

  const [selectedFormation, setSelectedFormation] = useState("4-3-3");
  const [selectedPlayStyle, setSelectedPlayStyle] = useState("balanced");
  const [openDropdown, setOpenDropdown] = useState<"style" | "formation" | null>(null);

  const formation = formations.find((f) => f.id === selectedFormation) || formations[1];
  const playStyle = playStyles.find((s) => s.id === selectedPlayStyle) || playStyles[0];

  useEffect(() => { document.title = "Sala | Jogo Rápido"; }, []);

  // Get players for the selected team (with admin overrides)
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (!team) return;
    // Default players
    let defaultPlayers: Player[];
    if (team.id === "botafogo") defaultPlayers = botafogoPlayers;
    else if (team.id === "flamengo") defaultPlayers = flamengoPlayers;
    else defaultPlayers = generateTeamPlayers(team.name);

    // Try admin overrides
    (async () => {
      const adminPlayers = await fetchAdminPlayers(true);
      if (adminPlayers[team.id]) {
        setPlayers(adminPlayers[team.id]);
      } else {
        setPlayers(defaultPlayers);
      }
    })();
  }, [team]);

  const starters = players.filter(p => p.isStarter);
  const reserves = players.filter(p => !p.isStarter);

  const toggleDropdown = (dropdown: "style" | "formation") => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  if (!team) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black">Time não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-8 pb-8">
        {/* Back */}
        <button
          onClick={() => navigate("/jogo-rapido/criar")}
          className="self-start mb-6 p-2 -ml-2 text-black/60 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Room code card */}
        <div className="bg-[#e8e8e8] rounded-2xl px-6 py-5 flex flex-col items-center mb-8">
          <span className="text-[#f28b82] text-sm font-bold tracking-widest uppercase">CODE</span>
          <span className="text-black text-[32px] font-bold tracking-[0.15em] mt-1">{roomCode}</span>
        </div>

        {/* Match card */}
        <div className="bg-[#0a1744] rounded-2xl px-6 py-6 flex flex-col items-center mb-8">
          <span className="text-white text-sm font-bold tracking-widest uppercase mb-4">AMISTOSO</span>
          <div className="flex items-center justify-center gap-6 w-full">
            <div className="w-24 h-24 flex items-center justify-center">
              <img src={team.logo} alt={team.name} className="max-w-full max-h-full object-contain" />
            </div>
            <span className="text-white text-[28px] font-bold">X</span>
            <div className="w-24 h-24 flex items-center justify-center opacity-30">
              <span className="text-white text-4xl font-bold">?</span>
            </div>
          </div>
        </div>

        {/* Formation field */}
        {starters.length > 0 && (
          <div className="mb-6">
            <FormationField
              formation={formation}
              players={starters}
            />
          </div>
        )}

        {/* Tactics: formation + play style */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Play Style */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("style")}
              className="w-full bg-[#e8e8e8] text-black rounded-xl px-4 py-3 flex items-center justify-between font-medium hover:bg-[#ddd] transition-colors"
            >
              <span className="text-sm">{playStyle.name}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === "style" ? "rotate-180" : ""}`} />
            </button>
            
            {openDropdown === "style" && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl overflow-hidden shadow-xl z-50 border border-gray-200">
                {playStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => {
                      setSelectedPlayStyle(style.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      selectedPlayStyle === style.id ? "bg-[#c8ff00]/20" : ""
                    }`}
                  >
                    <div className="font-medium text-black text-sm">{style.name}</div>
                    <div className="text-xs text-gray-500">{style.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Formation */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("formation")}
              className="w-full bg-[#e8e8e8] text-black rounded-xl px-4 py-3 flex items-center justify-between font-medium hover:bg-[#ddd] transition-colors"
            >
              <span className="text-sm">{formation.name}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === "formation" ? "rotate-180" : ""}`} />
            </button>
            
            {openDropdown === "formation" && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl overflow-hidden shadow-xl z-50 border border-gray-200">
                {formations.map((form) => (
                  <button
                    key={form.id}
                    onClick={() => {
                      setSelectedFormation(form.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      selectedFormation === form.id ? "bg-[#c8ff00]/20" : ""
                    }`}
                  >
                    <div className="font-medium text-black text-sm">{form.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reserves bench */}
        {reserves.length > 0 && (
          <div className="bg-[#f5f5f5] rounded-2xl p-4">
            <h3 className="text-black text-lg font-bold mb-3">Reservas</h3>
            <div className="space-y-2">
              {reserves.map(player => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-white rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-black w-8 text-center">{player.number}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-black text-sm">{player.name}</span>
                        {player.ovrChange && player.ovrChange > 0 && (
                          <span className="flex items-center text-green-600 text-xs font-bold">
                            <TrendingUp className="w-3 h-3 mr-0.5" />+{player.ovrChange}
                          </span>
                        )}
                        {player.ovrChange && player.ovrChange < 0 && (
                          <span className="flex items-center text-red-500 text-xs font-bold">
                            <TrendingDown className="w-3 h-3 mr-0.5" />{player.ovrChange}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{player.position}</span>
                        <span>• {player.age} anos</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-black">{player.overall}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickMatchRoom;
