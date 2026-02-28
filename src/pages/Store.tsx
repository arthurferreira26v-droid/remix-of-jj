import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Store = () => {
  const navigate = useNavigate();

  useEffect(() => { document.title = "Loja | Gerenciador"; }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-12">
        <button
          onClick={() => navigate("/")}
          className="self-start mb-8 p-2 -ml-2 text-black/60 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="text-[28px] font-bold text-black mb-16">
          Loja
        </h1>
      </div>
    </div>
  );
};

export default Store;
