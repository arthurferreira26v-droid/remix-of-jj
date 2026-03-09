import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { teams } from "@/data/teams";
import { formations, playStyles, Formation } from "@/data/formations";
import { generateTeamPlayers, Player } from "@/data/players";
import { FormationField } from "@/components/FormationField";
import { fetchAdminPlayers } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";

const generateRoomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const computeSlotAssignments = (starters: Player[], formation: Formation): string[] => {
  const available = [...starters];
  const assignments: string[] = new Array(formation.positions.length).fill("");
  for (let i = 0; i < formation.positions.length; i++) {
    const role = formation.positions[i].role;
    const idx = available.findIndex(p => p.position === role);
    if (idx !== -1) { assignments[i] = available[idx].id; available.splice(idx, 1); }
  }
  for (let i = 0; i < formation.positions.length; i++) {
    if (assignments[i]) continue;
    const role = formation.positions[i].role;
    const idx = available.findIndex(p => p.altPositions?.includes(role));
    if (idx !== -1) { assignments[i] = available[idx].id; available.splice(idx, 1); }
  }
  for (let i = 0; i < formation.positions.length; i++) {
    if (assignments[i]) continue;
    if (available.length > 0) assignments[i] = available.shift()!.id;
  }
  return assignments;
};

const ensureStarterCount = (players: Player[], requiredCount: number): Player[] => {
  const starters = players.filter(p => p.isStarter);
  const reserves = players.filter(p => !p.isStarter);
  if (starters.length === requiredCount) return players;
  const updated = [...players];
  if (starters.length < requiredCount) {
    const sorted = [...reserves].sort((a, b) => b.overall - a.overall);
    let needed = requiredCount - starters.length;
    for (const r of sorted) {
      if (needed <= 0) break;
      const idx = updated.findIndex(p => p.id === r.id);
      if (idx !== -1) { updated[idx] = { ...updated[idx], isStarter: true }; needed--; }
    }
  } else {
    const sorted = [...starters].sort((a, b) => a.overall - b.overall);
    let excess = starters.length - requiredCount;
    for (const s of sorted) {
      if (excess <= 0) break;
      const idx = updated.findIndex(p => p.id === s.id);
      if (idx !== -1) { updated[idx] = { ...updated[idx], isStarter: false }; excess--; }
    }
  }
  return updated;
};

