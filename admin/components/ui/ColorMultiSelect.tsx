"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronDown } from "lucide-react";
import { fetchColors, Color } from "@/lib/api";

interface ColorMultiSelectProps {
  label?: string;
  value: string[];           // array of color IDs
  onChange: (ids: string[]) => void;
}

export default function ColorMultiSelect({ label, value, onChange }: ColorMultiSelectProps) {
  const { data: colors = [] } = useQuery<Color[]>({ queryKey: ["colors"], queryFn: fetchColors });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = colors.filter((c) => value.includes(c.id));
  const filtered = colors.filter(
    (c) =>
      !value.includes(c.id) &&
      c.nameFr.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
      setSearch("");
    }
  };

  const remove = (id: string) => onChange(value.filter((v) => v !== id));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0) toggle(filtered[0].id);
    }
    if (e.key === "Escape") {
      setOpen(false);
      setSearch("");
    }
    if (e.key === "Backspace" && !search && selected.length > 0) {
      remove(selected[selected.length - 1].id);
    }
  };

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-gray-600">{label}</label>
      )}

      {/* Input box */}
      <div
        className={`flex flex-wrap items-center gap-1.5 min-h-[40px] px-3 py-1.5 border rounded-lg bg-white cursor-text transition-all ${
          open ? "border-amber-400 ring-2 ring-amber-400/30" : "border-gray-300"
        }`}
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        {/* Selected tags */}
        {selected.map((c) => (
          <span
            key={c.id}
            className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-full"
          >
            <span
              className="w-3 h-3 rounded-full border border-amber-300 flex-shrink-0"
              style={{ backgroundColor: c.hex }}
            />
            {c.nameFr}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(c.id); }}
              className="hover:text-red-500 transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}

        {/* Search input */}
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? "Chercher une couleur…" : ""}
          className="flex-1 min-w-24 outline-none text-sm bg-transparent text-gray-700 placeholder-gray-400"
        />

        <ChevronDown
          size={14}
          className={`text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="relative z-50">
          <div className="absolute top-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400 italic">
                {colors.length === 0 ? "Aucune couleur disponible" : "Aucun résultat"}
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-800 transition-colors text-left"
                >
                  <span
                    className="w-5 h-5 rounded-md border border-gray-200 flex-shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="font-medium">{c.nameFr}</span>
                  <span className="ml-auto font-mono text-xs text-gray-400">{c.hex}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
