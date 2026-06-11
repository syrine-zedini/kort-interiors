"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X } from "lucide-react";

interface AddCategoryFormProps {
  label: string;           // placeholder text
  onAdd: (name: string) => Promise<void>;
  onCancel: () => void;
}

export default function AddCategoryForm({ label, onAdd, onCancel }: AddCategoryFormProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      await onAdd(trimmed);
      onCancel();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Erreur");
      setSaving(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submit();
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKey}
          placeholder={label}
          className="flex-1 border border-blue-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          disabled={saving}
        />
        <button
          onClick={submit}
          disabled={saving || !name.trim()}
          className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-40"
          title="Ajouter"
        >
          <Check size={16} />
        </button>
        <button
          onClick={onCancel}
          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
          title="Annuler"
        >
          <X size={16} />
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1 pl-1">{error}</p>}
    </div>
  );
}
