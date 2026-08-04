"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Percent, Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  createPromotion,
  deletePromotion,
  fetchPromotionFilterOptions,
  fetchPromotions,
} from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { CreatePromotionPayload } from "@/types/promotion";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function PromotionsPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [startDate, setStartDate] = useState(toDateInputValue(new Date()));
  const [endDate, setEndDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [productId, setProductId] = useState("");
  const [applicableSizes, setApplicableSizes] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const { data: options, isLoading: loadingOptions } = useQuery({
    queryKey: ["promotion-options"],
    queryFn: () => fetchPromotionFilterOptions(""),
  });

  const { data: promotions = [], isLoading: loadingPromotions } = useQuery({
    queryKey: ["promotions"],
    queryFn: fetchPromotions,
  });

  const categoryOptions = useMemo(
    () => (options?.categories ?? []).map((c) => ({ value: c.id, label: c.name })),
    [options]
  );

  const currentChildren = useMemo(() => {
    const selected = (options?.categories ?? []).find((c) => c.id === categoryId);
    return selected?.children ?? [];
  }, [options, categoryId]);

  const subCategoryOptions = useMemo(
    () => currentChildren.map((c) => ({ value: c.id, label: c.name })),
    [currentChildren]
  );

  const filteredProducts = useMemo(() => {
    const products = options?.products ?? [];
    const selectedCategory = (options?.categories ?? []).find((c) => c.id === categoryId);
    const childIds = new Set((selectedCategory?.children ?? []).map((c) => c.id));

    return products.filter((p) => {
      const searchOk =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.slug ?? "").toLowerCase().includes(search.toLowerCase());
      if (!searchOk) return false;

      if (subCategoryId) return p.categoryId === subCategoryId;

      if (categoryId) {
        if (p.categoryId === categoryId) return true;
        if (p.categoryId && childIds.has(p.categoryId)) return true;
        return false;
      }

      return true;
    });
  }, [options, search, categoryId, subCategoryId]);

  const productOptions = useMemo(
    () => filteredProducts.map((p) => ({ value: p.id, label: p.name })),
    [filteredProducts]
  );

  const createMut = useMutation({
    mutationFn: (payload: CreatePromotionPayload) => createPromotion(payload),
    onSuccess: () => {
      toast.success("Promotion créée avec succès!");
      qc.invalidateQueries({ queryKey: ["promotions"] });
      setName("");
      setDiscountValue("");
      setEndDate("");
      setCategoryId("");
      setSubCategoryId("");
      setProductId("");
      setApplicableSizes([]);
      setIsActive(true);
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? "Erreur lors de la création de la promotion");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePromotion(id),
    onSuccess: () => {
      toast.success("Promotion supprimée avec succès!");
      qc.invalidateQueries({ queryKey: ["promotions"] });
    },
  });

  // Pagination
  const totalPages = Math.ceil(promotions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPromotions = promotions.slice(startIndex, endIndex);

  const onCategoryChange = (value: string) => {
    setCategoryId(value);
    setSubCategoryId("");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedDiscount = Number(discountValue);
    if (!name.trim()) {
      setFormError("Le nom de la promotion est requis");
      return;
    }
    if (!Number.isFinite(parsedDiscount) || parsedDiscount <= 0) {
      setFormError("La valeur de réduction doit être un nombre positif");
      return;
    }
    if (!startDate || !endDate) {
      setFormError("Les dates de début et de fin sont requises");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setFormError("La date d'expiration doit être postérieure à la date de début");
      return;
    }
    if (!productId && !categoryId && !subCategoryId) {
      setFormError("Sélectionnez au moins un filtre: produit, catégorie ou sous-catégorie");
      return;
    }

    createMut.mutate({
      name: name.trim(),
      discountType,
      discountValue: parsedDiscount,
      startDate,
      endDate,
      isActive,
      productId: productId || null,
      categoryId: categoryId || null,
      subCategoryId: subCategoryId || null,
      applicableSizes: applicableSizes.length > 0 ? applicableSizes : null,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Configurez des promotions par produit, catégorie ou sous-catégorie avec période d'activation.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Percent size={15} /> Nouvelle promotion
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Promo été" />
            <Select
              label="Type de réduction"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
              options={[
                { value: "percentage", label: "Pourcentage (%)" },
                { value: "fixed", label: "Montant fixe" },
              ]}
            />
            <Input
              label={discountType === "percentage" ? "Valeur (%)" : "Valeur fixe"}
              type="number"
              min="0"
              step="0.01"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === "percentage" ? "Ex: 15" : "Ex: 100"}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Date de début"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="Date d'expiration"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Select
              label="Catégorie"
              value={categoryId}
              onChange={(e) => onCategoryChange(e.target.value)}
              options={categoryOptions}
              placeholder="Toutes"
              disabled={loadingOptions}
            />

            <Select
              label="Sous-catégorie"
              value={subCategoryId}
              onChange={(e) => setSubCategoryId(e.target.value)}
              options={subCategoryOptions}
              placeholder="Toutes"
              disabled={loadingOptions || !categoryId}
            />

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Produit</label>
              <Select
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  setApplicableSizes([]); // reset sizes when product changes
                }}
                options={productOptions}
                placeholder="Tous"
                disabled={loadingOptions}
              />
            </div>
          </div>

          {/* ── Tailles disponibles pour la promotion ── */}
          {(() => {
            const selectedProduct = productId
              ? (options?.products ?? []).find((p) => p.id === productId)
              : null;
            const availSizes = selectedProduct?.sizes ?? [];
            if (!productId || availSizes.length === 0) return null;
            const toggleSize = (s: string) =>
              setApplicableSizes((prev) =>
                prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
              );
            return (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Tailles concernées
                  <span className="ml-2 text-xs text-gray-400 font-normal">(aucune sélection = toutes les tailles)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {availSizes.map((size) => {
                    const active = applicableSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          active
                            ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                            : "bg-white text-gray-600 border-gray-300 hover:border-amber-400 hover:text-amber-600"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                  {applicableSizes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setApplicableSizes([])}
                      className="px-3 py-1.5 rounded-lg text-sm text-gray-400 border border-dashed border-gray-300 hover:text-red-500 hover:border-red-300 transition-all"
                    >
                      ✕ Réinitialiser
                    </button>
                  )}
                </div>
                {applicableSizes.length > 0 && (
                  <p className="text-xs text-amber-600">
                    Promotion appliquée uniquement aux tailles : <strong>{applicableSizes.join(", ")}</strong>
                  </p>
                )}
              </div>
            );
          })()}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Recherche produit</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Rechercher par nom ou slug produit"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500">{filteredProducts.length} produit(s) disponible(s) avec les filtres actuels</p>

            {search.trim() && (
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white max-h-56 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">Aucun produit trouvé</div>
                ) : (
                  filteredProducts.slice(0, 20).map((product) => {
                    const selected = productId === product.id;
                    const rawImage = product.images?.[0] ?? "";
                    const imageSrc = rawImage
                      ? (typeof rawImage === "string" && rawImage.startsWith("http") ? rawImage : `${IMAGE_BASE}${rawImage}`)
                      : "";
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setProductId(product.id)}
                        className={`w-full text-left px-3 py-2 border-b border-gray-100 last:border-b-0 text-sm transition-colors ${
                          selected
                            ? "bg-amber-50 text-amber-700"
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                            {imageSrc ? (
                              <img src={imageSrc} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                                N/A
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{product.name}</div>
                            <div className="text-xs text-gray-500 truncate">/{product.slug ?? product.id}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Promotion active
          </label>

          {formError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">{formError}</p>
          )}

          <div className="pt-2">
            <Button type="submit" loading={createMut.isPending}>
              Créer la promotion
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Promotions existantes</h2>
        </div>

        {loadingPromotions ? (
          <div className="p-10 text-center text-gray-400 text-sm">Chargement...</div>
        ) : promotions.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">Aucune promotion pour le moment.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-medium">Nom</th>
                <th className="px-5 py-3 text-left font-medium">Cible</th>
                <th className="px-5 py-3 text-left font-medium">Réduction</th>
                <th className="px-5 py-3 text-left font-medium">Période</th>
                <th className="px-5 py-3 text-left font-medium">Statut</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginatedPromotions.map((promotion) => {
                const now = new Date();
                const expired = new Date(promotion.endDate) < now;
                const upcoming = new Date(promotion.startDate) > now;
                const running = !expired && !upcoming && promotion.isActive;

                return (
                  <tr key={promotion.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-3 font-medium text-gray-800">{promotion.name}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {promotion.product?.name ?? promotion.subCategory?.name ?? promotion.category?.name ?? "-"}
                      {promotion.applicableSizes && promotion.applicableSizes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {promotion.applicableSizes.map((s) => (
                            <span key={s} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {promotion.discountType === "percentage"
                        ? `${promotion.discountValue}%`
                        : `${promotion.discountValue}`}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      <div className="inline-flex items-center gap-1">
                        <CalendarDays size={14} className="text-gray-400" />
                        <span>
                          {new Date(promotion.startDate).toLocaleDateString("fr-FR")} - {new Date(promotion.endDate).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          running
                            ? "bg-emerald-100 text-emerald-700"
                            : expired
                              ? "bg-red-100 text-red-700"
                              : upcoming
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {running ? "Active" : expired ? "Expirée" : upcoming ? "À venir" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => {
                          toast("Supprimer cette promotion ?", {
                            action: {
                              label: "Supprimer",
                              onClick: () => deleteMut.mutate(promotion.id),
                            },
                          });
                        }}
                        disabled={deleteMut.isPending}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {promotions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Affichage {startIndex + 1}-{Math.min(endIndex, promotions.length)} sur {promotions.length}
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
