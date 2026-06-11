import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStyles, Style } from "@/lib/api";
import { Check, ChevronDown, X } from "lucide-react";

interface StyleMultiSelectProps {
  label?: string;
  value: string[];
  onChange: (value: string[]) => void;
}

export default function StyleMultiSelect({ label, value, onChange }: StyleMultiSelectProps) {
  const { data: styles = [], isLoading } = useQuery<Style[]>({
    queryKey: ["styles"],
    queryFn: fetchStyles,
  });

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleStyle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const removeStyle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== id));
  };

  const selectedStyles = styles.filter((s) => value.includes(s.id));

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

      <div className="relative">
        <div
          onClick={() => setOpen(!open)}
          className={`min-h-[42px] flex flex-wrap items-center gap-2 px-3 py-2 border rounded-xl bg-white cursor-pointer transition-colors ${
            open ? "border-amber-400 ring-4 ring-amber-400/20" : "border-gray-300 hover:border-gray-400"
          }`}
        >
          {selectedStyles.length > 0 ? (
            selectedStyles.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
              >
                {s.nameFr}
                <button
                  type="button"
                  onClick={(e) => removeStyle(s.id, e)}
                  className="text-gray-400 hover:text-red-500 hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400 flex-1">
              {isLoading ? "Chargement des styles..." : "Sélectionner des styles..."}
            </span>
          )}

          <div className="ml-auto flex items-center">
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </div>

        {open && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto p-2">
            {styles.length === 0 && !isLoading ? (
              <div className="p-3 text-center text-sm text-gray-500">Aucun style disponible</div>
            ) : (
              styles.map((s) => {
                const isSelected = value.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleStyle(s.id)}
                    className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">{s.nameFr}</span>
                    </div>
                    {isSelected && <Check size={16} className="text-amber-500" />}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
