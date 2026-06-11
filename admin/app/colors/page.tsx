"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Palette, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchColors, createColor, deleteColor, Color } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function ColorsPage() {
  const qc = useQueryClient();
  const { data: colors = [], isLoading } = useQuery<Color[]>({
    queryKey: ["colors"],
    queryFn: fetchColors,
  });

  const [nameFr, setNameFr] = useState("");
  const [hex, setHex] = useState("#000000");
  const [formError, setFormError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Pagination
  const totalPages = Math.ceil(colors.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedColors = colors.slice(startIndex, endIndex);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["colors"] });

  const createMut = useMutation({
    mutationFn: () => createColor(nameFr.trim(), hex),
    onSuccess: () => { invalidate(); setNameFr(""); setHex("#000000"); setFormError(null); },
    onError: (e: any) => setFormError(e?.response?.data?.message ?? "Erreur"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteColor(id),
    onSuccess: invalidate,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameFr.trim()) { setFormError("Le nom est requis"); return; }
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) { setFormError("Code HEX invalide (ex: #1B2A4A)"); return; }
    createMut.mutate();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Couleurs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {colors.length} couleur{colors.length !== 1 ? "s" : ""} enregistrée{colors.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Plus size={15} /> Ajouter une couleur
        </h2>
        <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
          {/* Nom FR */}
          <div className="flex-1 min-w-40">
            <label className="block text-xs text-gray-500 mb-1">Nom (français)</label>
            <input
              value={nameFr}
              onChange={(e) => { setNameFr(e.target.value); setFormError(null); }}
              placeholder="ex: Bleu Marine"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>

          {/* Code HEX + color picker */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Code HEX</label>
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus-within:ring-2 focus-within:ring-amber-400 focus-within:border-amber-400">
              {/* Native color input as swatch */}
              <input
                type="color"
                value={hex}
                onChange={(e) => { setHex(e.target.value.toUpperCase()); setFormError(null); }}
                className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
                title="Choisir une couleur"
              />
              <input
                value={hex}
                onChange={(e) => { setHex(e.target.value.toUpperCase()); setFormError(null); }}
                placeholder="#000000"
                className="w-24 text-sm outline-none font-mono"
                maxLength={7}
              />
            </div>
          </div>

          <Button type="submit" loading={createMut.isPending} disabled={!nameFr.trim()}>
            <Plus size={15} /> Ajouter
          </Button>
        </form>
        {formError && <p className="text-xs text-red-500 mt-2">{formError}</p>}
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Chargement…</div>
        ) : colors.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            <Palette size={32} className="mx-auto mb-3 opacity-30" />
            Aucune couleur. Ajoutez-en une ci-dessus.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-medium">Aperçu</th>
                <th className="px-5 py-3 text-left font-medium">Nom (FR)</th>
                <th className="px-5 py-3 text-left font-medium">Code HEX</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginatedColors.map((c) => (
                <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors group">
                  <td className="px-5 py-3">
                    <div
                      className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm"
                      style={{ backgroundColor: c.hex }}
                      title={c.hex}
                    />
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-800">{c.nameFr}</td>
                  <td className="px-5 py-3 font-mono text-gray-500">{c.hex}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => deleteMut.mutate(c.id)}
                      disabled={deleteMut.isPending}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
                      title="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {colors.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Affichage {startIndex + 1}-{Math.min(endIndex, colors.length)} sur {colors.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Page précédente"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-amber-500 text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Page suivante"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
