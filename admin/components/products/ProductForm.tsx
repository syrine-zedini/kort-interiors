"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchColors } from "@/lib/api";
import api from "@/lib/axios";
import { CreateProductPayload, Product, VariantDraft } from "@/types/product";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import TagInput from "@/components/ui/TagInput";
import ColorMultiSelect from "@/components/ui/ColorMultiSelect";
import StyleMultiSelect from "@/components/ui/StyleMultiSelect";
import ImageUploader from "@/components/ui/ImageUploader";
import Button from "@/components/ui/Button";
import ProductItemsEditor, { ItemDraft } from "./ProductItemsEditor";
import ProductVariantsEditor from "./ProductVariantsEditor";
import RelatedProductsPicker from "./RelatedProductsPicker";

const MATERIAL_ONLY_SIZE_KEY = "__material_only__";
type PricingMode = "direct" | "size" | "material" | "size_material";

interface ProductFormProps {
  initial?: Product;
  onSubmit: (data: CreateProductPayload) => Promise<void>;
  loading?: boolean;
}

export default function ProductForm({ initial, onSubmit, loading }: ProductFormProps) {
  const { data: categoryGroups = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const { data: allColorsList = [] } = useQuery({ queryKey: ["colors"], queryFn: fetchColors });
  const { data: localCategoriesRaw = [] } = useQuery<{ id: string; name: string; slug?: string }[]>({
    queryKey: ["local-categories-for-form"],
    queryFn: async () => {
      const { data } = await api.get("/db-viewer/local-categories");
      return Array.isArray(data) ? data : [];
    },
  });

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDesc] = useState(initial?.description ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const initialPricingMode: PricingMode = (() => {
    // Check sizePricing first — explicit "size" mode signal that must win
    if (initial?.sizePricing && Object.keys(initial.sizePricing).length > 0) return "size";
    // Then check sizeMaterialPricing for material/size_material modes
    if (initial?.sizeMaterialPricing && Object.keys(initial.sizeMaterialPricing).length > 0) {
      return Object.keys(initial.sizeMaterialPricing).includes(MATERIAL_ONLY_SIZE_KEY)
        ? "material"
        : "size_material";
    }
    // Fallback: if there are sizes (but no sizePricing yet), still treat as "size"
    if ((initial?.sizes?.length ?? 0) > 0) return "size";
    return "direct";
  })();
  const [pricingMode, setPricingMode] = useState<PricingMode>(initialPricingMode);
  const initialSizeCandidates =
    (initial?.sizes && initial.sizes.length > 0
      ? initial.sizes
      : Array.from(
          new Set(
            (initial?.variants ?? [])
              .map((variant) => variant.size)
              .filter((size): size is string => Boolean(size))
          )
        )) ?? [];
  const [sizes, setSizes] = useState<string[]>(
    initialSizeCandidates.filter((s) => s !== MATERIAL_ONLY_SIZE_KEY)
  );
  const [directPrice, setDirectPrice] = useState<string>(
    initial?.price != null ? String(initial.price) : ""
  );
  const [sizePrices, setSizePrices] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    const variantBySize = new Map<string, number>();
    (initial?.variants ?? []).forEach((variant) => {
      if (!variant.size || variant.size === MATERIAL_ONLY_SIZE_KEY) return;
      if (!variantBySize.has(variant.size) && variant.price != null) {
        variantBySize.set(variant.size, Number(variant.price));
      }
    });
    initialSizeCandidates
      .filter((size) => size !== MATERIAL_ONLY_SIZE_KEY)
      .forEach((size) => {
        const fromSizePricing = initial?.sizePricing?.[size]?.price;
        if (fromSizePricing != null) {
          next[size] = String(fromSizePricing);
        } else {
          const fromVariant = variantBySize.get(size);
          next[size] = fromVariant != null ? String(fromVariant) : "";
        }
      });
    return next;
  });
  const [materialPricing, setMaterialPricing] = useState<Record<string, string>>(() => {
    const row = initial?.sizeMaterialPricing?.[MATERIAL_ONLY_SIZE_KEY];
    if (!row) return {};
    return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, String(v)]));
  });
  const [colors, setColors] = useState<string[]>(initial?.colors ?? []);
  const [styles, setStyles] = useState<string[]>(initial?.styles ?? []);
  const [isDetailsEnabled, setIsDetailsEnabled] = useState(initial?.isDetailsEnabled ?? false);
  const [details, setDetails] = useState<{ key: string; value: string }[]>(initial?.details ?? []);
  const [sizeMaterialPricing, setSizeMaterialPricing] = useState<Record<string, Record<string, string>>>(() => {
    const next: Record<string, Record<string, string>> = {};
    (initial?.sizes ?? []).forEach((size) => {
      next[size] = {};
      if (initial?.sizeMaterialPricing?.[size]) {
        Object.entries(initial.sizeMaterialPricing[size]).forEach(([material, price]) => {
          next[size][material] = String(price);
        });
      }
    });
    return next;
  });
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [items, setItems] = useState<ItemDraft[]>(
    initial?.items?.map((it) => {
      // Detect pricing mode from existing item data
      let detectedMode: "direct" | "size" | "material" | "size_material" = "size_material";
      if (it.price != null && !it.sizePricing && !it.sizeMaterialPricing) {
        detectedMode = "direct";
      } else if (it.sizePricing && Object.keys(it.sizePricing).length > 0 && !it.sizeMaterialPricing) {
        detectedMode = "size";
      } else if (it.sizeMaterialPricing && Object.keys(it.sizeMaterialPricing).length > 0) {
        const hasMaterialOnly = Object.keys(it.sizeMaterialPricing).includes("__material_only__");
        detectedMode = hasMaterialOnly ? "material" : "size_material";
      }

      return {
        id: it.id,
        name: it.name,
        code: it.code ?? "",
        description: it.description ?? "",
        pricingMode: detectedMode,
        directPrice: it.price != null ? String(it.price) : "",
        sizePrices: it.sizePricing ?
          Object.fromEntries(Object.entries(it.sizePricing).map(([size, pricing]) => [size, String(pricing.price ?? "")]))
          : {},
        materialPricing: it.sizeMaterialPricing?.["__material_only__"] ?
          Object.fromEntries(Object.entries(it.sizeMaterialPricing["__material_only__"]).map(([m, p]) => [m, String(p)]))
          : {},
        sizeMaterialPricing: it.sizeMaterialPricing && !Object.keys(it.sizeMaterialPricing).includes("__material_only__") ? it.sizeMaterialPricing : {},
        sizes: it.sizes ?? [],
        colors: it.colors ?? [],
        images: it.images ?? [],
        sortOrder: it.sortOrder,
      };
    }) ?? []
  );
  const [manualVariants, setManualVariants] = useState(initial?.manualVariants ?? false);
  const [relatedProductIds, setRelatedProductIds] = useState<string[]>(initial?.relatedProductIds ?? []);
  const [variants, setVariants] = useState<VariantDraft[]>(
    initial?.variants?.map((v) => ({
      id: v.id,
      name: v.name ?? "",
      description: v.description ?? "",
      code: v.code ?? "",
      price: v.price != null ? String(v.price) : "",
      discount: v.discount != null ? String(v.discount) : "",
      size: v.size ?? "",
      color: v.color ?? "",
      sizePricing: v.sizePricing ?
        Object.entries(v.sizePricing).reduce((acc, [size, pricing]) => ({
          ...acc,
          [size]: Object.entries(pricing).reduce((matAcc, [material, price]) => ({
            ...matAcc,
            [material]: String(price)
          }), {})
        }), {}) : {},
      sizeMaterialPricing: v.sizeMaterialPricing ?
        Object.entries(v.sizeMaterialPricing).reduce((acc, [size, materials]) => ({
          ...acc,
          [size]: Object.entries(materials).reduce((matAcc, [material, price]) => ({
            ...matAcc,
            [material]: String(price)
          }), {})
        }), {}) : {},
      sizes: v.sizes ?? [],
      sku: v.sku ?? "",
      images: v.images ?? [],
      sortOrder: v.sortOrder ?? 0,
    })) ?? []
  );

  // Flatten the recursive tree into a flat option list with indentation.
  // Deduplicate by id in case backend returns duplicated nodes in the tree.
  type CatOption = { value: string; label: string };
  function flattenCats(
    nodes: typeof categoryGroups,
    depth = 0,
    seen = new Set<string>()
  ): CatOption[] {
    const options: CatOption[] = [];
    for (const n of nodes) {
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      options.push({
        value: n.id,
        label: `${"  ".repeat(depth)}${depth > 0 ? "· " : "— "}${n.name}`,
      });
      options.push(...flattenCats(n.children, depth + 1, seen));
    }
    return options;
  }
  const ooposOptions = flattenCats(categoryGroups);
  const localCatOptions: CatOption[] = localCategoriesRaw.map((c) => ({
    value: c.id,
    label: `— ${c.name} (local)`,
  }));
  // Merge: OOPOS first, then local ones not already present
  const seenValues = new Set(ooposOptions.map((o) => o.value));
  const allCategories = [
    ...ooposOptions,
    ...localCatOptions.filter((o) => !seenValues.has(o.value)),
  ];

  const normalizeSizeMaterialPricing = (
    source?: Record<string, Record<string, string | number>>
  ): Record<string, Record<string, number>> | undefined => {
    if (!source) return undefined;

    const normalized: Record<string, Record<string, number>> = {};

    Object.entries(source).forEach(([sizeRaw, materials]) => {
      const size = String(sizeRaw).trim();
      if (!size || !materials || typeof materials !== "object") return;

      const nextMaterials: Record<string, number> = {};
      Object.entries(materials).forEach(([materialRaw, priceRaw]) => {
        const material = String(materialRaw).trim();
        const parsed = Number(priceRaw);
        if (!material || !Number.isFinite(parsed) || parsed < 0) return;
        nextMaterials[material] = parsed;
      });

      if (Object.keys(nextMaterials).length > 0) {
        normalized[size] = nextMaterials;
      }
    });

    return Object.keys(normalized).length > 0 ? normalized : undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedSizes = sizes.map((s) => s.trim()).filter(Boolean);
    
    // Filter pricing maps to only include colors that are currently selected in the form
    const filteredMaterialPricing: Record<string, string> = {};
    Object.entries(materialPricing).forEach(([colorId, val]) => {
      if (colors.includes(colorId)) {
        filteredMaterialPricing[colorId] = val;
      }
    });

    const filteredSizeMaterialPricing: Record<string, Record<string, string>> = {};
    Object.entries(sizeMaterialPricing).forEach(([size, colorPrices]) => {
      if (cleanedSizes.includes(size)) {
        filteredSizeMaterialPricing[size] = {};
        Object.entries(colorPrices).forEach(([colorId, val]) => {
          if (colors.includes(colorId)) {
            filteredSizeMaterialPricing[size][colorId] = val;
          }
        });
      }
    });

    const backendSizeMaterialPricing = normalizeSizeMaterialPricing(filteredSizeMaterialPricing);
    const backendMaterialPricing = normalizeSizeMaterialPricing({
      [MATERIAL_ONLY_SIZE_KEY]: filteredMaterialPricing,
    });
    const backendSizePricing = Object.fromEntries(
      cleanedSizes
        .map((size) => [size, Number(sizePrices[size])])
        .filter(([, price]) => Number.isFinite(price as number) && (price as number) >= 0)
        .map(([size, price]) => [size, { price: price as number }])
    );
    const parsedDirectPrice = Number(directPrice);
    const cleanedItems = items
      .map((it, i) => ({ it, i }))
      .filter(({ it }) => it.name.trim().length > 0)
      .map(({ it, i }) => {
        const itemData: any = {
          ...(it.id ? { id: it.id } : {}),
          name: it.name.trim(),
          code: (it.code ?? "").trim() || undefined,
          description: (it.description ?? "").trim() || undefined,
          sizes: it.sizes.map((s) => s.trim()).filter(Boolean),
          colors: it.colors.length > 0 ? it.colors : undefined,
          images: it.images,
          sortOrder: i,
        };

        // Handle pricing based on mode
        const pricingMode = it.pricingMode ?? "size_material";
        if (pricingMode === "direct" && it.directPrice) {
          itemData.price = Number(it.directPrice);
        } else if (pricingMode === "size" && it.sizePrices && Object.keys(it.sizePrices).length > 0) {
          itemData.sizePricing = Object.fromEntries(
            Object.entries(it.sizePrices)
              .filter(([_, price]) => Number.isFinite(Number(price)) && Number(price) >= 0)
              .map(([size, price]) => [size.trim(), { price: Number(price) }])
          );
        } else if (pricingMode === "material" && it.materialPricing && Object.keys(it.materialPricing).length > 0) {
          itemData.sizeMaterialPricing = {
            "__material_only__": Object.fromEntries(
              Object.entries(it.materialPricing)
                .filter(([_, price]) => Number.isFinite(Number(price)) && Number(price) >= 0)
                .map(([material, price]) => [material.trim(), Number(price)])
            )
          };
        } else if (pricingMode === "size_material") {
          itemData.sizeMaterialPricing = normalizeSizeMaterialPricing(it.sizeMaterialPricing as Record<string, Record<string, string | number>>);
        }

        return itemData;
      });

    const cleanedVariants = manualVariants
      ? variants
        .map((v, i) => ({ v, i }))
        .filter(({ v }) => (v.name ?? "").trim().length > 0 || v.size || v.color || v.style)
        .map(({ v, i }) => ({
          ...(v.id ? { id: v.id } : {}),
          name: (v.name ?? "").trim() || undefined,
          description: (v.description ?? "").trim() || undefined,
          code: (v.code ?? "").trim() || undefined,
          price: v.price ? Number(v.price) : undefined,
          discount: v.discount ? Number(v.discount) : undefined,
          size: (v.size ?? "").trim() || undefined,
          color: (v.color ?? "").trim() || undefined,
          style: (v.style ?? "").trim() || undefined,
          sizePricing: v.sizePricing && Object.keys(v.sizePricing).length > 0
            ? Object.fromEntries(
              Object.entries(v.sizePricing).map(([size, pricing]) => [
                size.trim(),
                {
                  price: pricing.price ? Number(pricing.price) : undefined,
                  discount: pricing.discount ? Number(pricing.discount) : undefined,
                }
              ])
            )
            : undefined,
          sizeMaterialPricing: normalizeSizeMaterialPricing(v.sizeMaterialPricing as Record<string, Record<string, string | number>>),
          sizes: v.sizes.map((s) => s.trim()).filter(Boolean),
          sku: (v.sku ?? "").trim() || undefined,
          images: v.images,
          sortOrder: i,
        }))
      : undefined;

    await onSubmit({
      name: name.trim() || undefined,
      code: code.trim(),
      description,
      categoryId: categoryId || undefined,
      manualVariants,
      variants: manualVariants && cleanedVariants && cleanedVariants.length > 0 ? cleanedVariants : undefined,
      sizes:
        !manualVariants && pricingMode === "direct"
          ? [] // Explicitly clear sizes for direct pricing
          : !manualVariants && pricingMode === "size"
            ? (cleanedSizes.length > 0 ? cleanedSizes : undefined)
            : !manualVariants && pricingMode === "material"
              ? [MATERIAL_ONLY_SIZE_KEY]
              : !manualVariants && pricingMode === "size_material"
                ? (cleanedSizes.length > 0 ? cleanedSizes : undefined)
                : undefined,
      // In size-only mode, explicitly clear colors so the frontend doesn't show a color picker
      colors: !manualVariants && pricingMode === "size"
        ? []
        : (!manualVariants && colors.length > 0 ? colors : undefined),
      styles: styles.length > 0 ? styles : undefined,
      isDetailsEnabled,
      details: details.filter(d => d.key.trim() && d.value.trim()),
      prices:
        !manualVariants && pricingMode === "direct" && Number.isFinite(parsedDirectPrice) && parsedDirectPrice >= 0
          ? [parsedDirectPrice]
          : undefined,
      sizePricing:
        !manualVariants && pricingMode === "size" && Object.keys(backendSizePricing).length > 0
          ? backendSizePricing
          // Explicitly null to clear in DB when not in size mode
          : (!manualVariants && pricingMode !== "size" ? null : undefined),
      sizeMaterialPricing:
        !manualVariants && pricingMode === "material"
          ? backendMaterialPricing
          : !manualVariants && pricingMode === "size_material"
            ? backendSizeMaterialPricing
            // Explicitly null to clear in DB when not in material/size_material mode
            : (!manualVariants ? null : undefined),
      images,
      items: cleanedItems.length > 0 ? cleanedItems : undefined,
      relatedProductIds: relatedProductIds.length > 0 ? relatedProductIds : [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Informations générales ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Informations générales</h2>

        <Input
          label="Code du produit *"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ex. LIT-TRIOMPHE-001"
        />

        <Input
          label="Nom du produit"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex. Parure Athena"
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Décrivez le produit…"
          rows={4}
        />

        <Select
          label="Catégorie"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={allCategories}
          placeholder="— Choisir une catégorie —"
        />

        <StyleMultiSelect
          label="Styles (appuyer Entrée pour valider)"
          value={styles}
          onChange={setStyles}
        />
      </section>

      {/* ── Détails ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Détails (Tableau)</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDetailsEnabled}
              onChange={(e) => setIsDetailsEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Activer l'affichage des détails</span>
          </label>
        </div>

        {isDetailsEnabled && (
          <div className="space-y-3">
            {details.map((detail, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    label=""
                    value={detail.key}
                    onChange={(e) => {
                      const next = [...details];
                      next[index].key = e.target.value;
                      setDetails(next);
                    }}
                    placeholder="Clé (ex: Dimensions)"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    label=""
                    value={detail.value}
                    onChange={(e) => {
                      const next = [...details];
                      next[index].value = e.target.value;
                      setDetails(next);
                    }}
                    placeholder="Valeur (ex: 200 x 160 cm)"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = [...details];
                    next.splice(index, 1);
                    setDetails(next);
                  }}
                  className="text-red-500 hover:text-red-700 p-2 font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDetails([...details, { key: "", value: "" }])}
            >
              + Ajouter une ligne
            </Button>
          </div>
        )}
      </section>

      {/* ── Tarification ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Tarification</h2>

        <Select
          label="Mode de prix"
          value={pricingMode}
          onChange={(e) => setPricingMode(e.target.value as PricingMode)}
          options={[
            { value: "direct", label: "Prix simple" },
            { value: "size", label: "Prix par taille" },
            { value: "material", label: "Prix par couleur" },
            { value: "size_material", label: "Prix par taille + couleur" },
          ]}
        />

        {pricingMode === "direct" && (
          <Input
            label="Prix (DT)"
            type="number"
            min="0"
            step="0.01"
            value={directPrice}
            onChange={(e) => setDirectPrice(e.target.value)}
            placeholder="ex. 149.90"
          />
        )}

        {(pricingMode === "size" || pricingMode === "size_material") && (
          <TagInput
            label="Tailles (appuyer Entrée pour valider)"
            value={sizes}
            onChange={(nextSizes) => {
              setSizes(nextSizes);
              setSizePrices((prev) => {
                const next: Record<string, string> = {};
                nextSizes.forEach((size) => {
                  next[size] = prev[size] ?? "";
                });
                return next;
              });
              setSizeMaterialPricing((prev) => {
                const next: Record<string, Record<string, string>> = {};
                nextSizes.forEach((size) => {
                  next[size] = prev[size] ?? {};
                });
                return next;
              });
            }}
            placeholder="ex. 140×200, 160×200…"
          />
        )}

        {pricingMode === "size" && sizes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Prix par taille</p>
            {sizes.map((size) => (
              <div key={size} className="grid grid-cols-[180px_1fr] gap-2 items-center">
                <span className="text-sm text-gray-700">{size}</span>
                <Input
                  label=""
                  type="number"
                  min="0"
                  step="0.01"
                  value={sizePrices[size] ?? ""}
                  onChange={(e) =>
                    setSizePrices((prev) => ({
                      ...prev,
                      [size]: e.target.value,
                    }))
                  }
                  placeholder="Prix (DT)"
                />
              </div>
            ))}
          </div>
        )}

        {pricingMode === "material" && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Prix par couleur</p>
            {colors.length === 0 && (
              <p className="text-xs text-gray-400 italic">Aucune couleur sélectionnée. Ajoutez des couleurs ci-dessous.</p>
            )}
            {colors.length > 0 && (
              <div className="space-y-2">
                {colors.map((colorId) => {
                  const color = allColorsList.find(c => c.id === colorId);
                  if (!color) return null;
                  return (
                    <div key={color.id} className="grid grid-cols-[40px_140px_1fr] gap-2 items-center">
                      <span className="w-6 h-6 rounded-full border border-gray-300 flex-shrink-0" style={{ backgroundColor: color.hex }} />
                      <span className="text-sm font-medium text-gray-700">{color.nameFr}</span>
                      <Input
                        label=""
                        type="number"
                        step="0.01"
                        min="0"
                        value={materialPricing[color.id] ?? ""}
                        onChange={(e) =>
                          setMaterialPricing((prev) => ({
                            ...prev,
                            [color.id]: e.target.value,
                          }))
                        }
                        placeholder="Prix (DT) — vide = non disponible"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {(pricingMode === "direct" || pricingMode === "material" || pricingMode === "size_material") && (
          <ColorMultiSelect
            label="Couleurs (appuyer Entrée pour valider)"
            value={colors}
            onChange={setColors}
          />
        )}
      </section>

      {/* ── Size Color Pricing ── */}
      {pricingMode === "size_material" && sizes.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Prix par Taille & Couleur</h2>
          {sizes.map((size) => (
            <div key={size} className="border border-gray-100 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-gray-700">Taille: {size}</h3>
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600">Prix par couleur pour cette taille</p>
                {colors.map((colorId) => {
                  const color = allColorsList.find(c => c.id === colorId);
                  if (!color) return null;
                  return (
                    <div key={color.id} className="grid grid-cols-[40px_140px_1fr] gap-2 items-center">
                      <span className="w-6 h-6 rounded-full border border-gray-300" style={{ backgroundColor: color.hex }} />
                      <span className="text-sm text-gray-700">{color.nameFr}</span>
                      <Input
                        label=""
                        type="number"
                        step="0.01"
                        min="0"
                        value={sizeMaterialPricing[size]?.[color.id] ?? ""}
                        onChange={(e) =>
                          setSizeMaterialPricing((prev) => ({
                            ...prev,
                            [size]: {
                              ...(prev[size] ?? {}),
                              [color.id]: e.target.value,
                            },
                          }))
                        }
                        placeholder="Prix (DT) — vide = non disponible"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Images du produit</h2>
        <ImageUploader
          value={images}
          onChange={(paths) => setImages(Array.isArray(paths) ? paths : paths ? [paths] : [])}
          label="Photos principales"
        />
      </section>

      {/* ── Variantes ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Variantes</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={manualVariants}
              onChange={(e) => setManualVariants(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Gérer manuellement les variantes</span>
          </label>
        </div>

        {manualVariants ? (
          <ProductVariantsEditor
            variants={variants}
            onChange={setVariants}
            productSizes={sizes}
            productColors={colors}
          />
        ) : (
          <p className="text-sm text-gray-600">
            Les variantes seront générées automatiquement à partir des tailles, couleurs et prix configurés ci-dessus.
          </p>
        )}
      </section>

      {/* ── Pièces du produit ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <ProductItemsEditor
          items={items}
          onChange={setItems}
          productMaterials={sizeMaterialPricing}
          productSizes={sizes}
        />
      </section>

      {/* ── Produits associés (VOUS POUVEZ AUSSI ACHETER) ── */}
      {initial?.id && (
        <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800">Produits associés</h2>
            <p className="text-sm text-gray-500 mt-1">
              Ces produits apparaîtront dans la section &laquo;&nbsp;VOUS POUVEZ AUSSI ACHETER&nbsp;&raquo; sur la page de ce produit.
            </p>
          </div>
          <RelatedProductsPicker
            value={relatedProductIds}
            onChange={setRelatedProductIds}
            excludeId={initial?.id}
          />
        </section>
      )}

      {/* ── Submit ── */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={loading}>
          {initial ? "Enregistrer les modifications" : "Créer le produit"}
        </Button>
      </div>
    </form>
  );
}
