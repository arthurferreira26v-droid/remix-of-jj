import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useCloudSaveLoad,
  type CloudSaveParams,
  type CloudSaveData,
} from "@/hooks/useCloudSaveLoad";
import { formatMarketValue } from "@/utils/marketValue";
import {
  Save,
  Download,
  Trash2,
  Clock,
  Users,
  Trophy,
  Calendar,
  Loader2,
  Sparkles,
  Shield,
  TrendingUp,
  ChevronRight,
  Cloud,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "save" | "load";
  currentGameData?: CloudSaveParams;
  onLoadComplete?: (data: CloudSaveData) => void;
}

type UISaveData = {
  clubName: string;
  season: string;
  budget: number;
  players: unknown[];
  currentRound?: number;
  savedAt: string;
};

type UISaveSlot = {
  id: string;
  slotNumber: number;
  isEmpty: boolean;
  saveData: UISaveData | null;
};

const toUiSlots = (
  slots: Awaited<ReturnType<ReturnType<typeof useCloudSaveLoad>["getSaveSlots"]>>,
): UISaveSlot[] => {
  return slots.map((s) => {
    if (!s.saveData) {
      return {
        id: `slot_${s.slotNumber}`,
        slotNumber: s.slotNumber,
        isEmpty: true,
        saveData: null,
      };
    }

    return {
      id: s.saveData.id,
      slotNumber: s.slotNumber,
      isEmpty: false,
      saveData: {
        clubName: s.saveData.club_name,
        season: s.saveData.season,
        budget: s.saveData.budget,
        players: (s.saveData.players as unknown[]) ?? [],
        currentRound: s.saveData.current_round ?? undefined,
        savedAt: s.saveData.updated_at ?? s.saveData.created_at,
      },
    };
  });
};

