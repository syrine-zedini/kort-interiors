"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import ImageUploader from "@/components/ui/ImageUploader";
import ColorMultiSelect from "@/components/ui/ColorMultiSelect";

export interface ItemDraft {
  id?: string;        // present when editing existing
  name: string;
  code?: string;
  description?: string;
  pricingMode?: "direct" | "size" | "material" | "size_material";
  directPrice?: string;
  sizePrices?: Record<string, string>;
  materialPricing?: Record<string, string>;
  sizeMaterialPricing?: Record<string, Record<string, number>>;
  sizes: string[];
  colors: string[];   // color IDs
  images: string[];
  sortOrder: number;
}

interface ProductItemsEditorProps {
  items: ItemDraft[];
  onChange: (items: ItemDraft[]) => void;
  productMaterials?: Record<string, Record<string, string | number>>;
  productSizes?: string[];
}

const empty = (): ItemDraft => ({
  name: "",
  code: "",
  description: "",
  pricingMode: "size_material",
  directPrice: "",
  sizePrices: {},
  materialPricing: {},
  sizeMaterialPricing: {},
  sizes: [],
  colors: [],
  images: [],
  sortOrder: 0,
});

export default function ProductItemsEditor({ items, onChange, productMaterials, productSizes }: ProductItemsEditorProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  // Get list of all materials available from product
  const allMaterials = productMaterials
    ? Array.from(new Set(Object.values(productMaterials).flatMap(materials => Object.keys(materials))))
    : [];

  const add = () => {
    const next = [...items, { ...empty(), sortOrder: items.length }];
    onChange(next);
    setExpanded(next.length - 1);
  };

  const remove = (idx: number) => {
    const next = items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sortOrder: i }));
    onChange(next);
    if (expanded === idx) setExpanded(null);
  };

  const update = (idx: number, patch: Partial<ItemDraft>) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Pièces du produit
          <span className="ml-2 text-xs font-normal text-gray-400">(ex. Taie, Housse de couette, Drap…)</span>
        </h3>
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          <Plus size={14} /> Ajouter une pièce
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          Aucune pièce — ce produit est vendu seul.
        </p>
      )}

      {items.map((item, idx) => (
        <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Header row */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
            onClick={() => setExpanded(expanded === idx ? null : idx)}
          >
            <span className="text-sm font-medium text-gray-800">
              {item.name || <span className="text-gray-400 italic">Pièce sans nom</span>}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); remove(idx); }}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={15} />
              </button>
              {expanded === idx ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
            </div>
          </div>

          {/* Expanded form */}
          {expanded === idx && (
            <div className="p-4 space-y-6 border-t border-gray-100">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <Input
                  label="Nom de la pièce *"
                  value={item.name}
                  onChange={(e) => update(idx, { name: e.target.value })}
                  placeholder="ex. Taie d'oreiller 65×65"
                />
                <Input
                  label="Code de la pièce"
                  value={item.code ?? ""}
                  onChange={(e) => update(idx, { code: e.target.value })}
                  placeholder="ex. LIT-TRIOMPHE-001-TAIE"
                />
                <Textarea
                  label="Description"
                  value={item.description ?? ""}
                  onChange={(e) => update(idx, { description: e.target.value })}
                  placeholder="Détails spécifiques à cette pièce…"
                />
              </div>

              {/* Tarification Section */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-800">Tarification</h3>

                {/* Mode de prix */}
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-2">Mode de prix</label>
                  <select
                    value={item.pricingMode ?? "size_material"}
                    onChange={(e) => update(idx, { pricingMode: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="direct">Prix simple</option>
                    <option value="size">Prix par taille</option>
                    <option value="material">Prix par matériau</option>
                    <option value="size_material">Prix par taille + matériau</option>
                  </select>
                </div>

                {/* Direct Price */}
                {item.pricingMode === "direct" && (
                  <Input
                    label="Prix (DT)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.directPrice ?? ""}
                    onChange={(e) => update(idx, { directPrice: e.target.value })}
                    placeholder="ex. 149.90"
                  />
                )}

                {/* Size Prices */}
                {item.pricingMode === "size" && item.sizes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-600">Prix par taille</p>
                    {item.sizes.map((size) => (
                      <div key={size} className="grid grid-cols-[120px_1fr] gap-2 items-center">
                        <span className="text-xs text-gray-600">{size}</span>
                        <Input
                          label=""
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.sizePrices?.[size] ?? ""}
                          onChange={(e) => {
                            update(idx, {
                              sizePrices: {
                                ...(item.sizePrices ?? {}),
                                [size]: e.target.value,
                              },
                            });
                          }}
                          placeholder="Prix (DT)"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Material Pricing */}
                {item.pricingMode === "material" && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-gray-600">Prix par matériau</p>
                    {allMaterials.length > 0 ? (
                      <>
                        <div>
                          <label className="text-xs font-medium text-gray-600 block mb-2">Sélectionner un matériau</label>
                          <select
                            onChange={(e) => {
                              const material = e.target.value;
                              if (material && !item.materialPricing?.[material]) {
                                update(idx, {
                                  materialPricing: {
                                    ...(item.materialPricing ?? {}),
                                    [material]: "",
                                  },
                                });
                              }
                              e.target.value = "";
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Ajouter un matériau...</option>
                            {allMaterials.map((m) => (
                              <option key={m} value={m} disabled={!!item.materialPricing?.[m]}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>
                        {Object.keys(item.materialPricing ?? {}).length > 0 && (
                          <div className="space-y-2 border-t border-gray-100 pt-3">
                            {Object.entries(item.materialPricing ?? {}).map(([material]) => (
                              <div key={material} className="grid grid-cols-[150px_1fr_50px] gap-2 items-center">
                                <span className="text-sm font-medium text-gray-700">{material}</span>
                                <Input
                                  label=""
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.materialPricing?.[material] ?? ""}
                                  onChange={(e) => {
                                    update(idx, {
                                      materialPricing: {
                                        ...(item.materialPricing ?? {}),
                                        [material]: e.target.value,
                                      },
                                    });
                                  }}
                                  placeholder="Prix (DT)"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = { ...(item.materialPricing ?? {}) };
                                    delete next[material];
                                    update(idx, { materialPricing: next });
                                  }}
                                  className="text-red-500 hover:text-red-700 text-sm font-bold"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-500 italic">Aucun matériau défini dans le produit principal</p>
                    )}
                  </div>
                )}

                {/* Size + Material Pricing */}
                {item.pricingMode === "size_material" && item.sizes.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-gray-600">Prix par Taille & Matériau</p>
                    {item.sizes.map((size) => (
                      <div key={size} className="border border-gray-100 rounded-lg p-3 space-y-2">
                        <h4 className="text-xs font-medium text-gray-600">Taille: {size}</h4>
                        {allMaterials.length > 0 ? (
                          <>
                            <div>
                              <label className="text-xs font-medium text-gray-600 block mb-2">Sélectionner un matériau</label>
                              <select
                                onChange={(e) => {
                                  const material = e.target.value;
                                  if (material && !item.sizeMaterialPricing?.[size]?.[material]) {
                                    update(idx, {
                                      sizeMaterialPricing: {
                                        ...(item.sizeMaterialPricing ?? {}),
                                        [size]: {
                                          ...(item.sizeMaterialPricing?.[size] ?? {}),
                                          [material]: 0,
                                        },
                                      },
                                    });
                                  }
                                  e.target.value = "";
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              >
                                <option value="">Ajouter un matériau...</option>
                                {allMaterials.map((m) => (
                                  <option key={m} value={m} disabled={!!item.sizeMaterialPricing?.[size]?.[m]}>
                                    {m}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {(item.sizeMaterialPricing?.[size] && Object.keys(item.sizeMaterialPricing[size]).length > 0) && (
                              <div className="space-y-2 border-t border-gray-100 pt-2">
                                {Object.entries(item.sizeMaterialPricing[size] ?? {}).map(([material]) => (
                                  <div key={material} className="grid grid-cols-[150px_1fr_50px] gap-2 items-center">
                                    <span className="text-xs text-gray-600">{material}</span>
                                    <Input
                                      label=""
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={item.sizeMaterialPricing?.[size]?.[material] ?? ""}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        update(idx, {
                                          sizeMaterialPricing: {
                                            ...(item.sizeMaterialPricing ?? {}),
                                            [size]: {
                                              ...(item.sizeMaterialPricing?.[size] ?? {}),
                                              [material]: value === "" ? 0 : Number(value),
                                            },
                                          },
                                        });
                                      }}
                                      placeholder="Prix"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextSizePricing = { ...(item.sizeMaterialPricing ?? {}) };
                                        const nextMaterials = { ...(nextSizePricing[size] ?? {}) };
                                        delete nextMaterials[material];

                                        if (Object.keys(nextMaterials).length === 0) {
                                          delete nextSizePricing[size];
                                        } else {
                                          nextSizePricing[size] = nextMaterials;
                                        }

                                        update(idx, {
                                          sizeMaterialPricing: nextSizePricing,
                                        });
                                      }}
                                      className="text-red-500 hover:text-red-700 text-xs font-bold"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-gray-500 italic">Aucun matériau défini dans le produit principal</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Couleurs */}
                <ColorMultiSelect
                  label="Couleurs (appuyer Entrée pour valider)"
                  value={item.colors}
                  onChange={(c) => update(idx, { colors: c })}
                />
              </div>

              {/* Images Section */}
              <ImageUploader
                label="Images de la pièce"
                value={item.images}
                onChange={(imgs) => update(idx, { images: Array.isArray(imgs) ? imgs : imgs ? [imgs] : [] })}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
