import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { teams } from "@/data/teams";
import { formations } from "@/data/formations";
import { botafogoPlayers, flamengoPlayers, generateTeamPlayers } from "@/data/players";
import { FormationField } from "@/components/FormationField";

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
  const formation = formations[1]; // 4-3-3 default

  useEffect(() => { document.title = "Sala | Jogo Rápido"; }, []);

  // Get players for the selected team
  const players = useMemo(() => {
    if (!team) return [];
    if (team.id === "botafogo") return botafogoPlayers;
    if (team.id === "flamengo") return flamengoPlayers;
    return generateTeamPlayers(team.name);
  }, [team]);

  if (!team) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Time não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-8">
        {/* Back */}
        <button
          onClick={() => navigate("/jogo-rapido/criar")}
          className="self-start mb-6 p-2 -ml-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Room code card */}
        <div className="bg-white rounded-2xl px-6 py-5 flex flex-col items-center mb-8">
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
        {players.length > 0 && (
          <div className="mb-8">
            <FormationField
              formation={formation}
              players={players.slice(0, 11)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickMatchRoom;
