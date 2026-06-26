import { useEffect, useState } from "react";
import Link from "next/link";
import { ClientSideLayout } from "../../layouts/client-side";
import Loader from "../../layouts/client-side/loader";
import { useCategories } from "../../hooks/useCategories";
import { ProductWithVariants, Pricing } from "../../types/product";
import { CategoryNode } from "../../types/category";
import api from "@/libs/axios";
import { FadeUp, StaggerContainer, StaggerItem } from "../../components/ui/Animate";

const editorialStyles = [
  { bg: "#0e0d0c", text: "#fff", border: "none", sub: "rgba(255,255,255,0.45)" },
  { bg: "#fff", text: "#0e0d0c", border: "1px solid #e8e4dc", sub: "rgba(14,13,12,0.45)" },
  { bg: "#f5f0e8", text: "#0e0d0c", border: "none", sub: "rgba(14,13,12,0.45)" },
  { bg: "#1c1c1c", text: "#fff", border: "none", sub: "rgba(255,255,255,0.45)" },
  { bg: "#fff", text: "#0e0d0c", border: "1px solid #e8e4dc", sub: "rgba(14,13,12,0.45)" },
  { bg: "#f5f0e8", text: "#0e0d0c", border: "none", sub: "rgba(14,13,12,0.45)" },
];

const tileImages = [
  "/assets/imgs/products/article_2.jpg",
  "/assets/imgs/products/article_4.jpg",
  "/assets/imgs/products/article_6.jpg",
  "/assets/imgs/products/article_8.jpg",
  "/assets/imgs/products/article_10.jpg",
  "/assets/imgs/products/article_11.jpg",
];

function LongArrow({ color }: { color: string }) {
  return (
    <svg width="32" height="10" viewBox="0 0 32 10" fill="none" stroke={color} strokeWidth="1">
      <line x1="0" y1="5" x2="28" y2="5" />
      <polyline points="24,1 28,5 24,9" />
    </svg>
  );
}

interface CategoryProducts {
  category: CategoryNode;
  products: ProductWithVariants[];
  loading: boolean;
  error: string | null;
}

export default function ProductsPage() {
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const [categoriesWithProducts, setCategoriesWithProducts] = useState<CategoryProducts[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Fetch products for each root category
  useEffect(() => {
    if (categoriesLoading || categories.length === 0) return;

    const fetchAllProducts = async () => {
      setLoadingProducts(true);
      const results: CategoryProducts[] = [];

      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        try {
          const res = await api.get<ProductWithVariants[]>(
            `/products/category/${cat.id}/variants`,
            { params: { _t: Date.now(), showAll: showAll ? 'true' : undefined } }
          );
          results.push({
            category: cat,
            products: res.data ?? [],
            loading: false,
            error: null,
          });
        } catch (err: any) {
          results.push({
            category: cat,
            products: [],
            loading: false,
            error: err?.response?.data?.message || "Failed to load products",
          });
        }
      }

      setCategoriesWithProducts(results);
      setLoadingProducts(false);
    };

    fetchAllProducts();
  }, [categories, categoriesLoading, showAll]);

  if (categoriesLoading || loadingProducts) {
    return <Loader />;
  }

  if (categoriesError) {
    return (
      <ClientSideLayout isNavbarOn={true}>
        <div style={{ padding: "80px 24px", textAlign: "center", color: "#999" }}>
          Erreur: {categoriesError}
        </div>
      </ClientSideLayout>
    );
  }

  return (
    <ClientSideLayout isNavbarOn={true}>
      <div style={{ background: "#fff" }}>
        {/* Page Header */}
        <FadeUp style={{
          maxWidth: "1440px",
          margin: "0 auto",
          padding: "96px 40px 64px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "24px",
        }}>
          <div>
            <p style={{
              fontSize: "9px",
              letterSpacing: "5px",
              textTransform: "uppercase",
              color: "#999",
              margin: "0 0 14px",
            }}>
              Nos Collections
            </p>
            <h1 style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 200,
              letterSpacing: "-0.5px",
              color: "#0e0d0c",
              margin: 0,
              lineHeight: 1.1,
            }}>
              Tous les Produits
            </h1>
          </div>

          {/* Toggle: Afficher tous les produits */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              id="toggle-show-all"
              onClick={() => setShowAll((prev) => !prev)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "none",
                border: "1px solid #c5bfb7",
                padding: "10px 20px",
                cursor: "pointer",
                fontSize: "9px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: showAll ? "#fff" : "#0e0d0c",
                backgroundColor: showAll ? "#0e0d0c" : "transparent",
                transition: "all 0.25s ease",
              }}
            >
              <span style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: showAll ? "#c5bfb7" : "#0e0d0c",
                display: "inline-block",
                flexShrink: 0,
              }} />
              {showAll ? "Produits actifs uniquement" : "Afficher tous les produits"}
            </button>
          </div>
        </FadeUp>

        {/* Categories Sections */}
        {categoriesWithProducts.map((catProd, catIdx) => {
          const style = editorialStyles[catIdx % editorialStyles.length];
          const isDark = style.bg !== "#fff" && style.bg !== "#f5f0e8";
          const tileImg = tileImages[catIdx % tileImages.length];

          return (
            <section key={catProd.category.id} style={{ background: "#fff", borderTop: "1px solid #e8e4dc" }}>
              {/* Category Header Tile */}
              <FadeUp style={{
                maxWidth: "1440px",
                margin: "0 auto",
                padding: "0 40px",
              }}>
                <Link
                  href={`/products/${catProd.category.slug ?? catProd.category.id}`}
                  style={{
                    textDecoration: "none",
                    display: "block",
                    marginTop: "80px",
                  }}
                >
                  <div
                    style={{
                      background: style.bg,
                      border: style.border || undefined,
                      boxSizing: "border-box",
                      minHeight: "280px",
                      padding: "48px 44px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      cursor: "pointer",
                      transition: "opacity 0.35s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    {/* Background image */}
                    <img
                      src={tileImg}
                      alt={catProd.category.name}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 0.3,
                      }}
                    />
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(to top, ${style.bg} 30%, transparent 80%)`,
                    }} />

                    {/* Content */}
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <p style={{
                        fontSize: "8px",
                        letterSpacing: "4px",
                        textTransform: "uppercase",
                        color: style.sub,
                        margin: "0 0 12px",
                      }}>
                        Collection
                      </p>
                      <h2 style={{
                        fontSize: "clamp(22px, 2.5vw, 30px)",
                        fontWeight: 300,
                        color: style.text,
                        margin: "0 0 10px",
                        letterSpacing: "-0.3px",
                        lineHeight: 1.15,
                      }}>
                        {catProd.category.name}
                      </h2>
                      {catProd.category.children.length > 0 && (
                        <p style={{
                          fontSize: "11px",
                          color: style.sub,
                          margin: "0 0 32px",
                          lineHeight: 1.7,
                        }}>
                          {catProd.category.children.slice(0, 3).map((c) => c.name).join("  ·  ")}
                          {catProd.category.children.length > 3 ? "  · …" : ""}
                        </p>
                      )}
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "14px",
                        color: style.text,
                      }}>
                        <span style={{
                          fontSize: "9px",
                          letterSpacing: "3px",
                          textTransform: "uppercase",
                        }}>
                          Découvrir
                        </span>
                        <LongArrow color={style.text} />
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeUp>

              
            </section>
          );
        })}
      </div>
    </ClientSideLayout>
  );
}
