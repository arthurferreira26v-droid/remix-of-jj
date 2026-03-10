import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { teams } from "@/data/teams";
import { generateTeamPlayers, Player } from "@/data/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogOut, Plus, Pencil, Trash2, Shield, Globe, Search, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminData, invalidateAdminCache } from "@/hooks/useAdminData";

const POSITIONS = ["GOL", "LD", "LE", "ZAG", "VOL", "MC", "MEI", "MD", "ME", "PD", "PE", "ATA", "ALE", "ALD"];

const countryFlags: Record<string, string> = {
  brasil: "🇧🇷", argentina: "🇦🇷", uruguai: "🇺🇾", colombia: "🇨🇴",
  chile: "🇨🇱", paraguai: "🇵🇾", equador: "🇪🇨", peru: "🇵🇪",
  bolivia: "🇧🇴", venezuela: "🇻🇪",
};

const getDefaultPlayers = (teamId: string): Player[] => {
  return generateTeamPlayers(teams.find((t) => t.id === teamId)?.name ?? teamId);
};

const emptyPlayer = (): Omit<Player, "id"> & { altPositions: string[] } => ({
  name: "", number: 1, position: "ATA", altPositions: [], overall: 75, age: 22, isStarter: false, marketValue: undefined as number | undefined, yellowCardChance: undefined as number | undefined,
});

