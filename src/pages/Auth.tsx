import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).max(100),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === "email") fieldErrors.email = err.message;
          if (err.path[0] === "password") fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email ou senha incorretos");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Login realizado com sucesso!");
        navigate("/");
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Este email já está cadastrado");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Conta criada com sucesso!");
        navigate("/");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-black to-zinc-900 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 shadow-xl mb-6">
            <span className="text-3xl">⚽</span>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">
            Gerenciador
          </h1>
          <p className="text-zinc-400 text-sm">
            {isLogin ? "Entre na sua conta" : "Crie sua conta"}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 border border-zinc-800/50 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300 text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 rounded-xl focus:border-zinc-500 focus:ring-zinc-500/20 transition-all duration-200"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300 text-sm font-medium">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 rounded-xl focus:border-zinc-500 focus:ring-zinc-500/20 transition-all duration-200"
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-white text-black hover:bg-zinc-100 font-semibold rounded-xl shadow-lg shadow-white/10 transition-all duration-200 active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                "Entrar"
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800/50">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="w-full text-zinc-400 hover:text-white text-sm font-medium transition-colors duration-200"
            >
              {isLogin
                ? "Não tem conta? Cadastre-se"
                : "Já tem conta? Entre"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-600 text-xs mt-8">
          Gerencie seu time de futebol
        </p>
      </div>
    </div>
  );
};

export default Auth;