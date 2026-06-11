"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import TagInput from "@/components/ui/TagInput";
import ImageUploader from "@/components/ui/ImageUploader";
import ColorMultiSelect from "@/components/ui/ColorMultiSelect";
import { fetchColors, fetchStyles } from "@/lib/api";
import { VariantDraft } from "@/types/product";

interface ProductVariantsEditorProps {
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
  productSizes?: string[];
  productColors?: string[];
}

const empty = (index: number): VariantDraft => ({
  name: "",
  description: "",
  code: "",
  price: "",
  discount: "",
  size: "",
  color: "",
  style: "",
  sizePricing: {},
  sizeMaterialPricing: {},
  sizes: [],
  sku: "",
  images: [],
  sortOrder: index,
});

export default function ProductVariantsEditor({
  variants,
  onChange,
  productSizes = [],
  productColors = [],
}: ProductVariantsEditorProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const { data: colors = [] } = useQuery({ queryKey: ["colors"], queryFn: fetchColors });
  const { data: styles = [] } = useQuery({ queryKey: ["styles"], queryFn: fetchStyles });

  const colorMap = new Map(colors.map((c) => [c.id, c.nameFr]));
  const styleMap = new Map(styles.map((s) => [s.id, s.nameFr]));

  const add = () => {
    const next = [...variants, empty(variants.length)];
    onChange(next);
    setExpanded(next.length - 1);
  };

  const remove = (idx: number) => {
    const next = variants.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sortOrder: i }));
    onChange(next);
    if (expanded === idx) setExpanded(null);
  };

  const update = (idx: number, patch: Partial<VariantDraft>) => {
    onChange(variants.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Variantes
          <span className="ml-2 text-xs font-normal text-gray-400">(ex. Taille, Couleur, Matériau…)</span>
        </h3>
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          <Plus size={14} /> Ajouter une variante
        </Button>
      </div>

      {variants.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          Aucune variante — ce produit est vendu sans variantes manuelles.
        </p>
      )}

      {variants.map((variant, idx) => (
        <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Header row */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
            onClick={() => setExpanded(expanded === idx ? null : idx)}
          >
            <span className="text-sm font-medium text-gray-800">
              {variant.name || (
                <>
                  {variant.size && <span>{variant.size}</span>}
                  {variant.color && variant.size && <span> • </span>}
                  {variant.color && <span>{colorMap.get(variant.color) || variant.color}</span>}
                  {variant.style && (variant.size || variant.color) && <span> • </span>}
                  {variant.style && <span>{styleMap.get(variant.style) || variant.style}</span>}
                  {(!variant.size && !variant.color && !variant.style) && (
                    <span className="text-gray-400 italic">Variante sans nom</span>
                  )}
                </>
              )}
              {variant.sku && <span className="ml-2 text-xs text-gray-500 font-mono">{variant.sku}</span>}
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
            <div className="p-4 grid grid-cols-1 gap-4 border-t border-gray-100">
              <Input
                label="Nom de la variante"
                value={variant.name ?? ""}
                onChange={(e) => update(idx, { name: e.target.value })}
                placeholder="ex. S - Bleu - Coton"
              />
              <Input
                label="Code de la variante"
                value={variant.code ?? ""}
                onChange={(e) => update(idx, { code: e.target.value })}
                placeholder="ex. VAR-001"
              />
              <Textarea
                label="Description"
                value={variant.description ?? ""}
                onChange={(e) => update(idx, { description: e.target.value })}
                placeholder="Détails spécifiques à cette variante…"
              />

              {/* Size, Color selection */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Taille"
                  value={variant.size ?? ""}
                  onChange={(e) => update(idx, { size: e.target.value })}
                  placeholder="ex. S, M, L"
                  list="product-sizes"
                />
                <datalist id="product-sizes">
                  {productSizes.map((size) => (
                    <option key={size} value={size} />
                  ))}
                </datalist>
                <Select
                  label="Couleur"
                  value={variant.color ?? ""}
                  onChange={(e) => update(idx, { color: e.target.value })}
                  options={[
                    { value: "", label: "— Choisir une couleur —" },
                    ...colors.map((color) => ({
                      value: color.id,
                      label: color.nameFr,
                    })),
                  ]}
                />
                <Select
                  label="Style"
                  value={variant.style ?? ""}
                  onChange={(e) => update(idx, { style: e.target.value })}
                  options={[
                    { value: "", label: "— Choisir un style —" },
                    ...styles.map((style) => ({
                      value: style.id,
                      label: style.nameFr,
                    })),
                  ]}
                />
              </div>

              {/* Pricing */}
              <div className="border-t border-gray-100 pt-3 space-y-3">
                <p className="text-sm font-medium text-gray-700">Tarification</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Prix (DT)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={variant.price ?? ""}
                    onChange={(e) => update(idx, { price: e.target.value })}
                    placeholder="ex. 49.99"
                  />
                  <Input
                    label="Remise (DT)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={variant.discount ?? ""}
                    onChange={(e) => update(idx, { discount: e.target.value })}
                    placeholder="ex. 5.00"
                  />
                </div>
              </div>

              {/* Size Material Pricing */}
              {variant.sizes.length > 0 && (
                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <p className="text-xs font-medium text-gray-600">Prix par Taille & Matériau</p>
                  {variant.sizes.map((size) => (
                    <div key={size} className="border border-gray-100 rounded p-2 space-y-2">
                      <h4 className="text-xs font-medium text-gray-600">Taille: {size}</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Matériau..."
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget.value.trim();
                              if (input) {
                                update(idx, {
                                  sizeMaterialPricing: {
                                    ...(variant.sizeMaterialPricing ?? {}),
                                    [size]: {
                                      ...(variant.sizeMaterialPricing?.[size] ?? {}),
                                      [input]: "",
                                    },
                                  },
                                });
                                e.currentTarget.value = "";
                              }
                            }
                          }}
                        />
                      </div>
                      {(variant.sizeMaterialPricing?.[size] && Object.keys(variant.sizeMaterialPricing[size]).length > 0) && (
                        <div className="space-y-1">
                          {Object.entries(variant.sizeMaterialPricing[size] ?? {}).map(([material]) => (
                            <div key={material} className="grid grid-cols-[120px_1fr_40px] gap-2 items-center">
                              <span className="text-xs text-gray-600">{material}</span>
                              <Input
                                label=""
                                type="number"
                                step="0.01"
                                min="0"
                                value={variant.sizeMaterialPricing?.[size]?.[material] ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  update(idx, {
                                    sizeMaterialPricing: {
                                      ...(variant.sizeMaterialPricing ?? {}),
                                      [size]: {
                                        ...(variant.sizeMaterialPricing?.[size] ?? {}),
                                        [material]: value,
                                      },
                                    },
                                  });
                                }}
                                placeholder="Prix"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const nextSizePricing = { ...(variant.sizeMaterialPricing ?? {}) };
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
                                className="text-red-500 text-xs font-bold"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Sizes and Stock */}
              <TagInput
                label="Tailles disponibles"
                value={variant.sizes}
                onChange={(s) => {
                  update(idx, { sizes: s });
                }}
                placeholder="ex. S, M, L — Entrée pour valider"
              />

              <Input
                label="SKU"
                value={variant.sku ?? ""}
                onChange={(e) => update(idx, { sku: e.target.value })}
                placeholder="Auto-généré si vide"
              />

              {/* Images */}
              <ImageUploader
                label="Images de la variante"
                value={variant.images}
                onChange={(imgs) => update(idx, { images: Array.isArray(imgs) ? imgs : imgs ? [imgs] : [] })}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
