import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StandingsTable } from "@/components/StandingsTable";
import { LibertadoresGroups } from "@/components/LibertadoresGroups";
import { ChevronLeft, ChevronDown, ChevronUp, Check } from "lucide-react";
import { useLibertadores } from "@/hooks/useLibertadores";
import { useChampionship } from "@/hooks/useChampionship";

type Competition = "brasileirao" | "libertadores";

const competitions = [
  { id: "brasileirao" as Competition, label: "Brasileirão" },
  { id: "libertadores" as Competition, label: "Libertadores" },
];

const Standings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamName = searchParams.get("time") || "Botafogo";

  const [selected, setSelected] = useState<Competition>("brasileirao");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { championship } = useChampionship(teamName);

  useEffect(() => { document.title = "Classificação | Gerenciador"; }, []);
  const { groups, loading: libertLoading, preLibertadoresResults } = useLibertadores(teamName, championship?.id);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBack = () => {
    navigate(`/jogo?time=${teamName}`);
  };

  const currentLabel = competitions.find((c) => c.id === selected)!.label;

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      <header className="border-b border-border bg-black flex-shrink-0">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="text-lg font-bold text-white">{currentLabel}</span>
              {dropdownOpen ? (
                <ChevronUp className="w-5 h-5 text-white/60" />
              ) : (
                <ChevronDown className="w-5 h-5 text-white/60" />
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 top-full mt-2 z-50 w-52 rounded-xl border border-border bg-[#1a1a1a] shadow-lg overflow-hidden">
                {competitions.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => {
                      setSelected(comp.id);
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors"
                  >
                    {selected === comp.id ? (
                      <Check className="w-4 h-4 text-[#c8ff00]" />
                    ) : (
                      <span className="w-4" />
                    )}
                    <span className="text-white font-medium text-sm">
                      {comp.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-4">
          {selected === "brasileirao" ? (
            <StandingsTable />
          ) : (
            <LibertadoresGroups 
              groups={groups} 
              loading={libertLoading}
              preLibertadoresResults={preLibertadoresResults}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Standings;
