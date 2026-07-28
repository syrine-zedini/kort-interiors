"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight, Database, Globe, Pencil, Trash2, X, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { fetchCatalogueWeb } from "@/lib/ooposts-api";
import api from "@/lib/axios";
import { Product } from "@/types/product";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ImageCropUploader from "@/components/ui/ImageCropUploader";

const ITEMS_PER_PAGE = 20;

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const newCode = searchParams.get("newCode") ?? "";
  const qc = useQueryClient();

  const [source, setSource] = useState<"oopos" | "local">("oopos");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Auto-switch to local tab if ?tab=local
  useEffect(() => {
    if (searchParams.get("tab") === "local") setSource("local");
  }, []);

  // Edit state




  // ── OOPOS data ──
  const { data: ooposResponse, isLoading: ooposLoading } = useQuery({
    queryKey: ["oopos-catalogue"],
    queryFn: fetchCatalogueWeb,
    enabled: source === "oopos",
  });

  const ooposProducts: any[] = useMemo(() => {
    const raw = Array.isArray(ooposResponse)
      ? ooposResponse
      : Array.isArray(ooposResponse?.data)
      ? ooposResponse.data
      : [];
    const map = new Map<string, any>();
    for (const p of raw) {
      const code = p.Produit || p.Code || "";
      if (!code) continue;
      if (!map.has(code)) map.set(code, p);
    }
    const list = Array.from(map.values());
    if (newCode) {
      const idx = list.findIndex((p) => p.Produit === newCode);
      if (idx > 0) { const [item] = list.splice(idx, 1); list.unshift(item); }
    }
    return list;
  }, [ooposResponse, newCode]);

  // ── Local DB data ──
  const { data: localProducts = [], isLoading: localLoading } = useQuery({
    queryKey: ["local-products"],
    queryFn: async () => {
      const { data } = await api.get('/db-viewer/products?limit=1000');
      return data.rows;
    },
    enabled: source === "local",
  });

  // ── Categories for dropdown & mapping ──
  const { data: localCatsRaw = [] } = useQuery<{ id: string; name: string; slug?: string; parentIds: string[] }[]>({
    queryKey: ["all-categories-flat"],
    queryFn: async () => {
      const [res1, res2] = await Promise.all([
        api.get("/categories").catch(() => ({ data: { data: [] } })),
        api.get("/db-viewer/local-categories").catch(() => ({ data: [] })),
      ]);
      const nodes: { id: string; name: string; slug?: string; parentIds: string[] }[] = [];
      const flatten = (cats: any[], parentIds: string[] = []) => {
        for (const cat of cats) {
          nodes.push({ id: String(cat.id), name: cat.name, slug: cat.slug, parentIds: cat.parentIds || parentIds || [] });
          if (cat.children?.length) flatten(cat.children, [String(cat.id)]);
        }
      };
      flatten(res1.data?.data ?? []);

      const localList = Array.isArray(res2.data) ? res2.data : [];
      for (const loc of localList) {
        nodes.push({ id: String(loc.id), name: loc.name, slug: loc.slug, parentIds: loc.parentIds || [] });
      }
      return nodes;
    },
  });

  const rayonIds = new Set(localCatsRaw.filter(c => (c.parentIds || []).length === 0).map(c => c.id));
  const familleIds = new Set(localCatsRaw.filter(c => (c.parentIds || []).some(pid => rayonIds.has(pid))).map(c => c.id));
  const catsByLevel = [
    localCatsRaw.filter(c => (c.parentIds || []).length === 0),
    localCatsRaw.filter(c => (c.parentIds || []).some(pid => rayonIds.has(pid))),
    localCatsRaw.filter(c => !rayonIds.has(c.id) && !familleIds.has(c.id) && (c.parentIds || []).length > 0),
  ];
  const catMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of localCatsRaw) {
      if (c.id) map.set(String(c.id), c.name);
      if (c.slug) map.set(String(c.slug), c.name);
    }
    return map;
  }, [localCatsRaw]);

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/db-viewer/local-products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-products"] });
      toast.success("Produit supprimé");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Erreur suppression"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      api.put(`/db-viewer/local-products/${id}`, { ...data, images: data.images }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-products"] });
      setEditId(null);
      toast.success("Produit modifié");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Erreur modification"),
  });

  const visibilityMut = useMutation({
    mutationFn: (id: string) => api.patch(`/db-viewer/local-products/${id}/visible`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["local-products"] }),
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Erreur"),
  });

  // (local products are created via /products/new?source=local)

  // ── Filtering ──
  const activeProducts = source === "oopos" ? ooposProducts : localProducts;
  const isLoading = source === "oopos" ? ooposLoading : localLoading;

  const filtered = useMemo(() => {
    if (!search.trim()) return activeProducts;
    const q = search.toLowerCase();
    return (activeProducts as any[]).filter((p: any) =>
      (p.Designation || p.name || "").toLowerCase().includes(q) ||
      (p.Produit || p.code || "").toLowerCase().includes(q)
    );
  }, [activeProducts, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useMemo(() => { setCurrentPage(1); }, [search, source]);



  const CategorySelect = ({ value, onChange }: { value?: string; onChange: (v: string) => void }) => (
    <select
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      className="border border-violet-300 rounded-lg px-2 py-1.5 text-sm w-full outline-none focus:ring-2 focus:ring-violet-400 bg-white"
    >
      <option value="">— Sans catégorie —</option>
      {catsByLevel[0].length > 0 && (
        <optgroup label="Rayons">
          {catsByLevel[0].map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </optgroup>
      )}
      {catsByLevel[1].length > 0 && (
        <optgroup label="Familles">
          {catsByLevel[1].map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </optgroup>
      )}
      {catsByLevel[2].length > 0 && (
        <optgroup label="SousFamilles">
          {catsByLevel[2].map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </optgroup>
      )}
    </select>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {source === "oopos" ? "Catalogue depuis OOPOS" : "Base de données locale (PostgreSQL)"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle source */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => { setSource("oopos"); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                source === "oopos" ? "bg-white shadow text-amber-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Globe size={15} /> OOPOS
            </button>
            <button
              onClick={() => { setSource("local"); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                source === "local" ? "bg-white shadow text-violet-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Database size={15} /> BD locale
            </button>
          </div>

          {source === "oopos" ? (
            <Link href="/products/new">
              <Button><Plus size={16} /> Nouveau produit</Button>
            </Link>
          ) : (
            <Link href="/products/new?source=local">
              <Button className="bg-violet-600 hover:bg-violet-700"><Plus size={16} /> Nouveau produit local</Button>
            </Link>
          )}
        </div>
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
          {filtered.length} produit{filtered.length !== 1 ? "s" : ""} · page {currentPage} / {totalPages}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">Aucun produit trouvé.</div>
        ) : source === "oopos" ? (
          // ── OOPOS table ──
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
              {(paginated as any[]).map((p: any) => (
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
        ) : (
          // ── Local DB table ──
          <table className="w-full text-sm">
            <thead className="bg-violet-50 border-b border-violet-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-violet-600 uppercase tracking-wide">Image</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-violet-600 uppercase tracking-wide">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-violet-600 uppercase tracking-wide">Nom</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-violet-600 uppercase tracking-wide">Prix</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-violet-600 uppercase tracking-wide">Description</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-violet-600 uppercase tracking-wide">Catégorie</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-violet-600 uppercase tracking-wide">Site</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(paginated as Product[]).map((p: Product) => {
                return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-4 py-3">
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0].startsWith("http") ? p.images[0] : `${process.env.NEXT_PUBLIC_IMAGE_URL ?? ""}${p.images[0]}`}
                        alt={p.name ?? ""}
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
                        —
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-900">{p.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-700 font-semibold">
                    {p.price != null ? `${Number(p.price).toFixed(2)} DT` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{p.description || "—"}</td>
                  <td className="px-4 py-3">
                    {(p.categoryId || (p as any).category_id) ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
                        {catMap.get(String(p.categoryId || (p as any).category_id)) ?? (p.categoryId || (p as any).category_id)}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => visibilityMut.mutate(p.id)}
                      disabled={visibilityMut.isPending}
                      title={p.visible ? "Visible sur le site — cliquer pour masquer" : "Masqué sur le site — cliquer pour rendre visible"}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        p.visible
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {p.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                      {p.visible ? "Visible" : "Masqué"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => router.push(`/products/${p.id}?source=local`)}
                        className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
                        title="Modifier"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          toast(`Supprimer "${p.name || p.code}" ?`, {
                            action: { label: "Confirmer", onClick: () => deleteMut.mutate(p.id) },
                            cancel: { label: "Annuler", onClick: () => {} },
                            duration: 6000,
                          });
                        }}
                        disabled={deleteMut.isPending}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-30"
                        title="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
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
                      ? source === "local" ? "bg-violet-600 text-white" : "bg-amber-500 text-white"
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
