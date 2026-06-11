import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClientSideLayout } from "@/layouts/client-side";
import Loader from "@/layouts/client-side/loader";
import { fetchPromotions, Promotion } from "@/services/promotion.service";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchPromotions();
        if (!cancelled) setPromotions(data);
      } catch {
        if (!cancelled) setPromotions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const activePromotions = useMemo(() => {
    const now = new Date();
    return promotions.filter((p) => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      return p.isActive && now >= start && now <= end;
    });
  }, [promotions]);

  if (loading) return <Loader />;

  return (
    <ClientSideLayout isNavbarOn={true}>
      <section style={{ background: "#fff", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "96px 40px 88px" }}>
          <div style={{
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            flexWrap: "wrap", gap: "20px", marginBottom: "56px",
          }}>
            <div>
              <p style={{ fontSize: "9px", letterSpacing: "5px", textTransform: "uppercase", color: "#999", margin: "0 0 14px" }}>
                Offres & Promotions
              </p>
              <h1 style={{
                fontSize: "clamp(30px, 4vw, 52px)",
                fontWeight: 200,
                letterSpacing: "-0.5px",
                color: "#0e0d0c",
                margin: 0,
                lineHeight: 1.1,
              }}>
                Toutes les promotions disponibles
              </h1>
            </div>
            <Link href="/products" style={{
              fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase",
              color: "#0e0d0c", textDecoration: "none", display: "flex",
              alignItems: "center", gap: "10px", paddingBottom: "4px",
              borderBottom: "1px solid #0e0d0c",
            }}>
              Voir les produits
            </Link>
          </div>

          {activePromotions.length === 0 ? (
            <div style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>
              Aucune promotion active pour le moment.
            </div>
          ) : (
            <div className="promotions-grid">
              {activePromotions.map((p, index) => {
                const imageRaw = p.product?.images?.[0] ?? "";
                const image = imageRaw
                  ? (typeof imageRaw === "string" && imageRaw.startsWith("http") ? imageRaw : `${IMAGE_BASE}${imageRaw}`)
                  : "";
                const targetName = p.subCategory?.name ?? p.category?.name ?? p.product?.name ?? "Sélection";
                const label = p.discountType === "percentage"
                  ? `-${Number(p.discountValue)}%`
                  : `-${Number(p.discountValue)}`;

                const dark = index % 2 === 0;
                const bg = dark ? "#0e0d0c" : "#f5f0e8";
                const accent = dark ? "#fff" : "#0e0d0c";

                return (
                    <Link
                      key={p.id}
                      href={
                        p.product
                          ? `/products/${
                              p.subCategory?.slug ??
                              p.subCategory?.id ??
                              p.category?.slug ??
                              p.category?.id ??
                              p.product.categoryId ??
                              "all"
                            }/${p.product.slug ?? p.product.id}`
                          : "/products"
                      }
                      style={{ textDecoration: "none" }}
                    >
                    <article style={{
                      background: bg,
                      color: accent,
                      position: "relative",
                      overflow: "hidden",
                      minHeight: "320px",
                      padding: "38px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }} className="promotion-card">
                      {image && (
                        <>
                          <img
                            src={image}
                            alt={targetName}
                            style={{
                              position: "absolute", inset: 0,
                              width: "100%", height: "100%",
                              objectFit: "cover", opacity: 0.35,
                            }}
                          />
                          <div style={{
                            position: "absolute", inset: 0,
                            background: `linear-gradient(to top, ${bg} 20%, transparent 70%)`,
                          }} />
                        </>
                      )}

                      <div style={{ position: "relative", zIndex: 1 }}>
                        <span style={{
                          display: "inline-block",
                          fontSize: "8px",
                          letterSpacing: "3px",
                          textTransform: "uppercase",
                          border: `1px solid ${dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.2)"}`,
                          padding: "5px 12px",
                          marginBottom: "24px",
                        }}>
                          {targetName}
                        </span>

                        <div style={{ fontSize: "clamp(34px, 5vw, 56px)", lineHeight: 1, fontWeight: 200, marginBottom: "14px" }}>
                          {label}
                        </div>

                        <h2 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 400 }}>
                          {p.name}
                        </h2>

                        <p style={{ margin: 0, fontSize: "12px", opacity: 0.7 }}>
                          Valable jusqu'au {new Date(p.endDate).toLocaleDateString("fr-FR")}
                        </p>
                      </div>

                      <div style={{ position: "relative", zIndex: 1, marginTop: "28px" }}>
                        <span style={{ fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase" }}>
                          Voir les produits concernés
                        </span>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <style jsx global>{`
          .promotions-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2px;
          }
          .promotion-card {
            transition: opacity 0.3s ease;
          }
          .promotions-grid:hover .promotion-card {
            opacity: 0.55;
          }
          .promotions-grid a:hover .promotion-card {
            opacity: 1 !important;
          }
          @media (max-width: 980px) {
            .promotions-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </section>
    </ClientSideLayout>
  );
}
