import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { ProductWithVariants, ProductItem } from "../../types/product";
import { ProductCard } from "./card";
import { ProductDetails } from "./productDetails";
import { getAllColors } from "@/services/color.service";

interface ProductOrItem {
  type: "product" | "item";
  product: ProductWithVariants;
  item?: ProductItem;
}

interface Props {
  loading: boolean;
  data: ProductOrItem[];
  categorySlug: string;
}

type SortValue = "featured" | "price_asc" | "price_desc" | "name_asc" | "name_desc";

const MATERIAL_ONLY_SIZE_KEY = "__material_only__";

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "featured", label: "Trier par" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "name_asc", label: "Nom A - Z" },
  { value: "name_desc", label: "Nom Z - A" },
];

const STYLE_RULES: Record<string, string[]> = {
  Moderne: ["moderne", "minimal", "contemporain", "epure", "épuré"],
  Classique: ["classique", "traditionnel"],
  Luxe: ["luxe", "jacquard", "satin", "premium", "brode", "brodé"],
  Naturel: ["naturel", "lin", "coton", "bois"],
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getProductPrice(product: ProductWithVariants): number {
  const candidates: number[] = [];
  const pushPrice = (price?: unknown) => {
    const n = Number(price);
    if (Number.isFinite(n) && n > 0) candidates.push(n);
  };

  pushPrice(product.pricing?.finalPrice);
  if (product.price != null) {
    const base = Number(product.price);
    const discount = Number(product.discount ?? 0);
    pushPrice(Math.max(0, base - discount));
  }
  (product.variants ?? []).forEach((variant) => {
    if (variant.price == null) return;
    const base = Number(variant.price);
    const discount = Number(variant.discount ?? 0);
    pushPrice(Math.max(0, base - discount));
  });
  if (product.sizeMaterialPricingWithPromotion && typeof product.sizeMaterialPricingWithPromotion === "object") {
    Object.values(product.sizeMaterialPricingWithPromotion).forEach((materials) => {
      if (!materials || typeof materials !== "object") return;
      Object.values(materials).forEach((pricing: any) => pushPrice(pricing?.finalPrice));
    });
  }
  if (product.sizeMaterialPricing && typeof product.sizeMaterialPricing === "object") {
    Object.values(product.sizeMaterialPricing).forEach((materials) => {
      if (!materials || typeof materials !== "object") return;
      Object.values(materials).forEach((price) => pushPrice(price));
    });
  }
  return candidates.length > 0 ? Math.min(...candidates) : Number.POSITIVE_INFINITY;
}

function getItemPrice(item: ProductItem): number {
  const candidates: number[] = [];
  const pushPrice = (price?: unknown) => {
    const n = Number(price);
    if (Number.isFinite(n) && n > 0) candidates.push(n);
  };

  pushPrice(item.price);
  if (item.sizePricing && typeof item.sizePricing === "object") {
    Object.values(item.sizePricing).forEach((pricing) => {
      pushPrice(pricing?.price);
    });
  }
  if (item.sizeMaterialPricing && typeof item.sizeMaterialPricing === "object") {
    Object.values(item.sizeMaterialPricing).forEach((materials) => {
      if (!materials || typeof materials !== "object") return;
      Object.values(materials).forEach((price) => pushPrice(price));
    });
  }
  return candidates.length > 0 ? Math.min(...candidates) : Number.POSITIVE_INFINITY;
}

function getProductMaterials(product: ProductWithVariants): string[] {
  const map = new Map<string, string>();
  const addPricing = (pricing?: Record<string, Record<string, unknown>>) => {
    if (!pricing || typeof pricing !== "object") return;
    Object.entries(pricing).forEach(([size, materials]) => {
      if (!materials || typeof materials !== "object") return;
      if (size !== MATERIAL_ONLY_SIZE_KEY && size.trim().length === 0) return;
      Object.keys(materials).forEach((material) => {
        const label = material.trim();
        if (!label) return;
        const key = normalizeText(label);
        if (!map.has(key)) map.set(key, label);
      });
    });
  };
  addPricing(product.sizeMaterialPricing);
  (product.items ?? []).forEach((item) => addPricing(item.sizeMaterialPricing));
  return Array.from(map.values());
}

function getProductStyles(product: ProductWithVariants): string[] {
  const text = normalizeText(`${product.name ?? ""} ${product.description ?? ""}`);
  return Object.entries(STYLE_RULES)
    .filter(([, words]) => words.some((word) => text.includes(normalizeText(word))))
    .map(([style]) => style);
}

export default function List({ loading, data, categorySlug }: Props) {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<ProductWithVariants | null>(null);
  const [openFilter, setOpenFilter] = useState<"sort" | "color" | "material" | "style" | null>(null);
  const [sortBy, setSortBy] = useState<SortValue>("featured");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [colorMap, setColorMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const colors = await getAllColors();
        if (cancelled) return;
        const next: Record<string, string> = {};
        colors.forEach((c) => {
          next[c.id] = c.nameFr;
        });
        setColorMap(next);
      } catch {
        if (!cancelled) setColorMap({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableColors = useMemo(() => {
    const set = new Set<string>();
    data.forEach((item) => {
      const product = item.product;
      (product.colors ?? []).forEach((id) => set.add(id));
      (product.variants ?? []).forEach((v) => {
        if (v.color) set.add(v.color);
      });
      (product.items ?? []).forEach((pitem) => {
        (pitem.colors ?? []).forEach((id) => set.add(id));
      });
      if (item.item?.colors) {
        item.item.colors.forEach((id) => set.add(id));
      }
    });
    return Array.from(set);
  }, [data]);

  const availableMaterials = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach((item) => {
      const product = item.product;
      getProductMaterials(product).forEach((material) => {
        const key = normalizeText(material);
        if (!map.has(key)) map.set(key, material);
      });
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, "fr"));
  }, [data]);

  const availableStyles = useMemo(() => {
    const set = new Set<string>();
    data.forEach((item) => {
      getProductStyles(item.product).forEach((s) => set.add(s));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [data]);

  const filteredData = useMemo(() => {
    let list = [...data];

    if (selectedColors.length > 0) {
      list = list.filter((item) => {
        const product = item.product;
        const ids = new Set<string>();
        (product.colors ?? []).forEach((id) => ids.add(id));
        (product.variants ?? []).forEach((v) => {
          if (v.color) ids.add(v.color);
        });
        (product.items ?? []).forEach((pitem) => {
          (pitem.colors ?? []).forEach((id) => ids.add(id));
        });
        if (item.item?.colors) {
          item.item.colors.forEach((id) => ids.add(id));
        }
        return selectedColors.some((id) => ids.has(id));
      });
    }

    if (selectedMaterials.length > 0) {
      list = list.filter((item) => {
        const product = item.product;
        const keys = new Set(getProductMaterials(product).map((m) => normalizeText(m)));
        return selectedMaterials.some((material) => keys.has(normalizeText(material)));
      });
    }

    if (selectedStyles.length > 0) {
      list = list.filter((item) => {
        const product = item.product;
        const styles = new Set(getProductStyles(product));
        return selectedStyles.some((style) => styles.has(style));
      });
    }

    list.sort((a, b) => {
      const aName = a.item?.name ?? a.product.name ?? a.product.code ?? "";
      const bName = b.item?.name ?? b.product.name ?? b.product.code ?? "";
      const aPrice = a.item ? getItemPrice(a.item) : getProductPrice(a.product);
      const bPrice = b.item ? getItemPrice(b.item) : getProductPrice(b.product);

      if (sortBy === "name_asc") return aName.localeCompare(bName, "fr");
      if (sortBy === "name_desc") return bName.localeCompare(aName, "fr");
      if (sortBy === "price_asc") return aPrice - bPrice;
      if (sortBy === "price_desc") return bPrice - aPrice;
      return 0;
    });

    return list;
  }, [data, selectedColors, selectedMaterials, selectedStyles, sortBy]);

  const toggleValue = (value: string, current: string[], setter: (next: string[]) => void) => {
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px", padding: "40px" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: "#f5f3f0", aspectRatio: "3/4", animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
    );
  }

  if (selectedProduct) {
    return (
      <div>
        <div style={{ padding: "20px 40px" }}>
          <button
            onClick={() => setSelectedProduct(null)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase",
              color: "#666", display: "flex", alignItems: "center", gap: "8px",
            }}
          >
            ← Retour
          </button>
        </div>
        <ProductDetails product={selectedProduct} categorySlug={categorySlug} />
      </div>
    );
  }

  return (
    <div>
      {/* Barre de filtres */}
      <div style={{
        position: "sticky", top: "68px", zIndex: 50,
        background: "#fff",
        borderBottom: "1px solid #ece8e2",
        padding: "16px 40px 14px",
      }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setOpenFilter(openFilter === "sort" ? null : "sort")}
              style={{
                background: "#fff",
                border: "1px solid #d5d0ca",
                borderRadius: 4,
                padding: "9px 14px",
                fontSize: 12,
                color: "#555",
                cursor: "pointer",
              }}
            >
              Trier par
            </button>
            {openFilter === "sort" && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, minWidth: 190, background: "#fff", border: "1px solid #e6e0d7", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", padding: 8 }}>
                {SORT_OPTIONS.filter((option) => option.value !== "featured").map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setOpenFilter(null);
                    }}
                    style={{ width: "100%", textAlign: "left", border: "none", background: sortBy === option.value ? "#f8f6f2" : "transparent", padding: "8px 10px", fontSize: 12, color: "#333", cursor: "pointer" }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setOpenFilter(openFilter === "color" ? null : "color")}
              style={{ background: "#fff", border: "1px solid #d5d0ca", borderRadius: 4, padding: "9px 14px", fontSize: 12, color: "#555", cursor: "pointer" }}
            >
              Couleur {selectedColors.length > 0 ? `(${selectedColors.length})` : ""}
            </button>
            {openFilter === "color" && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, minWidth: 220, maxHeight: 260, overflowY: "auto", background: "#fff", border: "1px solid #e6e0d7", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", padding: 10 }}>
                {availableColors.length === 0 && <span style={{ fontSize: 12, color: "#9a9a9a" }}>Aucune</span>}
                {availableColors.map((id) => (
                  <label key={id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "#444", padding: "4px 0" }}>
                    <input type="checkbox" checked={selectedColors.includes(id)} onChange={() => toggleValue(id, selectedColors, setSelectedColors)} />
                    {colorMap[id] ?? id}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setOpenFilter(openFilter === "material" ? null : "material")}
              style={{ background: "#fff", border: "1px solid #d5d0ca", borderRadius: 4, padding: "9px 14px", fontSize: 12, color: "#555", cursor: "pointer" }}
            >
              Matière {selectedMaterials.length > 0 ? `(${selectedMaterials.length})` : ""}
            </button>
            {openFilter === "material" && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, minWidth: 220, maxHeight: 260, overflowY: "auto", background: "#fff", border: "1px solid #e6e0d7", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", padding: 10 }}>
                {availableMaterials.length === 0 && <span style={{ fontSize: 12, color: "#9a9a9a" }}>Aucune</span>}
                {availableMaterials.map((material) => (
                  <label key={material} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "#444", padding: "4px 0" }}>
                    <input type="checkbox" checked={selectedMaterials.includes(material)} onChange={() => toggleValue(material, selectedMaterials, setSelectedMaterials)} />
                    {material}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setOpenFilter(openFilter === "style" ? null : "style")}
              style={{ background: "#fff", border: "1px solid #d5d0ca", borderRadius: 4, padding: "9px 14px", fontSize: 12, color: "#555", cursor: "pointer" }}
            >
              Style {selectedStyles.length > 0 ? `(${selectedStyles.length})` : ""}
            </button>
            {openFilter === "style" && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, minWidth: 220, maxHeight: 260, overflowY: "auto", background: "#fff", border: "1px solid #e6e0d7", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", padding: 10 }}>
                {availableStyles.length === 0 && <span style={{ fontSize: 12, color: "#9a9a9a" }}>Aucun</span>}
                {availableStyles.map((style) => (
                  <label key={style} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "#444", padding: "4px 0" }}>
                    <input type="checkbox" checked={selectedStyles.includes(style)} onChange={() => toggleValue(style, selectedStyles, setSelectedStyles)} />
                    {style}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grille produits */}
      {filteredData.length === 0 ? (
        <div
          style={{
            background: "#fff",
            padding: "80px 40px",
            textAlign: "center",
            color: "#aaa",
            fontSize: "13px",
            letterSpacing: "1px",
            minHeight: "280px",
          }}
        >
          Aucun produit ne correspond aux filtres.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3" style={{
          gap: "1px",
          background: "#ece8e2",
          padding: "1px",
        }}>
          {filteredData.filter(Boolean).map((item, i) => {
            const product = item.product;
            const isItemCard = item.type === "item";
            const cardItem = isItemCard ? item.item : null;
            const cardProduct = isItemCard ? null : product;

            return (
              <div key={`${product.id}-${cardItem?.id ?? 'main'}`} style={{ background: "#fff", padding: "24px" }}>
                {isItemCard && cardItem ? (
                  <div
                    onClick={() => {
                      const productSlug = (product.slug ?? product.id)?.replace(/\//g, '~');
                      router.push(`/products/${categorySlug}/${productSlug}/${cardItem.id}`);
                    }}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      height: "100%",
                    }}
                  >
                    <div style={{
                      aspectRatio: "3/4",
                      background: "#f5f3f0",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <img
                        src={(() => {
                          const img = cardItem.images?.[0];
                          if (!img || img === "/placeholder.png") return "/assets/imgs/products/article_1.jpg";
                          if (img.startsWith("http")) return img;
                          if (img.startsWith("/assets/")) return img;
                          return `${process.env.NEXT_PUBLIC_IMAGE_URL}${img}`;
                        })()}
                        alt={cardItem.name}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: "#888", margin: "0 0 4px", textTransform: "uppercase" }}>
                        Pièce du produit
                      </p>
                      <p style={{ fontSize: 12, color: "#1a1a1a", margin: "0 0 4px", fontWeight: 600, lineHeight: 1.4 }}>
                        {cardItem.name}
                      </p>
                      <p style={{ fontSize: 11, color: "#999", margin: 0 }}>
                        de {product.name}
                      </p>
                      {cardItem.price != null && (
                        <p style={{ fontSize: 14, color: "#1a1a1a", fontWeight: 600, margin: "8px 0 0" }}>
                          dès {Number(cardItem.price).toFixed(2)}DT
                        </p>
                      )}
                    </div>
                  </div>
                ) : cardProduct ? (
                  <ProductCard
                    product={cardProduct}
                    onSelect={() => {
                      const productSlug = ((cardProduct as any)?.slug ?? cardProduct?.id)?.replace(/\//g, '~');
                      router.push(`/products/${categorySlug}/${productSlug}`);
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
