import { useState } from "react";
import { Menu, Users, TrendingUp, Briefcase, Calendar, Trophy, LogOut, X, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

interface GameMenuProps {
  teamName: string;
  onManageSquad?: () => void;
  onTransferMarket?: () => void;
  onFinances?: () => void;
  onExit?: () => void;
  offersCount?: number;
  onReceivedOffers?: () => void;
}

const menuItemsData = (
  teamName: string,
  navigate: ReturnType<typeof useNavigate>,
  handlers: Pick<GameMenuProps, "onManageSquad" | "onTransferMarket" | "onFinances" | "onExit" | "onReceivedOffers">,
  offersCount: number
) => [
  { icon: Trophy, label: "Classificação", onClick: () => navigate(`/classificacao?time=${teamName}`) },
  { icon: Users, label: "Elenco", onClick: handlers.onManageSquad },
  { icon: TrendingUp, label: "Transferências", onClick: handlers.onTransferMarket },
  { icon: Inbox, label: "Ofertas", onClick: handlers.onReceivedOffers, badge: offersCount },
  { icon: Calendar, label: "Calendário", onClick: () => navigate(`/calendario?time=${teamName}`) },
  { icon: Briefcase, label: "Finanças", onClick: handlers.onFinances },
  { icon: LogOut, label: "Sair", onClick: handlers.onExit, isDestructive: true },
];

export const GameMenu = ({
  teamName,
  onManageSquad,
  onTransferMarket,
  onFinances,
  onExit,
}: GameMenuProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = menuItemsData(teamName, navigate, { onManageSquad, onTransferMarket, onFinances, onExit });

  const handleItemClick = (onClick?: () => void) => {
    setOpen(false);
    onClick?.();
  };

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Menu items - stacked from bottom-right, above FAB */}
      <AnimatePresence>
        {open && items.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
            className="fixed right-6 z-50 flex items-center gap-3"
            style={{ bottom: `${(items.length - index) * 60 + 36}px` }}
          >
            {/* Label pill */}
            <span
              className="text-[13px] font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap"
              style={{
                background: 'hsl(0 0% 100%)',
                color: 'hsl(0 0% 15%)',
              }}
            >
              {item.label}
            </span>

            {/* Circle icon */}
            <button
              onClick={() => handleItemClick(item.onClick)}
              className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              style={{
                background: item.isDestructive ? 'hsl(0 70% 50%)' : 'hsl(0 0% 7%)',
              }}
            >
              <item.icon className="w-[18px] h-[18px] text-white" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] active:scale-95 transition-all duration-200"
        style={{ background: 'hsl(0 0% 5%)' }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-5 h-5 text-white" />
            </motion.div>
          ) : (
            <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Menu className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </>
  );
};