const AdminPanel = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { allPlayers, teamLogos, loading: adminLoading, saveTeamPlayers, saveTeamLogo } = useAdminData();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showLogoDialog, setShowLogoDialog] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  // Modals
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deletePlayer, setDeletePlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState<Omit<Player, "id"> & { altPositions: string[] }>(emptyPlayer());

  // Auth guard
  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") !== "true") {
      navigate("/admin-login");
    }
  }, [navigate]);

  const brazilianTeams = useMemo(() => teams.filter((t) => t.league === "brasileiro"), []);
  const continentalTeams = useMemo(() => teams.filter((t) => t.league === "continental"), []);

  const getPlayers = (teamId: string): Player[] => {
    if (allPlayers[teamId]) return allPlayers[teamId];
    return getDefaultPlayers(teamId);
  };

  const currentPlayers = selectedTeamId ? getPlayers(selectedTeamId) : [];
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  const updateTeamPlayers = (teamId: string, players: Player[]) => {
    saveTeamPlayers(teamId, players);
  };

  // Add
  const handleAdd = () => {
    if (!selectedTeamId) return;
    setFormData(emptyPlayer());
    setIsAdding(true);
  };

  const confirmAdd = () => {
    if (!selectedTeamId || !formData.name.trim()) {
      toast.error("Preencha o nome do jogador"); return;
    }
    const newPlayer: Player = { ...formData, id: crypto.randomUUID() };
    updateTeamPlayers(selectedTeamId, [...currentPlayers, newPlayer]);
    setIsAdding(false);
    toast.success(`${formData.name} adicionado`);
  };

  // Edit
  const handleEdit = (p: Player) => {
    setFormData({ name: p.name, number: p.number, position: p.position, altPositions: p.altPositions || [], overall: p.overall, age: p.age, isStarter: p.isStarter, marketValue: p.marketValue, yellowCardChance: p.yellowCardChance });
    setEditPlayer(p);
  };

  const confirmEdit = () => {
    if (!selectedTeamId || !editPlayer) return;
    const updated = currentPlayers.map((p) => (p.id === editPlayer.id ? { ...p, ...formData } : p));
    updateTeamPlayers(selectedTeamId, updated);
    setEditPlayer(null);
    toast.success(`${formData.name} atualizado`);
  };

  // Delete
  const confirmDelete = () => {
    if (!selectedTeamId || !deletePlayer) return;
    updateTeamPlayers(selectedTeamId, currentPlayers.filter((p) => p.id !== deletePlayer.id));
    toast.success(`${deletePlayer.name} removido`);
    setDeletePlayer(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    navigate("/auth");
  };

  const getTeamDisplayLogo = (teamId: string) => {
    return teamLogos[teamId] || teams.find(t => t.id === teamId)?.logo || "/placeholder.svg";
  };

  const handleLogoClick = () => {
    if (!selectedTeamId) return;
    setLogoUrl(teamLogos[selectedTeamId] || "");
    setShowLogoDialog(true);
  };

  const confirmLogoChange = () => {
    if (!selectedTeamId || !logoUrl.trim()) {
      toast.error("Insira uma URL válida");
      return;
    }
    saveTeamLogo(selectedTeamId, logoUrl.trim());
    setShowLogoDialog(false);
    toast.success("Escudo atualizado!");
  };

  const filteredBrazilian = brazilianTeams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
  const filteredContinental = continentalTeams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  const formatCurrency = (v: number) => `R$ ${(v / 1_000_000).toFixed(1)}M`;

  const marketValue = (p: Player) => {
    if (p.marketValue) return p.marketValue;
    const ovr = p.overall;
    if (ovr >= 85) return 50_000_000;
    if (ovr >= 80) return 25_000_000;
    if (ovr >= 75) return 10_000_000;
    return 3_000_000;
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <div className="w-72 border-r border-zinc-800 flex flex-col bg-zinc-950">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h1 className="text-lg font-bold text-amber-500">⚙️ Admin Editor</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-zinc-400 hover:text-white">
            <LogOut size={18} />
          </Button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Buscar clube..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-zinc-900 border-zinc-700 text-white text-sm rounded-lg"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {/* Brazilian */}
          <div className="px-3 pt-3 pb-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              <Shield size={14} className="text-green-500" /> Clubes Brasileiros
            </div>
            {filteredBrazilian.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTeamId(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                  selectedTeamId === t.id
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white border border-transparent"
                }`}
              >
                <img src={getTeamDisplayLogo(t.id)} alt="" className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                <span className="truncate">{t.name}</span>
                <span className="ml-auto text-xs text-zinc-500">🇧🇷</span>
              </button>
            ))}
          </div>

          {/* Continental */}
          <div className="px-3 pt-4 pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              <Globe size={14} className="text-blue-400" /> Clubes Sul-Americanos
            </div>
            {filteredContinental.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTeamId(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                  selectedTeamId === t.id
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white border border-transparent"
                }`}
              >
                <img src={getTeamDisplayLogo(t.id)} alt="" className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                <span className="truncate">{t.name}</span>
                <span className="ml-auto text-xs text-zinc-500">{countryFlags[t.country ?? ""] ?? "🌎"}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedTeamId && selectedTeam ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div className="flex items-center gap-4">
                <button onClick={handleLogoClick} className="relative group" title="Clique para alterar o escudo">
                  <img src={getTeamDisplayLogo(selectedTeamId)} alt="" className="w-12 h-12 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                  <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Pencil size={16} className="text-white" />
                  </div>
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedTeam.name}</h2>
                  <p className="text-zinc-400 text-sm">
                    {selectedTeam.league === "brasileiro" ? "🇧🇷 Brasileiro" : `${countryFlags[selectedTeam.country ?? ""] ?? "🌎"} ${selectedTeam.country ?? "Continental"}`}
                    {" · "}{currentPlayers.length} jogadores
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => {
                  invalidateAdminCache();
                  toast.success("Mudanças aplicadas! Os jogadores serão atualizados ao iniciar um novo jogo.");
                }} className="bg-green-600 hover:bg-green-500 text-white font-semibold gap-2">
                  <CheckCircle2 size={18} /> Aplicar Mudanças
                </Button>
                <Button onClick={handleAdd} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-2">
                  <Plus size={18} /> Adicionar Jogador
                </Button>
              </div>
            </div>

            {/* Table */}
            <ScrollArea className="flex-1 p-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">#</TableHead>
                    <TableHead className="text-zinc-400">Nome</TableHead>
                    <TableHead className="text-zinc-400">Posição</TableHead>
                    <TableHead className="text-zinc-400">Idade</TableHead>
                    <TableHead className="text-zinc-400">OVR</TableHead>
                    <TableHead className="text-zinc-400">Valor de Mercado</TableHead>
                    <TableHead className="text-zinc-400">Valor de Venda</TableHead>
                    <TableHead className="text-zinc-400 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPlayers.map((p) => (
                    <TableRow key={p.id} className="border-zinc-800/50 hover:bg-zinc-900/50">
                      <TableCell className="text-zinc-500 font-mono text-xs">{p.number}</TableCell>
                      <TableCell className="text-white font-medium">{p.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-semibold">
                            {p.position}
                          </span>
                          {p.altPositions?.map((alt) => (
                            <span key={alt} className="px-2 py-0.5 rounded bg-zinc-700/50 text-amber-400 text-xs font-semibold">
                              {alt}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-300">{p.age}</TableCell>
                      <TableCell>
                        <span className={`font-bold ${p.overall >= 80 ? "text-green-400" : p.overall >= 75 ? "text-amber-400" : "text-zinc-400"}`}>
                          {p.overall}
                        </span>
                      </TableCell>
                      <TableCell className="text-zinc-300">{formatCurrency(marketValue(p))}</TableCell>
                      <TableCell className="text-zinc-300">{formatCurrency(marketValue(p) * 1.2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="text-zinc-400 hover:text-amber-500 h-8 w-8">
                            <Pencil size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletePlayer(p)} className="text-zinc-400 hover:text-red-500 h-8 w-8">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Shield className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-zinc-500 mb-2">Selecione um clube</h2>
              <p className="text-zinc-600 text-sm">Escolha um clube na lista à esquerda para gerenciar o elenco</p>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isAdding || !!editPlayer} onOpenChange={(open) => { if (!open) { setIsAdding(false); setEditPlayer(null); } }}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{isAdding ? "Adicionar Jogador" : "Editar Jogador"}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {isAdding ? "Preencha os dados do novo jogador" : `Editando ${editPlayer?.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Nome</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Posição</Label>
                <Select value={formData.position} onValueChange={(v) => setFormData({ ...formData, position: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos} className="text-white">{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Número</Label>
                <Input type="number" value={formData.number} onChange={(e) => setFormData({ ...formData, number: +e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Overall</Label>
                <Input type="number" min={40} max={99} value={formData.overall} onChange={(e) => setFormData({ ...formData, overall: +e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Idade</Label>
                <Input type="number" min={15} max={45} value={formData.age} onChange={(e) => setFormData({ ...formData, age: +e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Posições Alternativas</Label>
              <div className="flex flex-wrap gap-1.5">
                {POSITIONS.filter((pos) => pos !== formData.position).map((pos) => {
                  const isSelected = formData.altPositions?.includes(pos);
                  return (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => {
                        const alts = formData.altPositions || [];
                        setFormData({
                          ...formData,
                          altPositions: isSelected ? alts.filter((p) => p !== pos) : [...alts, pos],
                        });
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        isSelected
                          ? "bg-amber-500 text-black"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                      }`}
                    >
                      {pos}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Valor de Mercado (R$)</Label>
              <Input
                type="number"
                min={0}
                placeholder="Auto (baseado no OVR)"
                value={formData.marketValue ?? ""}
                onChange={(e) => setFormData({ ...formData, marketValue: e.target.value ? +e.target.value : undefined })}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <p className="text-zinc-500 text-[11px]">Deixe vazio para calcular automaticamente pelo OVR</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Chance de Cartão Amarelo (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder={`Auto (${(() => {
                  const pos = formData.position;
                  if (pos === 'GOL') return '3';
                  if (['ZAG','LE','LD'].includes(pos)) return '27';
                  if (['MC','VOL','MEI','MD','ME'].includes(pos)) return '20';
                  if (['ATA','PE','PD'].includes(pos)) return '10';
                  return '15';
                })()}% pela posição)`}
                value={formData.yellowCardChance ?? ""}
                onChange={(e) => setFormData({ ...formData, yellowCardChance: e.target.value ? +e.target.value : undefined })}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <p className="text-zinc-500 text-[11px]">Deixe vazio para usar o padrão da posição</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isStarter}
                onChange={(e) => setFormData({ ...formData, isStarter: e.target.checked })}
                className="rounded border-zinc-600"
              />
              <Label className="text-zinc-300 text-sm">Titular</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setIsAdding(false); setEditPlayer(null); }} className="text-zinc-400">Cancelar</Button>
            <Button onClick={isAdding ? confirmAdd : confirmEdit} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
              {isAdding ? "Adicionar" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePlayer} onOpenChange={(open) => { if (!open) setDeletePlayer(null); }}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remover jogador</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Tem certeza que deseja remover <span className="text-white font-semibold">{deletePlayer?.name}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-500 text-white">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logo Change Dialog */}
      <Dialog open={showLogoDialog} onOpenChange={setShowLogoDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Escudo</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Envie uma imagem da galeria ou cole uma URL
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {logoUrl && (
              <div className="flex justify-center">
                <img src={logoUrl} alt="Preview" className="w-20 h-20 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
              </div>
            )}
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const dataUrl = ev.target?.result as string;
                    setLogoUrl(dataUrl);
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600"
                variant="outline"
              >
                📁 Escolher da Galeria
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-zinc-700" />
                <span className="text-zinc-500 text-xs">ou</span>
                <div className="flex-1 h-px bg-zinc-700" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">URL do Escudo</Label>
                <Input
                  value={logoUrl.startsWith("data:") ? "" : logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://exemplo.com/escudo.png"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowLogoDialog(false)} className="text-zinc-400">Cancelar</Button>
            <Button onClick={confirmLogoChange} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