export function SaveLoadModal({
  isOpen,
  onClose,
  mode,
  currentGameData,
  onLoadComplete,
}: SaveLoadModalProps) {
  const { loading, saveGame, loadGame, deleteSave, getSaveSlots } =
    useCloudSaveLoad();

  const [localSlots, setLocalSlots] = useState<UISaveSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedSlot(null);

    let isActive = true;
    (async () => {
      const fresh = await getSaveSlots();
      if (!isActive) return;
      setLocalSlots(toUiSlots(fresh));
    })();

    return () => {
      isActive = false;
    };
  }, [isOpen, getSaveSlots]);

  const handleSave = async (slotNumber: number) => {
    if (!currentGameData) {
      toast.error("Nenhum dado de jogo disponível");
      return;
    }

    const slot = localSlots.find((s) => s.slotNumber === slotNumber);
    if (slot && !slot.isEmpty) {
      setPendingSlot(slotNumber);
      setShowOverwriteConfirm(true);
      return;
    }

    await performSave(slotNumber);
  };

  const performSave = async (slotNumber: number) => {
    if (!currentGameData) return;

    setIsSaving(true);
    const success = await saveGame(slotNumber, currentGameData);
    setIsSaving(false);

    if (success) {
      toast.success("Jogo salvo com sucesso!", {
        icon: <Check className="h-4 w-4 text-primary" />,
      });
      const fresh = await getSaveSlots();
      setLocalSlots(toUiSlots(fresh));
      setTimeout(() => onClose(), 500);
    }
  };

  const handleLoad = async (slotNumber: number) => {
    const data = await loadGame(slotNumber);
    if (data) {
      sessionStorage.setItem(`loaded_save_${data.club_name}`, "true");

      toast.success("Jogo carregado!", {
        icon: <Download className="h-4 w-4 text-primary" />,
      });
      onLoadComplete?.(data);
      onClose();
    }
  };

  const handleDelete = (slotNumber: number) => {
    setPendingSlot(slotNumber);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (pendingSlot === null) return;

    const success = await deleteSave(pendingSlot);
    if (success) {
      toast.success("Save excluído");
      const fresh = await getSaveSlots();
      setLocalSlots(toUiSlots(fresh));
    }

    setShowDeleteConfirm(false);
    setPendingSlot(null);
  };

  const confirmOverwrite = async () => {
    if (pendingSlot === null) return;
    await performSave(pendingSlot);
    setShowOverwriteConfirm(false);
    setPendingSlot(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getSlotGradient = (slotNumber: number, isEmpty: boolean) => {
    if (isEmpty) return "from-muted/30 to-muted/10";
    const gradients = [
      "from-primary/20 via-primary/10 to-transparent",
      "from-blue-500/20 via-blue-500/10 to-transparent",
      "from-purple-500/20 via-purple-500/10 to-transparent",
      "from-orange-500/20 via-orange-500/10 to-transparent",
      "from-pink-500/20 via-pink-500/10 to-transparent",
    ];
    return gradients[(slotNumber - 1) % gradients.length];
  };

  const getSlotAccent = (slotNumber: number) => {
    const accents = [
      "border-primary/50 shadow-primary/20",
      "border-blue-500/50 shadow-blue-500/20",
      "border-purple-500/50 shadow-purple-500/20",
      "border-orange-500/50 shadow-orange-500/20",
      "border-pink-500/50 shadow-pink-500/20",
    ];
    return accents[(slotNumber - 1) % accents.length];
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl bg-gradient-to-b from-card via-card to-background border-border/50 backdrop-blur-xl p-0 gap-0 overflow-hidden">
          {/* Header */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/20" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

            <DialogHeader className="relative z-10 p-6 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-2xl ${
                    mode === "save" ? "bg-primary/20" : "bg-blue-500/20"
                  }`}
                >
                  {mode === "save" ? (
                    <Cloud className="h-6 w-6 text-primary" />
                  ) : (
                    <Download className="h-6 w-6 text-blue-400" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-foreground">
                    {mode === "save" ? "Salvar Progresso" : "Carregar Jogo"}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {mode === "save"
                      ? "Escolha um slot para salvar seu progresso"
                      : "Selecione um save para continuar jogando"}
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Slots Container */}
          <div className="p-6 pt-2 space-y-3 max-h-[60vh] overflow-y-auto scrollbar-hide">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-muted-foreground text-sm">Carregando saves...</p>
              </div>
            ) : (
              localSlots.map((slot) => (
                <div
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.slotNumber)}
                  className={`
                    group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer
                    ${
                      slot.isEmpty
                        ? "border-dashed border-border/50 hover:border-border"
                        : `border-solid ${getSlotAccent(
                            slot.slotNumber,
                          )} shadow-lg hover:shadow-xl`
                    }
                    ${
                      selectedSlot === slot.slotNumber
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]"
                        : "hover:scale-[1.01]"
                    }
                  `}
                >
                  {/* Background Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${getSlotGradient(
                      slot.slotNumber,
                      slot.isEmpty,
                    )}`}
                  />

                  {/* Content */}
                  <div className="relative z-10 p-4">
                    <div className="flex items-center gap-4">
                      {/* Slot Icon */}
                      <div
                        className={`
                        relative flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center
                        ${
                          slot.isEmpty
                            ? "bg-muted/50 border-2 border-dashed border-border"
                            : "bg-gradient-to-br from-card to-muted/50 border border-border/50"
                        }
                      `}
                      >
                        {slot.isEmpty ? (
                          <Save className="h-6 w-6 text-muted-foreground/50" />
                        ) : (
                          <>
                            <Shield className="h-7 w-7 text-foreground" />
                            {slot.slotNumber === 1 && (
                              <div className="absolute -top-1 -right-1 p-1 bg-primary rounded-full">
                                <Sparkles className="h-3 w-3 text-primary-foreground" />
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Slot {slot.slotNumber}
                          </span>
                          {slot.slotNumber === 1 && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary/20 text-primary border border-primary/30">
                              Auto-Save
                            </span>
                          )}
                        </div>

                        {slot.isEmpty ? (
                          <p className="text-muted-foreground text-sm">
                            Slot disponível para salvar
                          </p>
                        ) : slot.saveData && (
                          <>
                            <h3 className="text-lg font-bold text-foreground truncate">
                              {slot.saveData.clubName}
                            </h3>

                            {/* Stats Row */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{formatDate(slot.saveData.savedAt)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Users className="h-3.5 w-3.5" />
                                <span>
                                  {slot.saveData.players.length} jogadores
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <TrendingUp className="h-3.5 w-3.5" />
                                <span>{formatMarketValue(slot.saveData.budget)}</span>
                              </div>
                            </div>

                            {/* Season Info */}
                            {slot.saveData.currentRound && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card/80 border border-border/50">
                                  <Calendar className="h-3 w-3 text-accent" />
                                  <span className="text-xs font-medium text-foreground">
                                    Rodada {slot.saveData.currentRound}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card/80 border border-border/50">
                                  <Trophy className="h-3 w-3 text-accent" />
                                  <span className="text-xs font-medium text-foreground">
                                    Temporada {slot.saveData.season}
                                  </span>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {mode === "save" ? (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSave(slot.slotNumber);
                            }}
                            disabled={isSaving}
                            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-1.5" />
                                Salvar
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoad(slot.slotNumber);
                            }}
                            disabled={slot.isEmpty}
                            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 disabled:opacity-30 disabled:shadow-none"
                          >
                            <Download className="h-4 w-4 mr-1.5" />
                            Carregar
                          </Button>
                        )}

                        {!slot.isEmpty && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(slot.slotNumber);
                            }}
                            className="h-10 w-10 p-0 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                        <ChevronRight
                          className={`h-5 w-5 text-muted-foreground/50 transition-transform ${
                            selectedSlot === slot.slotNumber ? "rotate-90" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 inline mr-1" />
                Slot 1 salva automaticamente
              </p>
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Excluir Save
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O save será excluído
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Overwrite Confirmation */}
      <AlertDialog
        open={showOverwriteConfirm}
        onOpenChange={setShowOverwriteConfirm}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-accent">
              <Save className="h-5 w-5" />
              Sobrescrever Save
            </AlertDialogTitle>
            <AlertDialogDescription>
              Este slot já contém um save. Deseja substituí-lo? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmOverwrite}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sobrescrever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
