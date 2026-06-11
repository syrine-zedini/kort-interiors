import Link from "next/link";
import { useCategories } from "../../hooks/useCategories";
import { FadeUp, StaggerContainer, StaggerItem } from "../ui/Animate";

/**
 * Palette éditoriale Yves Delorme : noir / blanc / crème, jamais de couleurs vives.
 * On alterne les fonds de façon à créer un rythme visuel magazine.
 */
const editorialStyles = [
  { bg: "#0e0d0c", text: "#fff",    border: "none",                   sub: "rgba(255,255,255,0.45)" },
  { bg: "#fff",    text: "#0e0d0c", border: "1px solid #e8e4dc",      sub: "rgba(14,13,12,0.45)"   },
  { bg: "#f5f0e8", text: "#0e0d0c", border: "none",                   sub: "rgba(14,13,12,0.45)"   },
  { bg: "#1c1c1c", text: "#fff",    border: "none",                   sub: "rgba(255,255,255,0.45)" },
  { bg: "#fff",    text: "#0e0d0c", border: "1px solid #e8e4dc",      sub: "rgba(14,13,12,0.45)"   },
  { bg: "#f5f0e8", text: "#0e0d0c", border: "none",                   sub: "rgba(14,13,12,0.45)"   },
];

const tileImages = [
  "/assets/imgs/products/article_2.jpg",
  "/assets/imgs/products/article_4.jpg",
  "/assets/imgs/products/article_6.jpg",
  "/assets/imgs/products/article_8.jpg",
  "/assets/imgs/products/article_10.jpg",
  "/assets/imgs/products/article_11.jpg",
];

const nouvelleCollectionImage = "/assets/imgs/products/article_7.jpg";

function LongArrow({ color }: { color: string }) {
  return (
    <svg width="32" height="10" viewBox="0 0 32 10" fill="none" stroke={color} strokeWidth="1">
      <line x1="0" y1="5" x2="28" y2="5" />
      <polyline points="24,1 28,5 24,9" />
    </svg>
  );
}

export default function CategoryTiles() {
  const { categories, loading } = useCategories();

  return (
    <section style={{ background: "#fff" }}>

      {/* En-tête de section */}
      <FadeUp style={{
        maxWidth: "1440px", margin: "0 auto",
        padding: "96px 40px 64px",
        display: "flex", alignItems: "flex-end",
        justifyContent: "space-between", flexWrap: "wrap", gap: "24px",
      }}>
        <div>
          <p style={{
            fontSize: "9px", letterSpacing: "5px", textTransform: "uppercase",
            color: "#999", margin: "0 0 14px",
          }}>
            Notre univers
          </p>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 200,
            letterSpacing: "-0.5px", color: "#0e0d0c", margin: 0, lineHeight: 1.1,
          }}>
            Nos Collections
          </h2>
        </div>
        <Link href="/products" style={{
          fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase",
          color: "#0e0d0c", textDecoration: "none", display: "flex",
          alignItems: "center", gap: "10px", paddingBottom: "4px",
          borderBottom: "1px solid #0e0d0c",
        }} className="see-all-link">
          Voir tout
          <LongArrow color="#0e0d0c" />
        </Link>
      </FadeUp>

      {/* Grille éditoriale */}
      {loading ? (
        <div className="cat-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ background: "#f0ece6", minHeight: "360px" }} className="skeleton-tile" />
          ))}
        </div>
      ) : (
        <StaggerContainer className="cat-grid">
          {categories.map((cat, i) => {
            const style = editorialStyles[i % editorialStyles.length];
            const cardStyle = i < 3 ? editorialStyles[0] : style;
            const isDark = cardStyle.bg !== "#fff" && cardStyle.bg !== "#f5f0e8";
            const isNouvelleCollection = cat.name.trim().toLowerCase() === "nouvelle collection";
            const tileImg = isNouvelleCollection
              ? nouvelleCollectionImage
              : tileImages[i % tileImages.length];
            const overlayBase = cardStyle.bg;
            return (
              <StaggerItem key={cat.id}>
              <Link
                href={`/products/${cat.slug ?? cat.id}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div
                  className="cat-tile"
                  style={{
                    background: cardStyle.bg,
                    border: cardStyle.border || undefined,
                    boxSizing: "border-box",
                    minHeight: "360px",
                    padding: "48px 44px",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                  }}
                >
                  {/* Background image with gradient overlay */}
                  <img
                    src={tileImg}
                    alt={cat.name}
                    style={{
                      position: "absolute", inset: 0,
                      width: "100%", height: "100%",
                      objectFit: "cover",
                      opacity: isDark ? 0.42 : 0.35,
                    }}
                  />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: isDark
                      ? `linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)`
                      : `linear-gradient(to top, ${overlayBase} 30%, transparent 80%)`,
                  }} />

                  {/* Content above overlay */}
                  <div style={{ position: "relative", zIndex: 1 }}>
                  {/* Numéro de fond — très large, watermark */}
                  <span style={{
                    position: "absolute",
                    top: "-280px", right: "-16px",
                    fontSize: "120px", fontWeight: 700,
                    lineHeight: 1, userSelect: "none",
                    color: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Label catégorie */}
                  <p style={{
                    fontSize: "8px", letterSpacing: "4px", textTransform: "uppercase",
                    color: cardStyle.sub, margin: "0 0 12px",
                  }}>
                    Collection
                  </p>

                  {/* Nom */}
                  <h3 style={{
                    fontSize: "clamp(22px, 2.5vw, 30px)", fontWeight: 300,
                    color: cardStyle.text, margin: "0 0 10px",
                    letterSpacing: "-0.3px", lineHeight: 1.15,
                  }}>
                    {cat.name}
                  </h3>

                  {/* Sous-catégories */}
                  {cat.children.length > 0 && (
                    <p style={{
                      fontSize: "11px", color: cardStyle.sub,
                      margin: "0 0 32px", lineHeight: 1.7,
                    }}>
                      {cat.children.slice(0, 3).map((c) => c.name).join("  ·  ")}
                      {cat.children.length > 3 ? "  · …" : ""}
                    </p>
                  )}

                  {/* CTA — flèche longue style YD */}
                  <div style={{
                    display: "inline-flex", alignItems: "center",
                    gap: "14px", color: cardStyle.text,
                  }}>
                    <span style={{
                      fontSize: "9px", letterSpacing: "3px",
                      textTransform: "uppercase",
                    }}>
                      Découvrir
                    </span>
                    <LongArrow color={cardStyle.text} />
                  </div>
                  </div>
                </div>
              </Link>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}

      <style jsx global>{`
        .cat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }
        .cat-tile {
          transition: opacity 0.35s ease;
        }
        .cat-grid:hover .cat-tile {
          opacity: 0.5;
        }
        .cat-grid .cat-tile:hover {
          opacity: 1 !important;
        }
        .skeleton-tile {
          animation: skeletonPulse 1.4s ease-in-out infinite;
        }
        .see-all-link:hover {
          opacity: 0.5;
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 900px) {
          .cat-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .cat-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
