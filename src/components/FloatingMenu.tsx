import { Menu } from "lucide-react";

interface FloatingMenuProps {
  onClick: () => void;
}

export const FloatingMenu = ({ onClick }: FloatingMenuProps) => {
  return (
    <button
      onClick={onClick}
      className="fixed top-4 right-4 z-50 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-95"
    >
      <Menu className="h-6 w-6 text-black" />
    </button>
  );
};
