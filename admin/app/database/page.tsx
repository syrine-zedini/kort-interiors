"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Database, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

const TABLES = [
  { key: "products",                  label: "Produits" },
  { key: "product_categories",        label: "Catégories" },
  { key: "product_category_hierarchy",label: "Hiérarchie catégories" },
  { key: "product_items",             label: "Items produits" },
  { key: "product_variants",          label: "Variantes" },
  { key: "colors",                    label: "Couleurs" },
  { key: "users",                     label: "Utilisateurs" },
  { key: "commandes",                 label: "Commandes" },
  { key: "commande_items",            label: "Lignes commandes" },
  { key: "blogs",                     label: "Articles blog" },
  { key: "promotions",                label: "Promotions" },
  { key: "hero_slides",               label: "Hero slides" },
  { key: "styles",                    label: "Styles" },
  { key: "cart_items",                label: "Paniers" },
  { key: "oopos_product_photos",      label: "Photos OOPOS" },
];

const PAGE_SIZE = 50;

export default function DatabasePage() {
  const [activeTable, setActiveTable] = useState(TABLES[0].key);
  const [page, setPage] = useState(0);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["db-viewer", activeTable, page],
    queryFn: async () => {
      const { data } = await api.get(`/db-viewer/${activeTable}`, {
        params: { limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      });
      return data as { table: string; total: number; rows: Record<string, any>[] };
    },
    staleTime: 0,
  });

  const handleTableChange = (key: string) => {
    setActiveTable(key);
    setPage(0);
  };

  const columns = data?.rows?.[0] ? Object.keys(data.rows[0]) : [];
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database size={22} className="text-violet-600" />
            Base de données locale (PostgreSQL)
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Visualisation directe des tables locales.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* Table buttons */}
      <div className="flex flex-wrap gap-2">
        {TABLES.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTableChange(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              activeTable === t.key
                ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Info bar */}
      {data && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Table <code className="bg-gray-100 px-2 py-0.5 rounded text-violet-700 font-mono text-xs">{data.table}</code>
            {" — "}<strong className="text-gray-800">{data.total}</strong> enregistrement{data.total !== 1 ? "s" : ""}
          </span>
          {totalPages > 1 && (
            <span>Page {page + 1} / {totalPages}</span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Chargement...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-400 text-sm">
            Erreur : {(error as any)?.response?.data?.message ?? String(error)}
          </div>
        ) : !data?.rows?.length ? (
          <div className="p-12 text-center text-gray-400 text-sm">Table vide</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    {columns.map((col) => {
                      const val = row[col];
                      const display =
                        val === null || val === undefined
                          ? <span className="text-gray-300 italic">null</span>
                          : typeof val === "object"
                          ? <span className="font-mono text-blue-600">{JSON.stringify(val)}</span>
                          : String(val).length > 80
                          ? <span title={String(val)}>{String(val).slice(0, 80)}…</span>
                          : String(val);
                      return (
                        <td key={col} className="px-4 py-2 text-gray-700 whitespace-nowrap max-w-xs truncate">
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={16} /> Précédent
          </button>
          <span className="text-sm text-gray-500">
            {page * PAGE_SIZE + 1} – {Math.min((page + 1) * PAGE_SIZE, data?.total ?? 0)} / {data?.total}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Suivant <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
