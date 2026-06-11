"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProducts, deleteProduct, fetchCategories } from "@/lib/api";
import { Product } from "@/types/product";
import Link from "next/link";
import { Plus, Pencil, Trash2, ImageOff, Search, ChevronLeft, ChevronRight, DownloadCloud } from "lucide-react";
import { fetchCatalogueWeb, importProduits, importTarifs, importProduitsAssocies } from "@/lib/ooposts-api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { toast } from "sonner";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

// Helper to flatten category tree
function flattenCategories(nodes: any[], seen = new Set<string>()): any[] {
  const result: any[] = [];
  for (const node of nodes) {
    if (!seen.has(node.id)) {
      seen.add(node.id);
      result.push(node);
    }
    if (node.children?.length) {
      result.push(...flattenCategories(node.children, seen));
    }
  }
  return result;
}

export default function ProductsPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [useOopos, setUseOopos] = useState(false);
  const ITEMS_PER_PAGE = 10;

  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: fetchProducts,
    enabled: !useOopos,
  });

  const { data: ooposResponse, isLoading: loadingOopos } = useQuery({
    queryKey: ["oopos-catalogue"],
    queryFn: fetchCatalogueWeb,
    enabled: useOopos,
  });

  const ooposProducts = Array.isArray(ooposResponse) ? ooposResponse : Array.isArray(ooposResponse?.data) ? ooposResponse.data : [];

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // Flatten categories for dropdown options and lookup
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const categoryOptions = useMemo(
    () => flatCategories.map((c) => ({ value: c.id, label: c.name })),
    [flatCategories]
  );

  const getCategoryName = (categoryId: string | undefined): string => {
    if (!categoryId) return "—";
    return flatCategories.find((c) => c.id === categoryId)?.name ?? "—";
  };

  // Filtered products based on search and category
  const filteredProducts = useMemo(() => {
    const list = useOopos ? ooposProducts : products;
    return list.filter((p: any) => {
      // Search filter: name or code (case-insensitive)
      const name = p.name || p.Designation || "";
      const code = p.code || p.Produit || p.Code_Article || "";
      const searchOk =
        !search.trim() ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        code.toLowerCase().includes(search.toLowerCase());

      if (!searchOk) return false;

      // Category filter (only local supports this easily right now)
      if (!useOopos) {
         const categoryOk = !categoryFilter || p.categoryId === categoryFilter;
         if (!categoryOk) return false;
      }
      return true;
    });
  }, [products, ooposProducts, search, categoryFilter, useOopos]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handleImport = async (type: 'produits' | 'tarifs' | 'associes') => {
     try {
        const payloadProduits = products.map(p => ({
           Produit: p.code || p.id,
           Designation: p.name,
           Famille: flatCategories.find(c => c.id === p.categoryId)?.name || "",
           Prix_Vente: p.price || 0,
           Couleur: "",
           Taille: ""
        }));

        const payloadTarifs = products.map(p => ({
           Tarif: "STANDARD",
           Produit: p.code || p.id,
           Prix_Vente: p.price || 0,
           Remise_Vente: p.discount || 0,
           Couleur: "",
           Taille: ""
        }));

        if (type === 'produits') await importProduits(payloadProduits);
        if (type === 'tarifs') await importTarifs(payloadTarifs);
        if (type === 'associes') await importProduitsAssocies(products); // fallback
        toast.success(`Import ${type} terminé !`);
        if (!useOopos) qc.invalidateQueries({ queryKey: ["products"] });
     } catch (e: any) {
        toast.error(`Erreur d'import : ${e.message}`);
     }
  };

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  const del = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produit supprimé avec succès!");
      setDeletingId(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erreur lors de la suppression");
    },
  });

  const confirmDelete = (id: string) => {
    if (confirm("Supprimer ce produit ? Cette action est irréversible.")) {
      setDeletingId(id);
      del.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {useOopos ? "Catalogue Web depuis OOPOS" : "Produits e-commerce locaux"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setUseOopos(!useOopos); setCurrentPage(1); setSearch(""); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              useOopos
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : "bg-amber-600 text-white hover:bg-amber-700"
            }`}
          >
            {useOopos ? "Voir base locale" : "Voir depuis OOPOS"}
          </button>
          
          {!useOopos ? (
            <Link href="/products/new">
              <Button>
                <Plus size={16} /> Nouveau produit
              </Button>
            </Link>
          ) : (
            <div className="flex gap-2">
               <Button onClick={() => handleImport('produits')} className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                 <DownloadCloud size={16} /> Importer Produits
               </Button>
               <Button onClick={() => handleImport('tarifs')} className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                 <DownloadCloud size={16} /> Importer Tarifs
               </Button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Rechercher"
            placeholder="Par nom ou code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {!useOopos && (
            <Select
              label="Catégorie"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={categoryOptions}
              placeholder="Toutes les catégories"
              disabled={loadingCategories}
            />
          )}
        </div>
        <p className="text-xs text-gray-500">
          {filteredProducts.length} produit{filteredProducts.length !== 1 ? "s" : ""} affiché{filteredProducts.length !== 1 ? "s" : ""} ({currentPage} / {totalPages || 1})
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {(useOopos ? loadingOopos : loadingProducts) ? (
          <div className="p-10 text-center text-gray-400 text-sm">Chargement…</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            {products.length === 0 && !useOopos ? "Aucun produit pour le moment." : "Aucun produit correspondant aux filtres."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              {useOopos ? (
                 <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Désignation</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Famille</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Marque</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prix TTC</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Publié Web</th>
                 </tr>
              ) : (
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">Image</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Catégorie</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prix</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Variantes</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pièces</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedProducts.map((p: any) => {
                if (useOopos) {
                   return (
                      <tr key={`${p.Produit}-${p.Couleur}-${p.Taille}`} className="hover:bg-gray-50 transition-colors">
                         <td className="px-4 py-3 text-gray-900 font-mono text-sm">{p.Produit}</td>
                         <td className="px-4 py-3 font-medium text-gray-900">{p.Designation}</td>
                         <td className="px-4 py-3 text-gray-600 text-sm">{p.Famille || "—"}</td>
                         <td className="px-4 py-3 text-gray-600 text-sm">{p.Marque || "—"}</td>
                         <td className="px-4 py-3 text-gray-600 font-semibold">{p.Prix_Vente?.toFixed(2)} DT</td>
                         <td className="px-4 py-3 text-gray-600">
                            {p.Actif ? (
                               <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">Oui</span>
                            ) : (
                               <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Non</span>
                            )}
                         </td>
                      </tr>
                   );
                }

                const img = p.images?.[0] ?? p.variants?.[0]?.images?.[0];
                const src = img ? (typeof img === "string" && img.startsWith("http") ? img : `${IMAGE_BASE}${img}`) : null;
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {src ? (
                        <img src={src} alt={p.name || p.code} className="w-12 h-12 object-cover rounded-lg" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <ImageOff size={18} className="text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name || p.code}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-sm">{p.code || <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{getCategoryName(p.categoryId)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.price != null ? `${p.price} DT` : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.variants?.length ?? 0}</td>
                    <td className="px-4 py-3 text-gray-600">{p.items?.length ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/products/${p.id}`}>
                          <button className="text-gray-400 hover:text-amber-600 transition-colors" title="Modifier">
                            <Pencil size={16} />
                          </button>
                        </Link>
                        <button
                          className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                          title="Supprimer"
                          onClick={() => confirmDelete(p.id)}
                          disabled={deletingId === p.id}
                        >
                          <Trash2 size={16} />
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

      {/* Pagination Controls */}
      {filteredProducts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Affichage {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} sur {filteredProducts.length}
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
