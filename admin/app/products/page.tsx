"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchCatalogueWeb } from "@/lib/ooposts-api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const ITEMS_PER_PAGE = 20;

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const newCode = searchParams.get("newCode") ?? "";

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: ooposResponse, isLoading } = useQuery({
    queryKey: ["oopos-catalogue"],
    queryFn: fetchCatalogueWeb,
  });

  const allProducts: any[] = useMemo(() => {
    const raw = Array.isArray(ooposResponse)
      ? ooposResponse
      : Array.isArray(ooposResponse?.data)
      ? ooposResponse.data
      : [];

    // Group by product code — one row per unique product
    const map = new Map<string, any>();
    for (const p of raw) {
      const code = p.Produit || p.Code || "";
      if (!code) continue;
      if (!map.has(code)) map.set(code, p);
    }
    const list = Array.from(map.values());

    // Put the newly created product first
    if (newCode) {
      const idx = list.findIndex((p) => p.Produit === newCode);
      if (idx > 0) {
        const [item] = list.splice(idx, 1);
        list.unshift(item);
      }
    }

    return list;
  }, [ooposResponse, newCode]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allProducts;
    const q = search.toLowerCase();
    return allProducts.filter(
      (p) =>
        (p.Designation || "").toLowerCase().includes(q) ||
        (p.Produit || "").toLowerCase().includes(q)
    );
  }, [allProducts, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when search changes
  useMemo(() => { setCurrentPage(1); }, [search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
          <p className="text-sm text-gray-500 mt-0.5">Catalogue depuis OOPOS</p>
        </div>
        <Link href="/products/new">
          <Button>
            <Plus size={16} /> Nouveau produit
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <Input
          label="Rechercher"
          placeholder="Par nom ou code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-3">
          {filtered.length} produit{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "s" : ""} · page {currentPage} / {totalPages}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">Aucun produit trouvé.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Désignation</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rayon</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Famille</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Marque</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prix TTC</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Publié</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((p: any) => (
                <tr key={p.Produit} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-900 font-mono text-sm">{p.Produit}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.Designation || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{p.Rayon || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{p.Famille || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{p.Marque || "—"}</td>
                  <td className="px-4 py-3 text-gray-700 font-semibold">
                    {p.Prix_Vente != null ? `${Number(p.Prix_Vente).toFixed(2)} DT` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.Actif ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">Oui</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-500">Non</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const page = totalPages <= 7 ? i + 1 : i < 3 ? i + 1 : i === 3 ? currentPage : totalPages - (6 - i);
              return (
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
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
