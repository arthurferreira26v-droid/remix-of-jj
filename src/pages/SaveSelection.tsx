import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, FolderOpen, Trash2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GameSave {
  id: string;
  slot_number: number;
  club_name: string;
  season: string;
  updated_at: string;
}

const SaveSelection = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [saves, setSaves] = useState<GameSave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaves, setShowSaves] = useState(false);
  const [deletingSlot, setDeletingSlot] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSaves();
    }
  }, [user]);

  const fetchSaves = async () => {
    try {
      const { data, error } = await supabase
        .from("game_saves")
        .select("id, slot_number, club_name, season, updated_at")
        .order("slot_number", { ascending: true });

      if (error) throw error;
      setSaves(data || []);
    } catch (error) {
      console.error("Error fetching saves:", error);
      toast.error("Erro ao carregar saves");
    } finally {
      setLoading(false);
    }
  };

  const handleNewGame = () => {
    navigate("/selecionar-time");
  };

  const handleLoadSave = (save: GameSave) => {
    navigate(`/jogo?time=${save.club_name}&loadSlot=${save.slot_number}`);
  };

  const handleDeleteSave = async (slotNumber: number) => {
    setDeletingSlot(slotNumber);
    try {
      const { error } = await supabase
        .from("game_saves")
        .delete()
        .eq("slot_number", slotNumber)
        .eq("user_id", user?.id);

      if (error) throw error;
      
      toast.success("Save deletado com sucesso!");
      fetchSaves();
    } catch (error) {
      console.error("Error deleting save:", error);
      toast.error("Erro ao deletar save");
    } finally {
      setDeletingSlot(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Você saiu da sua conta");
    navigate("/auth");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Gerenciador</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {!showSaves ? (
            /* Initial Choice */
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Bem-vindo de volta!
                </h2>
                <p className="text-muted-foreground">
                  O que você gostaria de fazer?
                </p>
              </div>

              <Button
                onClick={handleNewGame}
                className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-2xl shadow-lg shadow-primary/20 transition-all duration-200 active:scale-[0.98]"
              >
                <Plus className="w-6 h-6 mr-3" />
                Novo Jogo
              </Button>

              <Button
                onClick={() => setShowSaves(true)}
                disabled={saves.length === 0}
                className="w-full h-16 bg-muted hover:bg-muted/80 text-foreground font-bold text-lg rounded-2xl border border-border transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FolderOpen className="w-6 h-6 mr-3" />
                Carregar Save
                {saves.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-sm rounded-full">
                    {saves.length}
                  </span>
                )}
              </Button>

              {saves.length === 0 && (
                <p className="text-center text-muted-foreground text-sm">
                  Você ainda não possui saves salvos
                </p>
              )}
            </div>
          ) : (
            /* Save List */
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  Seus Saves
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSaves(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Voltar
                </Button>
              </div>

              <div className="space-y-3">
                {saves.map((save) => (
                  <div
                    key={save.id}
                    className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition-colors"
                  >
                    <button
                      onClick={() => handleLoadSave(save)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-primary font-bold">
                            {save.slot_number}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-foreground font-semibold">
                            {save.club_name}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            Temporada {save.season} • {format(new Date(save.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSave(save.slot_number)}
                      disabled={deletingSlot === save.slot_number}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      {deletingSlot === save.slot_number ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaveSelection;
