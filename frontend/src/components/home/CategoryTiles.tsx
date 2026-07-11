import Link from "next/link";
import { useCategories } from "../../hooks/useCategories";
import { FadeUp, StaggerContainer, StaggerItem } from "../ui/Animate";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

const nouvelleCollectionImage = "/assets/imgs/products/article_7.jpg";
const tileImages = [
  "/assets/imgs/products/article_2.jpg",
  "/assets/imgs/products/article_4.jpg",
  "/assets/imgs/products/article_6.jpg",
  "/assets/imgs/products/article_8.jpg",
  "/assets/imgs/products/article_10.jpg",
  "/assets/imgs/products/article_11.jpg",
];

export default function CategoryTiles() {
  const { categories, loading } = useCategories();

  return (
    <section style={{ background: "#fff" }}>

      {/* En-tête */}
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
          <svg width="32" height="10" viewBox="0 0 32 10" fill="none" stroke="#0e0d0c" strokeWidth="1">
            <line x1="0" y1="5" x2="28" y2="5" />
            <polyline points="24,1 28,5 24,9" />
          </svg>
        </Link>
      </FadeUp>

      {/* Grille éditoriale */}
      {loading ? (
        <div className="cat-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{ background: "#f0ece6", minHeight: i === 1 || i === 6 ? "560px" : "420px" }}
              className={`skeleton-tile${i === 1 || i === 6 ? " cat-full" : ""}`}
            />
          ))}
        </div>
      ) : (
        <StaggerContainer className="cat-grid">
          {categories.map((cat, i) => {
            const isFirst = i === 0;
            const isLast = i === categories.length - 1;
            const isFullWidth = isFirst || isLast;
            const tileHeight = isFullWidth ? "560px" : "420px";

            const isNouvelleCollection = cat.name.trim().toLowerCase() === "nouvelle collection";
            const fallbackImg = isNouvelleCollection
              ? nouvelleCollectionImage
              : tileImages[i % tileImages.length];
            const tileImg = cat.banner
              ? (cat.banner.startsWith("http") ? cat.banner : `${IMAGE_BASE}${cat.banner}`)
              : fallbackImg;

            return (
              <StaggerItem
                key={cat.id}
                style={isFullWidth ? { gridColumn: "1 / -1" } : {}}
              >
                <Link
                  href={`/products/${cat.slug ?? cat.id}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <div
                    className="cat-tile"
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      height: tileHeight,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                    }}
                  >
                    {/* Photo plein cadre */}
                    <img
                      src={tileImg}
                      alt={cat.name}
                      style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.7s ease",
                      }}
                      className="cat-tile-img"
                    />

                    {/* Gradient overlay */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)",
                    }} />

                    {/* Texte centré en bas */}
                    <div style={{
                      position: "relative", zIndex: 1,
                      textAlign: "center",
                      padding: isFullWidth ? "0 24px 52px" : "0 24px 40px",
                    }}>
                      {/* Sous-catégories */}
                      {cat.children && cat.children.length > 0 && (
                        <p style={{
                          fontSize: "10px", color: "rgba(255,255,255,0.65)",
                          margin: "0 0 10px", letterSpacing: "2px",
                          textTransform: "uppercase", lineHeight: 1.8,
                        }}>
                          {cat.children.slice(0, 3).map((c) => c.name).join("  ·  ")}
                          {cat.children.length > 3 ? "  · …" : ""}
                        </p>
                      )}

                      {/* Nom catégorie */}
                      <h3 style={{
                        fontSize: isFullWidth ? "clamp(22px, 2.5vw, 36px)" : "clamp(18px, 1.8vw, 26px)",
                        fontWeight: 300,
                        color: "#fff",
                        margin: "0 0 14px",
                        letterSpacing: "0.5px",
                        lineHeight: 1.2,
                        fontFamily: "Georgia, 'Times New Roman', serif",
                      }}>
                        {cat.name}
                      </h3>

                      {/* CTA */}
                      <div style={{
                        display: "inline-flex", flexDirection: "column",
                        alignItems: "center", gap: "6px",
                      }}>
                        <span style={{
                          fontSize: "9px", letterSpacing: "3px",
                          textTransform: "uppercase", color: "rgba(255,255,255,0.85)",
                          fontWeight: 500,
                        }}>
                          Découvrir
                        </span>
                        <div style={{ width: "30px", height: "1px", background: "rgba(255,255,255,0.6)" }} />
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
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }
        .cat-full {
          grid-column: 1 / -1;
        }
        .cat-tile {
          cursor: pointer;
        }
        .cat-tile:hover .cat-tile-img {
          transform: scale(1.04);
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
        @media (max-width: 640px) {
          .cat-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
