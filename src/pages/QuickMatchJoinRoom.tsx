import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Delete } from "lucide-react";

const QuickMatchJoinRoom = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const maxLength = 6;

  useEffect(() => { document.title = "Entrar em Sala | Jogo Rápido"; }, []);

  const handleKey = (char: string) => {
    if (code.length < maxLength) setCode(prev => prev + char);
  };

  const handleDelete = () => {
    setCode(prev => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    if (code.length === maxLength) {
      navigate(`/jogo-rapido/entrar/time?code=${code}`);
    }
  };

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["A", "0", "B"],
    ["C", "D", "E"],
    ["F", "G", "H"],
    ["J", "K", "L"],
    ["M", "N", "P"],
    ["Q", "R", "S"],
    ["T", "U", "V"],
    ["W", "X", "Y"],
    ["Z"],
  ];

  // Flatten keys for a grid
  const allKeys = keys.flat();

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
        <div className="flex justify-center gap-2 mb-8">
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

        {/* Keyboard */}
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-6">
          {allKeys.map((char) => (
            <button
              key={char}
              onClick={() => handleKey(char)}
              className="h-12 bg-[#e8e8e8] hover:bg-[#ddd] rounded-xl flex items-center justify-center text-black font-bold text-lg transition-colors active:scale-95"
            >
              {char}
            </button>
          ))}
          {/* Delete button */}
          <button
            onClick={handleDelete}
            className="h-12 bg-[#e8e8e8] hover:bg-[#ddd] rounded-xl flex items-center justify-center text-black transition-colors active:scale-95 col-span-2"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Confirm button */}
      <div className="px-6 pb-8 pt-4">
        <button
          onClick={handleConfirm}
          disabled={code.length < maxLength}
          className={`w-full h-16 rounded-2xl flex items-center justify-center transition-colors active:scale-[0.98] ${
            code.length === maxLength
              ? "bg-[#c8ff00] hover:bg-[#b8ef00]"
              : "bg-[#e8e8e8] cursor-not-allowed"
          }`}
        >
          <span className={`text-[20px] font-bold ${code.length === maxLength ? "text-black" : "text-gray-400"}`}>
            Entrar
          </span>
        </button>
      </div>
    </div>
  );
};

export default QuickMatchJoinRoom;
