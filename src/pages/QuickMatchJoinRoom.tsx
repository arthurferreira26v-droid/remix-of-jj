import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const QuickMatchJoinRoom = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const maxLength = 6;

  useEffect(() => { document.title = "Entrar em Sala | Jogo Rápido"; }, []);

  const handleChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, maxLength);
    setCode(cleaned);
    setError("");
  };

  const handleConfirm = async () => {
    if (code.length < maxLength || checking) return;
    setChecking(true);
    setError("");

    const { data, error: dbError } = await supabase
      .from("quick_match_rooms" as any)
      .select("code")
      .eq("code", code)
      .maybeSingle();

    setChecking(false);

    if (dbError || !data) {
      setError("Senha errada, tente novamente");
      return;
    }

    navigate(`/jogo-rapido/entrar/time?code=${code}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-8">
        <button
          onClick={() => navigate("/jogo-rapido")}
          className="self-start mb-6 p-2 -ml-2 text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="text-[24px] font-bold text-white mb-2 text-center">
          Digitar Código da Sala
        </h1>
        <p className="text-[13px] text-white/35 text-center mb-8">
          Insira o código de 6 dígitos
        </p>

        {/* Code display + hidden input overlay */}
        <div className="relative flex justify-center gap-2.5 mb-4">
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={code}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
            maxLength={maxLength}
            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
            style={{ fontSize: '16px', caretColor: 'transparent' }}
            autoFocus
          />
          {Array.from({ length: maxLength }).map((_, i) => (
            <div
              key={i}
              className={`w-12 h-14 rounded-xl flex items-center justify-center text-[24px] font-bold transition-all ${
                code[i]
                  ? "bg-white/[0.12] border-2 border-white/30 text-white"
                  : i === code.length
                  ? "bg-white/[0.08] border-2 border-white/20 animate-pulse"
                  : "bg-white/[0.05] border-2 border-white/[0.06] text-white/20"
              }`}
            >
              {code[i] || ""}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-center text-red-400 text-sm mt-2">{error}</p>
        )}
      </div>

      {/* Confirm button */}
      <div className="px-6 pb-8 pt-4">
        <button
          onClick={handleConfirm}
          disabled={code.length < maxLength || checking}
          className={`w-full h-16 rounded-2xl flex items-center justify-center transition-all active:scale-[0.98] ${
            code.length === maxLength
              ? "bg-white text-black font-bold"
              : "bg-white/[0.07] text-white/30 cursor-not-allowed"
          }`}
        >
          <span className="text-[20px] font-bold">
            {checking ? "Verificando..." : "Entrar"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default QuickMatchJoinRoom;
