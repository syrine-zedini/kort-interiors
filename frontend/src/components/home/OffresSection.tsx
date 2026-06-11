"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FadeUp, StaggerContainer, StaggerItem } from "../ui/Animate";
import { fetchPromotions, Promotion } from "@/services/promotion.service";
import api from "@/libs/axios";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

type PromoCategoryCard = {
  id: string;
  name: string;
  image?: string;
  promotionsCount: number;
  maxDiscount: number;
};

export default function OffresSection() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, { id: string; name: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [promosData, categoriesRes] = await Promise.all([
          fetchPromotions(),
          api.get("/categories"),
        ]);

        const tree = Array.isArray(categoriesRes.data)
          ? categoriesRes.data
          : (categoriesRes.data?.data ?? []);
        const map: Record<string, { id: string; name: string }> = {};

        const walk = (nodes: any[]) => {
          nodes.forEach((node) => {
            map[node.id] = { id: node.id, name: node.name };
            if (Array.isArray(node.children) && node.children.length > 0) {
              walk(node.children);
            }
          });
        };
        walk(tree);

        if (!cancelled) {
          setCategoryMap(map);
          setPromotions(promosData);
        }
      } catch (error) {
        if (!cancelled) {
          setCategoryMap({});
          setPromotions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const categoryCards = useMemo(() => {
    const now = new Date();
    const map = new Map<string, PromoCategoryCard>();

    promotions.forEach((p) => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      if (!p.isActive || now < start || now > end) return;

      const derivedCategory = p.product?.categoryId ? categoryMap[p.product.categoryId] : undefined;
      const category = p.subCategory ?? p.category ?? derivedCategory;
      if (!category) return;

      const id = category.id;
      const current = map.get(id);
      const discount = Number(p.discountValue || 0);
      const image = p.product?.images?.[0]
        ? (typeof p.product.images[0] === "string" && p.product.images[0].startsWith("http")
            ? p.product.images[0]
            : `${IMAGE_BASE}${p.product.images[0]}`)
        : undefined;

      if (!current) {
        map.set(id, {
          id,
          name: category.name,
          image,
          promotionsCount: 1,
          maxDiscount: p.discountType === "percentage" ? discount : 0,
        });
      } else {
        current.promotionsCount += 1;
        if (p.discountType === "percentage") {
          current.maxDiscount = Math.max(current.maxDiscount, discount);
        }
        if (!current.image && image) current.image = image;
      }
    });

    return Array.from(map.values()).slice(0, 3);
  }, [promotions, categoryMap]);

  return (
    <section style={{ background: "#fff" }}>
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "96px 40px 80px" }}>
        <FadeUp style={{ marginBottom: "56px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <p style={{ fontSize: "9px", letterSpacing: "5px", textTransform: "uppercase", color: "#999", margin: "0 0 14px" }}>
              Offres & Promotions
            </p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 200, letterSpacing: "-0.5px", color: "#0e0d0c", margin: 0, lineHeight: 1.1 }}>
              Sélections du moment
            </h2>
          </div>
          <Link href="/promotions" style={{
            fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase",
            color: "#0e0d0c", textDecoration: "none", display: "flex",
            alignItems: "center", gap: "10px", paddingBottom: "4px",
            borderBottom: "1px solid #0e0d0c",
          }} className="offres-see-all">
            Voir toutes les offres
            <svg width="28" height="8" viewBox="0 0 28 8" fill="none" stroke="currentColor" strokeWidth="1">
              <line x1="0" y1="4" x2="24" y2="4" />
              <polyline points="20,1 24,4 20,7" />
            </svg>
          </Link>
        </FadeUp>

        {loading ? (
          <div style={{ color: "#999", fontSize: "14px", padding: "24px 0" }}>Chargement des promotions...</div>
        ) : categoryCards.length === 0 ? (
          <div style={{ color: "#999", fontSize: "14px", padding: "24px 0" }}>Aucune promotion active pour le moment.</div>
        ) : (
          <StaggerContainer className="offres-grid">
            {categoryCards.map((o, i) => {
              const bg = i % 2 === 0 ? "#0e0d0c" : "#f5f0e8";
              const accent = i % 2 === 0 ? "#fff" : "#0e0d0c";
              const isDark = accent === "#fff";
              return (
                <StaggerItem key={o.id}>
                  <Link href="/promotions" style={{ textDecoration: "none", display: "block" }}>
                    <div
                      className="offre-card"
                      style={{
                        background: bg,
                        padding: "48px 44px 40px",
                        position: "relative",
                        overflow: "hidden",
                        minHeight: "320px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      {o.image && (
                        <>
                          <img
                            src={o.image}
                            alt={o.name}
                            style={{
                              position: "absolute", inset: 0,
                              width: "100%", height: "100%",
                              objectFit: "cover",
                              opacity: 0.35,
                            }}
                          />
                          <div style={{
                            position: "absolute", inset: 0,
                            background: `linear-gradient(to top, ${bg} 20%, transparent 70%)`,
                          }} />
                        </>
                      )}

                      <span style={{
                        position: "absolute",
                        bottom: "-20px", right: "-8px",
                        fontSize: "120px", fontWeight: 800,
                        lineHeight: 1, userSelect: "none",
                        color: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                        letterSpacing: "-8px",
                      }}>
                        -{Math.round(o.maxDiscount || 0)}%
                      </span>

                      <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{
                          display: "inline-block",
                          padding: "5px 14px",
                          border: `1px solid ${isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"}`,
                          marginBottom: "32px",
                        }}>
                          <span style={{
                            fontSize: "8px", letterSpacing: "3px", textTransform: "uppercase",
                            color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
                          }}>
                            Catégorie en promotion
                          </span>
                        </div>

                        <div style={{
                          fontSize: "clamp(34px, 5vw, 52px)", fontWeight: 200,
                          color: accent, lineHeight: 1, letterSpacing: "-2px",
                          marginBottom: "16px",
                        }}>
                          {o.maxDiscount > 0 ? `-${Math.round(o.maxDiscount)}%` : "Offres"}
                        </div>

                        <h3 style={{
                          fontSize: "22px", fontWeight: 400,
                          color: accent, margin: "0 0 10px",
                          letterSpacing: "-0.2px",
                        }}>
                          {o.name}
                        </h3>

                        <p style={{
                          fontSize: "12px", lineHeight: 1.8,
                          color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
                          margin: 0,
                        }}>
                          {o.promotionsCount} promotion{o.promotionsCount > 1 ? "s" : ""} active{o.promotionsCount > 1 ? "s" : ""}
                        </p>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "40px", position: "relative", zIndex: 1 }}>
                        <span style={{
                          fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase",
                          color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
                        }}>
                          Voir les promotions
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: accent }}>
                          <span style={{ fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase" }}>
                            Découvrir
                          </span>
                          <svg width="24" height="8" viewBox="0 0 24 8" fill="none" stroke="currentColor" strokeWidth="1">
                            <line x1="0" y1="4" x2="20" y2="4" />
                            <polyline points="16,1 20,4 16,7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>

      <style jsx global>{`
        .offres-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
        }
        .offre-card {
          transition: opacity 0.3s ease;
        }
        .offres-grid:hover .offre-card {
          opacity: 0.5;
        }
        .offres-grid a:hover .offre-card {
          opacity: 1 !important;
        }
        .offres-see-all:hover { opacity: 0.5; }
        @media (max-width: 900px) {
          .offres-grid { grid-template-columns: 1fr; gap: 2px; }
        }
      `}</style>
    </section>
  );
}
