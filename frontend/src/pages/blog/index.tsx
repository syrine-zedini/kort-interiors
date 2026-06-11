import { useState, useEffect } from "react";
import Link from "next/link";
import { ClientSideLayout } from "../../layouts/client-side";
import Loader from "../../layouts/client-side/loader";
import { fetchBlogs, Blog } from "../../services/blog.service";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/ui/Animate";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadBlogs = async () => {
      try {
        const data = await fetchBlogs();
        if (!cancelled) {
          setBlogs(data);
        }
      } catch (error) {
        console.error("Failed to load blogs:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBlogs();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <ClientSideLayout isNavbarOn={true}>
      <section style={{ minHeight: "100vh", background: "#fff" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "96px 40px 88px" }}>
          {/* Header */}
          <FadeUp
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "20px",
              marginBottom: "64px",
              textAlign: "center",
              flexDirection: "column",
              width: "100%",
            }}
          >
            <div style={{ width: "100%" }}>
              <p
                style={{
                  fontSize: "9px",
                  letterSpacing: "5px",
                  textTransform: "uppercase",
                  color: "#999",
                  margin: "0 0 14px",
                }}
              >
                Le blog Kort
              </p>
              <h1
                style={{
                  fontSize: "clamp(28px, 4vw, 48px)",
                  fontWeight: 200,
                  letterSpacing: "-0.5px",
                  color: "#0e0d0c",
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                Tous les articles
              </h1>
            </div>
          </FadeUp>

          {/* Articles grid */}
          {blogs.length === 0 ? (
            <div
              style={{
                padding: "80px 24px",
                textAlign: "center",
                color: "#999",
              }}
            >
              <p style={{ fontSize: "16px" }}>Aucun article trouvé pour le moment.</p>
            </div>
          ) : (
            <StaggerContainer className="blog-grid">
              {blogs.map((blog, index) => {
                const blogImage = blog.image
                  ? typeof blog.image === "string" && blog.image.startsWith("http")
                    ? blog.image
                    : `${IMAGE_BASE}${blog.image}`
                  : null;

                return (
                  <StaggerItem key={blog.id}>
                    <Link
                      href={`/blog/${blog.slug}`}
                      style={{ textDecoration: "none", display: "block" }}
                      className="blog-card"
                    >
                      {/* Image */}
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "4/3",
                          background: index % 3 === 0 ? "#0e0d0c" : index % 3 === 1 ? "#f5f0e8" : "#1c1c1c",
                          marginBottom: "28px",
                          overflow: "hidden",
                          position: "relative",
                        }}
                      >
                        {blogImage && (
                          <img
                            src={blogImage}
                            alt={blog.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              position: "absolute",
                              inset: 0,
                            }}
                          />
                        )}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          textAlign: "center",
                        }}
                      >
                        {/* Méta */}
                        <div
                          style={{
                            display: "flex",
                            gap: "16px",
                            marginBottom: "14px",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              color: "#999",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {new Date(blog.createdAt).toLocaleDateString("fr-FR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>

                          <span
                            style={{
                              width: "3px",
                              height: "3px",
                              borderRadius: "50%",
                              background: "#ccc",
                              display: "inline-block",
                            }}
                          />
                        </div>

                        {/* Titre */}
                        <h3
                          style={{
                            fontSize: "18px",
                            fontWeight: 400,
                            color: "#0e0d0c",
                            margin: "0 0 12px",
                            lineHeight: 1.35,
                            letterSpacing: "-0.2px",
                          }}
                        >
                          {blog.title}
                        </h3>

                        {/* Extrait */}
                        <p
                          style={{
                            fontSize: "13px",
                            lineHeight: 1.9,
                            color: "#6b6b6b",
                            margin: "0 0 24px",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {blog.description}
                        </p>

                        {/* CTA */}
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "10px",
                            fontSize: "9px",
                            letterSpacing: "3px",
                            textTransform: "uppercase",
                            color: "#0e0d0c",
                            paddingBottom: "2px",
                            borderBottom: "1px solid rgba(14,13,12,0.3)",
                          }}
                        >
                          Lire l&apos;article
                          <svg
                            width="20"
                            height="7"
                            viewBox="0 0 20 7"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                          >
                            <line x1="0" y1="3.5" x2="17" y2="3.5" />
                            <polyline points="13,1 17,3.5 13,6" />
                          </svg>
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
          @media (max-width: 900px) {
            .blog-grid {
              grid-template-columns: 1fr;
              gap: 56px;
            }
          }
        `}</style>
      </section>
    </ClientSideLayout>
  );
}
