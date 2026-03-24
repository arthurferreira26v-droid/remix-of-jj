import { Player } from "@/data/players";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";

interface PlayerBubbleProps {
  player: Player;
  isSelected?: boolean;
  isInPosition?: boolean;
  showEnergyBar?: boolean;
  onClick?: () => void;
  /** "field" = small circle on pitch, "reserve" = row in bench list */
  variant?: "field" | "reserve";
  role?: string;
  /** Card state for match visuals */
  yellowCard?: boolean;
  redCard?: boolean;
}

/** Energy color based on percentage */
const getEnergyColor = (energy: number) => {
  if (energy >= 70) return "hsl(142 70% 50%)";
  if (energy >= 40) return "hsl(45 100% 50%)";
  return "hsl(0 80% 55%)";
};

/** Field variant: small circle with OVR + name label + horizontal energy bar */
const FieldBubble = ({ player, isSelected, isInPosition = true, role, onClick, showEnergyBar = true, yellowCard, redCard }: PlayerBubbleProps) => {
  const energy = player.matchEnergy ?? player.energy ?? 100;
  const hasYellow = yellowCard || (player.matchYellowCards || 0) >= 1 || (player.accumulatedYellows || 0) > 0;
  const hasRed = redCard || player.matchRedCard || (player.suspensionMatches || 0) > 0;

  // During a match, red-carded players are visually distinct but STILL CLICKABLE for tactical repositioning
  // On home screen, suspended players can be selected for substitution
  const isSuspendedOnly = !redCard && !player.matchRedCard && (player.suspensionMatches || 0) > 0;
  const isMatchRedCard = redCard || player.matchRedCard;
  // Expelled players are NOT disabled — they can be moved tactically

  return (
    <div
      className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${onClick ? "cursor-pointer" : ""} ${isSelected ? "scale-110 z-10" : ""}`}
      onClick={onClick}
      style={isMatchRedCard ? { opacity: 0.25, filter: 'grayscale(100%)' } : isSuspendedOnly ? { opacity: 0.5 } : {}}
    >
      {/* OVR circle */}
      <div className="relative">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
          isSelected 
            ? "bg-[#c8ff00] border-[3px] border-[#c8ff00]" 
            : hasRed
            ? "bg-red-900 border-2 border-red-500"
            : hasYellow
            ? "bg-black/90 border-2 border-yellow-400"
            : "bg-black/90 border-2 border-white/80"
        }`}
          style={
            hasRed 
              ? { boxShadow: '0 0 14px rgba(239,68,68,0.8), 0 0 4px rgba(239,68,68,1)' } 
              : hasYellow 
              ? { boxShadow: '0 0 12px rgba(250,204,21,0.7), 0 0 4px rgba(250,204,21,0.9)' } 
              : {}
          }
        >
          {hasRed ? (
            <span className="text-red-400 text-sm font-black">✕</span>
          ) : (
            <span className={`text-sm font-bold ${isSelected ? "text-black" : "text-white"}`}>{player.overall}</span>
          )}
        </div>

        {!isInPosition && !hasRed && !hasYellow && (
          <div className="absolute -top-1 -left-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center shadow-md border border-white">
            <span className="text-black text-[9px] font-bold">!</span>
          </div>
        )}
        {hasRed && (
          <div className="absolute -top-2 -right-2 text-sm drop-shadow-lg">🟥</div>
        )}
        {/* Yellow card: only the ring border, no emoji/counter */}
      </div>

      {/* Name */}
      <div className={`px-1.5 py-0.5 rounded text-[8px] font-medium whitespace-nowrap ${
        hasRed ? 'bg-red-900/70 text-red-300 line-through' : 'bg-black/70 text-white'
      }`}>
        {player.name}
      </div>

      {/* Position role tag */}
      {role && !hasRed && (
        <div className={`px-1.5 py-0 rounded text-[7px] font-bold whitespace-nowrap ${
          isInPosition ? 'bg-white/20 text-white/80' : 'bg-yellow-500/30 text-yellow-300'
        }`}>
          {role}
        </div>
      )}

      {/* Horizontal energy bar below position */}
      {showEnergyBar && !hasRed && (
        <div
          className="w-9 h-[4px] rounded-full overflow-hidden mt-0.5"
          style={{
            background: '#1f2937',
            boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
          }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${energy}%`,
              background: energy >= 70 ? '#22c55e' : energy >= 40 ? '#eab308' : '#ef4444',
              transition: 'width 0.5s ease-out',
            }}
          />
        </div>
      )}
    </div>
  );
};

/** Reserve variant: row card for bench list */
const ReserveBubble = ({ player, isSelected, onClick }: PlayerBubbleProps) => {
  const isElite = player.overall >= 80;
  const rarityColor = isElite ? 'hsl(270 100% 65%)' : 'hsl(142 70% 50%)';
  const rarityGlow = isElite ? 'hsl(270 100% 65% / 0.4)' : 'hsl(142 70% 50% / 0.3)';
  const energy = player.matchEnergy ?? player.energy ?? 100;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
        isSelected
          ? 'scale-[1.02] ring-2 ring-[#c8ff00]'
          : 'hover:scale-[1.01] hover:brightness-110'
      }`}
      style={{
        background: isSelected
          ? 'hsl(68 100% 50% / 0.15)'
          : 'hsl(0 0% 100% / 0.06)',
        backdropFilter: 'blur(12px)',
        border: isSelected
          ? '1px solid hsl(68 100% 50% / 0.5)'
          : `1px solid ${isElite ? 'hsl(270 100% 65% / 0.25)' : 'hsl(142 70% 50% / 0.2)'}`,
        boxShadow: isSelected
          ? '0 0 20px hsl(68 100% 50% / 0.2)'
          : `0 0 12px ${rarityGlow}`
      }}
    >
      {/* OVR */}
      <div className="relative flex-shrink-0">
        <span
          className="font-black text-2xl w-10 text-center block tracking-tight"
          style={{
            color: rarityColor,
            textShadow: `0 0 12px ${rarityGlow}, 0 0 4px ${rarityGlow}`
          }}
        >
          {player.overall}
        </span>
      </div>

      {/* Info */}
      <div className="text-left flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-semibold text-sm truncate ${isSelected ? 'text-[#c8ff00]' : 'text-white/95'}`}>
            {player.name}
          </span>
          {player.ovrChange && player.ovrChange > 0 && (
            <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
          )}
          {player.ovrChange && player.ovrChange < 0 && (
            <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] font-medium" style={{ color: rarityColor }}>
            {player.position}
          </span>
          <span className="text-white/30 text-[10px]">•</span>
          <span className="text-white/40 text-[11px]">{player.age} anos</span>
          {/* Energy as icon + percentage */}
          <span className="flex items-center gap-0.5">
            <Zap className="w-3 h-3" style={{ color: getEnergyColor(energy) }} />
            <span className="text-[11px] font-bold" style={{ color: getEnergyColor(energy) }}>
              {energy}%
            </span>
          </span>
        </div>
      </div>

      {/* Badge */}
      <div
        className="flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
        style={{
          background: `${rarityColor.replace(')', ' / 0.15)')}`,
          color: rarityColor,
          border: `1px solid ${rarityColor.replace(')', ' / 0.3)')}`
        }}
      >
        {isElite ? 'Elite' : 'Bom'}
      </div>
    </button>
  );
};

export const PlayerBubble = (props: PlayerBubbleProps) => {
  const variant = props.variant || "field";
  return variant === "field" ? <FieldBubble {...props} /> : <ReserveBubble {...props} />;
};
