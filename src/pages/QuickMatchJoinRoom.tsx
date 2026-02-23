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
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-8">
        {/* Back */}
        <button
          onClick={() => navigate("/jogo-rapido")}
          className="self-start mb-6 p-2 -ml-2 text-black/60 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="text-[24px] font-bold text-black mb-6 text-center">
          Digitar Código da Sala
        </h1>

        {/* Code display */}
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: maxLength }).map((_, i) => (
            <div
              key={i}
              className={`w-12 h-14 rounded-xl flex items-center justify-center text-[24px] font-bold border-2 transition-colors ${
                code[i]
                  ? "bg-white border-black text-black"
                  : i === code.length
                  ? "bg-white border-gray-400"
                  : "bg-[#e8e8e8] border-transparent text-gray-400"
              }`}
            >
              {code[i] || ""}
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-red-500 text-sm font-semibold text-center mb-4">{error}</p>
        )}

        {/* Hidden native input - opens device keyboard */}
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
          maxLength={maxLength}
          className="opacity-0 absolute h-0 w-0"
          autoFocus
        />

        {/* Tap area to focus input */}
        <button
          onClick={() => inputRef.current?.focus()}
          className="w-full py-4 text-center text-gray-400 text-sm font-medium"
        >
          Toque aqui para digitar o código
        </button>
      </div>

      {/* Confirm button */}
      <div className="px-6 pb-8 pt-4">
        <button
          onClick={handleConfirm}
          disabled={code.length < maxLength || checking}
          className={`w-full h-16 rounded-2xl flex items-center justify-center transition-colors active:scale-[0.98] ${
            code.length === maxLength
              ? "bg-[#c8ff00] hover:bg-[#b8ef00]"
              : "bg-[#e8e8e8] cursor-not-allowed"
          }`}
        >
          <span className={`text-[20px] font-bold ${code.length === maxLength ? "text-black" : "text-gray-400"}`}>
            {checking ? "Verificando..." : "Entrar"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default QuickMatchJoinRoom;
