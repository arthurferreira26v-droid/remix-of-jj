interface TeamCardProps {
  name: string;
  logo: string;
  rating: number;
  onClick: () => void;
}

export const TeamCard = ({ name, logo, onClick }: TeamCardProps) => {
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

      <span className="text-[11px] font-bold text-foreground text-center uppercase leading-tight tracking-wide line-clamp-1 w-full">
        {name}
      </span>
    </button>
  );
};
