import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface ExitConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export const ExitConfirmModal = ({
  open,
  onCancel,
  onConfirm,
  title = "Sair do jogo?",
  description = "Tem certeza que deseja sair? Você perderá o progresso não salvo.",
}: ExitConfirmModalProps) => (
  <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
    <AlertDialogContent className="bg-zinc-900 border-zinc-700 max-w-sm mx-auto">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-white text-center text-lg">{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-zinc-400 text-center text-sm">
          {description}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="flex-row gap-3 sm:justify-center">
        <AlertDialogCancel
          onClick={onCancel}
          className="flex-1 bg-zinc-800 border-zinc-600 text-white hover:bg-zinc-700"
        >
          Cancelar
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
        >
          Sair
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
