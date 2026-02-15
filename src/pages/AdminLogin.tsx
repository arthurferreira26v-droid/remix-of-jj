import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const ADMIN_PASS = "8751";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASS) {
      sessionStorage.setItem("admin_auth", "true");
      navigate("/admin-panel");
    } else {
      toast.error("Acesso negado");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-black to-zinc-900 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 border border-zinc-800/50 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Área de Funcionários</h1>
            <p className="text-zinc-400 text-sm">Acesso restrito</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-pass" className="text-zinc-300 text-sm font-medium">
                Senha
              </Label>
              <Input
                id="admin-pass"
                type="password"
                placeholder="••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 rounded-xl focus:border-amber-500/50 focus:ring-amber-500/20 transition-all duration-200"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-amber-500 text-black hover:bg-amber-400 font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all duration-200 active:scale-[0.98]"
            >
              Entrar
            </Button>
          </form>

          <button
            onClick={() => navigate("/auth")}
            className="mt-6 w-full flex items-center justify-center gap-2 text-zinc-400 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar ao Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
