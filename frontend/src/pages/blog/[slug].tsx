import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ClientSideLayout } from "../../layouts/client-side";
import Loader from "../../layouts/client-side/loader";
import { fetchBlogBySlug, Blog, fetchBlogs } from "../../services/blog.service";
import { FadeUp } from "@/components/ui/Animate";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

export default function BlogDetailPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    if (!slug || Array.isArray(slug)) return;

    let cancelled = false;

    const loadBlog = async () => {
      try {
        setLoading(true);
        const data = await fetchBlogBySlug(slug);
        if (!cancelled) {
          setBlog(data);

          // Load related blogs
          const allBlogs = await fetchBlogs();
          const related = allBlogs.filter((b) => b.id !== data.id).slice(0, 3);
          setRelatedBlogs(related);
        }
      } catch (error) {
        console.error("Failed to load blog:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBlog();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <Loader />;
  }

  if (!blog) {
    return (
      <ClientSideLayout isNavbarOn={true}>
        <div style={{ padding: "80px 24px", textAlign: "center", color: "#999" }}>
          <p>Article non trouvé.</p>
          <Link href="/blog" style={{ color: "#0e0d0c", textDecoration: "underline" }}>
            Retour aux articles
          </Link>
        </div>
      </ClientSideLayout>
    );
  }

  const blogImage = blog.image
    ? typeof blog.image === "string" && blog.image.startsWith("http")
      ? blog.image
      : `${IMAGE_BASE}${blog.image}`
    : null;

  return (
    <ClientSideLayout isNavbarOn={true}>
      <article style={{ background: "#fff" }}>
        {/* Hero section */}
        {blogImage && (
          <div
            style={{
              width: "100%",
              height: "500px",
              overflow: "hidden",
              background: "#f0f0f0",
            }}
          >
            <img
              src={blogImage}
              alt={blog.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}

        {/* Article content */}
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "80px 40px" }}>
          {/* Breadcrumb */}
          <FadeUp style={{ marginBottom: "40px" }}>
            <Link href="/blog" style={{ color: "#999", textDecoration: "none", fontSize: "12px" }}>
              ← Tous les articles
            </Link>
          </FadeUp>

          {/* Header */}
          <FadeUp style={{ marginBottom: "48px" }}>
            <p
              style={{
                fontSize: "10px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: "#999",
                margin: "0 0 14px",
              }}
            >
              Article
            </p>
            <h1
              style={{
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 300,
                letterSpacing: "-0.5px",
                color: "#0e0d0c",
                margin: "0 0 24px",
                lineHeight: 1.2,
              }}
            >
              {blog.title}
            </h1>

            {/* Méta */}
            <div
              style={{
                display: "flex",
                gap: "24px",
                alignItems: "center",
                paddingTop: "24px",
                borderTop: "1px solid #e5e5e5",
              }}
            >
              <span style={{ fontSize: "11px", color: "#999", letterSpacing: "0.5px" }}>
                {new Date(blog.createdAt).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              {blog.author && (
                <>
                  <span
                    style={{
                      width: "3px",
                      height: "3px",
                      borderRadius: "50%",
                      background: "#ccc",
                    }}
                  />
                  
                </>
              )}
            </div>
          </FadeUp>

          {/* Content */}
          <FadeUp
            style={{
              marginBottom: "80px",
              fontSize: "15px",
              lineHeight: 1.9,
              color: "#4a4a4a",
              wordBreak: "break-word",
            }}
            className="blog-content"
            dangerouslySetInnerHTML={{
              __html: blog.content
                .split("\n")
                .map((paragraph) => `<p>${paragraph}</p>`)
                .join(""),
            }}
          />

          {/* Related articles */}
          {relatedBlogs.length > 0 && (
            <section style={{ paddingTop: "80px", borderTop: "1px solid #e5e5e5" }}>
              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: 300,
                  color: "#0e0d0c",
                  marginBottom: "48px",
                  letterSpacing: "-0.3px",
                }}
              >
                Articles connexes
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "48px",
                }}
              >
                {relatedBlogs.map((relatedBlog) => {
                  const relatedImage = relatedBlog.image
                    ? typeof relatedBlog.image === "string" && relatedBlog.image.startsWith("http")
                      ? relatedBlog.image
                      : `${IMAGE_BASE}${relatedBlog.image}`
                    : null;

                  return (
                    <Link
                      key={relatedBlog.id}
                      href={`/blog/${relatedBlog.slug}`}
                      style={{ textDecoration: "none" }}
                      className="related-blog-card"
                    >
                      {relatedImage && (
                        <div
                          style={{
                            width: "100%",
                            aspectRatio: "4/3",
                            background: "#f0f0f0",
                            marginBottom: "20px",
                            overflow: "hidden",
                          }}
                        >
                          <img
                            src={relatedImage}
                            alt={relatedBlog.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      )}
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: 400,
                          color: "#0e0d0c",
                          margin: "0 0 12px",
                          lineHeight: 1.35,
                        }}
                      >
                        {relatedBlog.title}
                      </h3>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#999",
                          margin: 0,
                        }}
                      >
                        {new Date(relatedBlog.createdAt).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </article>

      <style jsx global>{`
        .blog-content p {
          margin: 0 0 20px;
        }
        .blog-content p:last-child {
          margin-bottom: 0;
        }
        .related-blog-card {
          transition: opacity 0.3s ease;
          display: block;
          color: inherit;
        }
        .related-blog-card:hover {
          opacity: 0.7;
        }
      `}</style>
    </ClientSideLayout>
  );
}
