import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

/**
 * Detects if a match was abandoned (page reload / close during match).
 * On mount, checks localStorage for `inMatch`. If true, shows defeat modal.
 */
export const AbandonDetector = ({ teamName, onDismiss }: { teamName: string; onDismiss: () => void }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const wasInMatch = localStorage.getItem("inMatch");
    const abandonedTeam = localStorage.getItem("inMatch_team");
    if (wasInMatch === "true" && abandonedTeam === teamName) {
      // Register defeat
      try {
        const { getNextUserMatch, saveMatchResultLocal, flushPendingWrites } = require("@/utils/localChampionship");
        const nextMatch = getNextUserMatch(teamName);
        if (nextMatch) {
          const userIsHome = nextMatch.home_team_name === teamName;
          // Derrota: 0x3
          const dbHome = userIsHome ? 0 : 3;
          const dbAway = userIsHome ? 3 : 0;
          saveMatchResultLocal(teamName, nextMatch.id, dbHome, dbAway);
          flushPendingWrites();
        }
      } catch {
        // silent
      }
      localStorage.removeItem("inMatch");
      localStorage.removeItem("inMatch_team");
      setShow(true);
    }
  }, [teamName]);

  if (!show) return null;

  return (
    <AlertDialog open={show} onOpenChange={() => { setShow(false); onDismiss(); }}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-700 max-w-sm mx-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-400 text-center text-lg">
            Partida Abandonada
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400 text-center text-sm">
            Você abandonou a partida anterior. Resultado registrado como <span className="text-red-400 font-bold">Derrota (0x3)</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction
            onClick={() => { setShow(false); onDismiss(); }}
            className="bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            Entendido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
