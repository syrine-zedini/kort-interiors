"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FadeUp, StaggerContainer, StaggerItem } from "../ui/Animate";
import { fetchBlogs, Blog } from "@/services/blog.service";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

function estimateReadTime(content: string) {
  const words = (content || "").trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
}

export default function BlogSection() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadBlogs = async () => {
      try {
        const data = await fetchBlogs();
        if (!cancelled) setBlogs(data);
      } catch {
        if (!cancelled) setBlogs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBlogs();

    return () => {
      cancelled = true;
    };
  }, []);

  const latestBlogs = useMemo(() => blogs.slice(0, 3), [blogs]);

  return (
    <section style={{ background: "#fff" }}>
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "96px 40px 88px" }}>

        {/* Header */}
        <FadeUp style={{
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          flexWrap: "wrap", gap: "20px", marginBottom: "64px",
        }}>
          <div>
            <p style={{ fontSize: "9px", letterSpacing: "5px", textTransform: "uppercase", color: "#999", margin: "0 0 14px" }}>
              Le blog Kort
            </p>
            <h2 style={{
              fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 200,
              letterSpacing: "-0.5px", color: "#0e0d0c", margin: 0, lineHeight: 1.1,
            }}>
              Inspirations &amp; Conseils
            </h2>
          </div>
          <Link href="/blog" style={{
            fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase",
            color: "#0e0d0c", textDecoration: "none", display: "flex",
            alignItems: "center", gap: "10px", paddingBottom: "4px",
            borderBottom: "1px solid #0e0d0c",
          }} className="blog-see-all">
            Tous les articles
            <svg width="28" height="8" viewBox="0 0 28 8" fill="none" stroke="currentColor" strokeWidth="1">
              <line x1="0" y1="4" x2="24" y2="4" />
              <polyline points="20,1 24,4 20,7" />
            </svg>
          </Link>
        </FadeUp>

        {/* Articles grid */}
        {loading ? (
          <div style={{ color: "#999", fontSize: "14px", padding: "24px 0" }}>Chargement des articles...</div>
        ) : latestBlogs.length === 0 ? (
          <div style={{ color: "#999", fontSize: "14px", padding: "24px 0" }}>Aucun article disponible pour le moment.</div>
        ) : (
          <StaggerContainer className="blog-grid">
            {latestBlogs.map((a, i) => (
              <StaggerItem key={a.id}>
                <Link href={`/blog/${a.slug}`} style={{ textDecoration: "none", display: "block" }} className="blog-card">
                  {/* Image placeholder */}
                  <div style={{
                    width: "100%", aspectRatio: "4/3",
                    background: i === 0 ? "#0e0d0c" : i === 1 ? "#f5f0e8" : "#1c1c1c",
                    marginBottom: "28px",
                    overflow: "hidden",
                    position: "relative",
                  }}>
                    {a.image && (
                      <img
                        src={typeof a.image === "string" && a.image.startsWith("http") ? a.image : `${IMAGE_BASE}${a.image}`}
                        alt={a.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
                      />
                    )}
                    {/* Label catégorie sur l'image */}
                    <div style={{
                      position: "absolute", top: "20px", left: "20px",
                      padding: "5px 14px",
                      border: `1px solid ${i === 1 ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.25)"}`,
                      background: "rgba(0,0,0,0.2)",
                      backdropFilter: "blur(4px)",
                    }}>
                      <span style={{
                        fontSize: "8px", letterSpacing: "3px", textTransform: "uppercase",
                        color: "rgba(255,255,255,0.85)",
                      }}>
                        {a.author ?? "Blog"}
                      </span>
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center"
                  }}>

                    {/* Méta */}
                    <div style={{
                      display: "flex",
                      gap: "16px",
                      marginBottom: "14px",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <span style={{ fontSize: "10px", color: "#999", letterSpacing: "0.5px" }}>
                        {new Date(a.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>

                      <span style={{
                        width: "3px",
                        height: "3px",
                        borderRadius: "50%",
                        background: "#ccc",
                        display: "inline-block"
                      }} />

                      <span style={{ fontSize: "10px", color: "#999", letterSpacing: "0.5px" }}>
                        {estimateReadTime(a.content)} de lecture
                      </span>
                    </div>

                    {/* Titre */}
                    <h3 style={{
                      fontSize: "18px",
                      fontWeight: 400,
                      color: "#0e0d0c",
                      margin: "0 0 12px",
                      lineHeight: 1.35,
                      letterSpacing: "-0.2px",
                    }}>
                      {a.title}
                    </h3>

                    {/* Extrait */}
                    <p style={{
                      fontSize: "13px",
                      lineHeight: 1.9,
                      color: "#6b6b6b",
                      margin: "0 0 24px",
                    }}>
                      {a.description}
                    </p>

                    {/* CTA */}
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "9px",
                      letterSpacing: "3px",
                      textTransform: "uppercase",
                      color: "#0e0d0c",
                      paddingBottom: "2px",
                      borderBottom: "1px solid rgba(14,13,12,0.3)",
                    }}>
                      Lire l&apos;article
                      <svg width="20" height="7" viewBox="0 0 20 7" fill="none" stroke="currentColor" strokeWidth="1">
                        <line x1="0" y1="3.5" x2="17" y2="3.5" />
                        <polyline points="13,1 17,3.5 13,6" />
                      </svg>
                    </div>

                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      <style jsx global>{`
        .blog-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 48px 40px;
        }
        .blog-card {
          transition: opacity 0.3s ease;
        }
        .blog-grid:hover .blog-card {
          opacity: 0.55;
        }
        .blog-grid .blog-card:hover {
          opacity: 1 !important;
        }
        .blog-see-all:hover { opacity: 0.5; }
        @media (max-width: 900px) {
          .blog-grid { grid-template-columns: 1fr; gap: 56px; }
        }
      `}</style>
    </section>
  );
}
