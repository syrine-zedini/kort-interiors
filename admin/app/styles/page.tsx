"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchStyles, createStyle, deleteStyle, Style } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function StylesPage() {
  const qc = useQueryClient();
  const { data: styles = [], isLoading } = useQuery<Style[]>({
    queryKey: ["styles"],
    queryFn: fetchStyles,
  });

  const [nameFr, setNameFr] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Pagination
  const totalPages = Math.ceil(styles.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedStyles = styles.slice(startIndex, endIndex);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["styles"] });

  const createMut = useMutation({
    mutationFn: () => createStyle(nameFr.trim()),
    onSuccess: () => { invalidate(); setNameFr(""); setFormError(null); },
    onError: (e: any) => setFormError(e?.response?.data?.message ?? "Erreur"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteStyle(id),
    onSuccess: invalidate,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameFr.trim()) { setFormError("Le nom est requis"); return; }
    createMut.mutate();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Styles</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {styles.length} style{styles.length !== 1 ? "s" : ""} enregistré{styles.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Plus size={15} /> Ajouter un style
        </h2>
        <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
          {/* Nom FR */}
          <div className="flex-1 min-w-40">
            <label className="block text-xs text-gray-500 mb-1">Nom (français)</label>
            <input
              value={nameFr}
              onChange={(e) => { setNameFr(e.target.value); setFormError(null); }}
              placeholder="ex: Moderne"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
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
        ) : styles.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            <Tag size={32} className="mx-auto mb-3 opacity-30" />
            Aucun style. Ajoutez-en un ci-dessus.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-medium">Nom (FR)</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginatedStyles.map((s) => (
                <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors group">
                  <td className="px-5 py-3 font-medium text-gray-800">{s.nameFr}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => deleteMut.mutate(s.id)}
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
      {styles.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Affichage {startIndex + 1}-{Math.min(endIndex, styles.length)} sur {styles.length}
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
