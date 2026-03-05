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
}

/** Energy color based on percentage */
const getEnergyColor = (energy: number) => {
  if (energy >= 70) return "hsl(142 70% 50%)";
  if (energy >= 40) return "hsl(45 100% 50%)";
  return "hsl(0 80% 55%)";
};

/** Field variant: small circle with OVR + name label + horizontal energy bar */
const FieldBubble = ({ player, isSelected, isInPosition = true, role, onClick, showEnergyBar = true }: PlayerBubbleProps) => {
  const energy = player.energy ?? 100;

  return (
    <div
      className={`flex flex-col items-center gap-0.5 ${onClick ? "cursor-pointer" : ""} ${isSelected ? "scale-110 z-10" : ""}`}
      onClick={onClick}
    >
      {/* OVR circle */}
      <div className="relative">
        <div className={`w-10 h-10 border-2 rounded-full flex items-center justify-center shadow-lg ${
          isSelected 
            ? "bg-[#c8ff00] border-[#c8ff00]" 
            : "bg-black/90 border-white/80"
        }`}>
          <span className={`text-sm font-bold ${isSelected ? "text-black" : "text-white"}`}>{player.overall}</span>
        </div>

        {!isInPosition && (
          <div className="absolute -top-1 -left-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center shadow-md border border-white">
            <span className="text-black text-[9px] font-bold">!</span>
          </div>
        )}
      </div>

      {/* Name */}
      <div className="bg-black/70 px-1.5 py-0.5 rounded text-white text-[8px] font-medium whitespace-nowrap">
        {player.name}
      </div>

      {/* Position role tag */}
      {role && (
        <div className={`px-1.5 py-0 rounded text-[7px] font-bold whitespace-nowrap ${
          isInPosition ? 'bg-white/20 text-white/80' : 'bg-yellow-500/30 text-yellow-300'
        }`}>
          {role}
        </div>
      )}

      {/* Horizontal energy bar below position */}
      {showEnergyBar && (
        <div
          className="w-10 h-[5px] rounded-sm overflow-hidden mt-0.5"
          style={{
            background: 'hsl(0 0% 20%)',
            boxShadow: '0 0 0 1px hsl(0 0% 0%)',
            borderRadius: '3px',
          }}
        >
          <div
            className="h-full rounded-sm"
            style={{
              width: `${energy}%`,
              background: getEnergyColor(energy),
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
  const energy = player.energy ?? 100;

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
