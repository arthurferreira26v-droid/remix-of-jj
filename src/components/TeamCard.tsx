interface TeamCardProps {
  name: string;
  logo: string;
  rating: number;
  onClick: () => void;
}

const PointedStar = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2L14.9 8.6L22 9.3L16.8 14L18.2 21L12 17.3L5.8 21L7.2 14L2 9.3L9.1 8.6L12 2Z"
      fill={filled ? "#facc15" : "rgba(255,255,255,0.12)"}
      stroke={filled ? "#facc15" : "rgba(255,255,255,0.12)"}
      strokeWidth="0.5"
    />
  </svg>
);

export const TeamCard = ({ name, logo, rating, onClick }: TeamCardProps) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center bg-card rounded-xl p-3 py-4 active:scale-[0.97] transition-transform duration-150 cursor-pointer border border-border/50"
    >
      <div className="w-14 h-14 flex items-center justify-center mb-2">
        <img
          src={logo}
          alt={name}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      <span className="text-[11px] font-bold text-foreground text-center uppercase leading-tight tracking-wide line-clamp-1 w-full mb-1.5">
        {name}
      </span>

      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <PointedStar key={i} filled={i < rating} />
        ))}
      </div>
    </button>
  );
};