const QuickMatchRoom = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const teamName = params.get("time") || "";
  const roomCodeParam = params.get("code") || "";
  const team = teams.find((t) => t.name === teamName);

  const isHost = !roomCodeParam;
  const roomCode = useMemo(() => isHost ? generateRoomCode() : roomCodeParam, []);

  const [roomData, setRoomData] = useState<any>(null);
  const [myReady, setMyReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [opponentTeamName, setOpponentTeamName] = useState<string | null>(null);

  useEffect(() => {
    if (!team || !isHost) return;
    const saveRoom = async () => {
      await supabase.from("quick_match_rooms" as any).insert({
        code: roomCode, team_name: team.name, host_ready: false, guest_ready: false,
      } as any);
    };
    saveRoom();
  }, [roomCode, team, isHost]);

  useEffect(() => {
    if (!team || isHost) return;
    const joinRoom = async () => {
      await supabase.from("quick_match_rooms" as any)
        .update({ guest_team_name: team.name } as any)
        .eq("code", roomCode);
    };
    joinRoom();
  }, [roomCode, team, isHost]);

  useEffect(() => {
    const fetchRoom = async () => {
      const { data } = await supabase
        .from("quick_match_rooms" as any).select("*").eq("code", roomCode).maybeSingle();
      if (data) { setRoomData(data); updateFromRoomData(data); }
    };
    fetchRoom();

    const channel = supabase
      .channel(`room-${roomCode}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'quick_match_rooms', filter: `code=eq.${roomCode}`,
      }, (payload: any) => {
        const newData = payload.new;
        if (newData) { setRoomData(newData); updateFromRoomData(newData); }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomCode]);

  const updateFromRoomData = (data: any) => {
    if (isHost) {
      setOpponentTeamName(data.guest_team_name || null);
      setOpponentReady(data.guest_ready || false);
      setMyReady(data.host_ready || false);
    } else {
      setOpponentTeamName(data.team_name || null);
      setOpponentReady(data.host_ready || false);
      setMyReady(data.guest_ready || false);
    }
  };

  useEffect(() => {
    if (myReady && opponentReady && opponentTeamName && roomData) {
      const oppStyle = isHost ? (roomData.guest_play_style || 'balanced') : (roomData.host_play_style || 'balanced');
      navigate(`/partida?time=${teamName}&adversario=${opponentTeamName}&quick=true&code=${roomCode}&role=${isHost ? 'host' : 'guest'}&myStyle=${selectedPlayStyle}&oppStyle=${oppStyle}`);
    }
  }, [myReady, opponentReady, opponentTeamName, roomData]);

  const handleReady = async () => {
    const newReady = !myReady;
    setMyReady(newReady);
    const updateField = isHost ? { host_ready: newReady } : { guest_ready: newReady };
    await supabase.from("quick_match_rooms" as any).update(updateField as any).eq("code", roomCode);
  };

  const opponentTeam = opponentTeamName ? teams.find(t => t.name === opponentTeamName) : null;

  const [selectedFormation, setSelectedFormation] = useState("4-3-3");
  const [selectedPlayStyle, setSelectedPlayStyle] = useState("balanced");
  const [openDropdown, setOpenDropdown] = useState<"style" | "formation" | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const formation = formations.find((f) => f.id === selectedFormation) || formations[1];
  const playStyle = playStyles.find((s) => s.id === selectedPlayStyle) || playStyles[0];

  useEffect(() => { document.title = "Sala | Jogo Rápido"; }, []);

  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
  const [slotAssignments, setSlotAssignments] = useState<string[]>([]);

  useEffect(() => {
    if (!team) return;
    let defaultPlayers: Player[];
    if (team.id === "botafogo") defaultPlayers = botafogoPlayers;
    else if (team.id === "flamengo") defaultPlayers = flamengoPlayers;
    else defaultPlayers = generateTeamPlayers(team.name);

    (async () => {
      const adminPlayers = await fetchAdminPlayers(true);
      const pl = adminPlayers[team.id] || defaultPlayers;
      const fixed = ensureStarterCount(pl, formation.positions.length);
      setLocalPlayers(fixed);
      const starters = fixed.filter(p => p.isStarter);
      setSlotAssignments(computeSlotAssignments(starters, formation));
    })();
  }, [team]);

  useEffect(() => {
    if (localPlayers.length === 0) return;
    const fixed = ensureStarterCount(localPlayers, formation.positions.length);
    setLocalPlayers(fixed);
    const starters = fixed.filter(p => p.isStarter);
    setSlotAssignments(computeSlotAssignments(starters, formation));
  }, [selectedFormation]);

  useEffect(() => {
    const field = isHost ? { host_formation: selectedFormation } : { guest_formation: selectedFormation };
    supabase.from("quick_match_rooms" as any).update(field as any).eq("code", roomCode);
  }, [selectedFormation, roomCode, isHost]);

  useEffect(() => {
    const field = isHost ? { host_play_style: selectedPlayStyle } : { guest_play_style: selectedPlayStyle };
    supabase.from("quick_match_rooms" as any).update(field as any).eq("code", roomCode);
  }, [selectedPlayStyle, roomCode, isHost]);

  const starters = localPlayers.filter(p => p.isStarter);
  const reserves = localPlayers.filter(p => !p.isStarter);

  const orderedStarters = slotAssignments.map(id =>
    localPlayers.find(p => p.id === id) || null
  );

  const handlePlayerClick = useCallback((player: Player) => {
    if (!selectedPlayer) { setSelectedPlayer(player); return; }
    if (selectedPlayer.id === player.id) { setSelectedPlayer(null); return; }

    const bothStarters = selectedPlayer.isStarter && player.isStarter;
    if (bothStarters) {
      const newSlots = [...slotAssignments];
      const idx1 = newSlots.indexOf(selectedPlayer.id);
      const idx2 = newSlots.indexOf(player.id);
      if (idx1 !== -1 && idx2 !== -1) { newSlots[idx1] = player.id; newSlots[idx2] = selectedPlayer.id; setSlotAssignments(newSlots); }
    } else if (!selectedPlayer.isStarter && !player.isStarter) {
      // both reserves - noop
    } else {
      const starterId = selectedPlayer.isStarter ? selectedPlayer.id : player.id;
      const reserveId = selectedPlayer.isStarter ? player.id : selectedPlayer.id;
      const updatedPlayers = localPlayers.map(p => {
        if (p.id === starterId) return { ...p, isStarter: false };
        if (p.id === reserveId) return { ...p, isStarter: true };
        return p;
      });
      setLocalPlayers(updatedPlayers);
      const newSlots = slotAssignments.map(id => id === starterId ? reserveId : id);
      setSlotAssignments(newSlots);
    }
    setSelectedPlayer(null);
  }, [selectedPlayer, slotAssignments, localPlayers]);

  const toggleDropdown = (dropdown: "style" | "formation") => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  if (!team) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <p className="text-white/50">Time não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col pb-24">
      <div className="flex-1 flex flex-col px-6 pt-8 pb-8">
        {/* Back */}
        <button
          onClick={() => navigate(isHost ? "/jogo-rapido/criar" : "/jogo-rapido/entrar")}
          className="self-start mb-6 p-2 -ml-2 text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Room code card */}
        <div className="bg-white/[0.07] border border-white/[0.08] rounded-2xl px-6 py-5 flex flex-col items-center mb-8">
          <span className="text-white/40 text-xs font-bold tracking-[0.3em] uppercase">CÓDIGO</span>
          <span className="text-white text-[32px] font-bold tracking-[0.15em] mt-1">{roomCode}</span>
        </div>

        {/* Match card */}
        <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl px-6 py-6 flex flex-col items-center mb-8">
          <span className="text-white/40 text-xs font-bold tracking-[0.3em] uppercase mb-4">AMISTOSO</span>
          <div className="flex items-center justify-center gap-6 w-full">
            <div className="flex flex-col items-center gap-1">
              {isHost ? (
                <div className="w-24 h-24 flex items-center justify-center">
                  <img src={team.logo} alt={team.name} className="max-w-full max-h-full object-contain" />
                </div>
              ) : opponentTeam ? (
                <div className="w-24 h-24 flex items-center justify-center">
                  <img src={opponentTeam.logo} alt={opponentTeam.name} className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-24 h-24 flex items-center justify-center opacity-20">
                  <span className="text-white text-4xl font-bold">?</span>
                </div>
              )}
              {isHost && opponentReady && (
                <span className="text-xs text-emerald-400 font-bold">PRONTO</span>
              )}
            </div>

            <span className="text-white/30 text-[28px] font-bold">×</span>

            <div className="flex flex-col items-center gap-1">
              {isHost ? (
                opponentTeam ? (
                  <div className="w-24 h-24 flex items-center justify-center">
                    <img src={opponentTeam.logo} alt={opponentTeam.name} className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center opacity-20">
                    <span className="text-white text-4xl font-bold">?</span>
                  </div>
                )
              ) : (
                <div className="w-24 h-24 flex items-center justify-center">
                  <img src={team.logo} alt={team.name} className="max-w-full max-h-full object-contain" />
                </div>
              )}
              {!isHost && opponentReady && (
                <span className="text-xs text-emerald-400 font-bold">PRONTO</span>
              )}
            </div>
          </div>

          {isHost && !opponentTeamName && (
            <p className="text-white/30 text-sm mt-4 animate-pulse">Aguardando oponente...</p>
          )}
        </div>

        {/* Formation field */}
        {starters.length > 0 && (
          <div className="mb-6">
            <FormationField
              formation={formation}
              players={starters}
              orderedPlayers={orderedStarters}
              onPlayerClick={handlePlayerClick}
              canSubstitute={!!selectedPlayer}
              selectedPlayerId={selectedPlayer?.id}
            />
          </div>
        )}

        {/* Tactics: formation + play style */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Play Style */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("style")}
              className="w-full bg-white/[0.07] border border-white/[0.08] text-white rounded-xl px-4 py-3 flex items-center justify-between font-medium hover:bg-white/[0.12] transition-colors"
            >
              <span className="text-sm">{playStyle.name}</span>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${openDropdown === "style" ? "rotate-180" : ""}`} />
            </button>

            {openDropdown === "style" && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c1e] rounded-xl overflow-hidden shadow-2xl z-50 border border-white/[0.1]">
                {playStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => { setSelectedPlayStyle(style.id); setOpenDropdown(null); }}
                    className={`w-full px-4 py-3 text-left hover:bg-white/[0.08] transition-colors border-b border-white/[0.06] last:border-b-0 ${
                      selectedPlayStyle === style.id ? "bg-white/[0.1]" : ""
                    }`}
                  >
                    <div className="font-medium text-white text-sm">{style.name}</div>
                    <div className="text-xs text-white/35">{style.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Formation */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("formation")}
              className="w-full bg-white/[0.07] border border-white/[0.08] text-white rounded-xl px-4 py-3 flex items-center justify-between font-medium hover:bg-white/[0.12] transition-colors"
            >
              <span className="text-sm">{formation.name}</span>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${openDropdown === "formation" ? "rotate-180" : ""}`} />
            </button>

            {openDropdown === "formation" && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c1e] rounded-xl overflow-hidden shadow-2xl z-50 border border-white/[0.1] max-h-60 overflow-y-auto">
                {formations.map((form) => (
                  <button
                    key={form.id}
                    onClick={() => { setSelectedFormation(form.id); setOpenDropdown(null); }}
                    className={`w-full px-4 py-3 text-left hover:bg-white/[0.08] transition-colors border-b border-white/[0.06] last:border-b-0 ${
                      selectedFormation === form.id ? "bg-white/[0.1]" : ""
                    }`}
                  >
                    <div className="font-medium text-white text-sm">{form.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reserves bench */}
        {reserves.length > 0 && (
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4">
            <h3 className="text-white text-lg font-bold mb-3">Reservas</h3>
            <div className="space-y-2">
              {reserves.map(player => (
                <button
                  key={player.id}
                  onClick={() => handlePlayerClick(player)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    selectedPlayer?.id === player.id
                      ? 'bg-white text-black'
                      : 'bg-white/[0.06] text-white hover:bg-white/[0.1]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg w-8 text-center">{player.number}</span>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{player.name}</span>
                        {player.ovrChange && player.ovrChange > 0 && (
                          <span className="flex items-center text-emerald-400 text-xs font-bold">
                            <TrendingUp className="w-3 h-3 mr-0.5" />+{player.ovrChange}
                          </span>
                        )}
                        {player.ovrChange && player.ovrChange < 0 && (
                          <span className="flex items-center text-red-400 text-xs font-bold">
                            <TrendingDown className="w-3 h-3 mr-0.5" />{player.ovrChange}
                          </span>
                        )}
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${
                        selectedPlayer?.id === player.id ? 'text-black/50' : 'text-white/35'
                      }`}>
                        <span>{player.position}</span>
                        <span>• {player.age} anos</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-bold">{player.overall}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Substitution hint */}
        {selectedPlayer && (
          <div className="fixed bottom-28 left-1/2 transform -translate-x-1/2 bg-white text-black px-6 py-3 rounded-lg font-medium z-50 shadow-lg">
            Clique em outro jogador para trocar
          </div>
        )}
      </div>

      {/* Floating PRONTO button */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-6 pt-3 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b] to-transparent z-40">
        <button
          onClick={handleReady}
          className={`w-full h-16 rounded-2xl flex items-center justify-center transition-all active:scale-[0.98] font-bold text-[20px] ${
            myReady
              ? "bg-emerald-500 text-white"
              : "bg-white text-black hover:bg-white/90"
          }`}
        >
          {myReady ? "✓ PRONTO" : "PRONTO"}
        </button>
      </div>
    </div>
  );
};

export default QuickMatchRoom;
