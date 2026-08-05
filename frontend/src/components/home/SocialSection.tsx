import { useEffect, useState } from "react";
import { FadeUp, FadeIn } from "../ui/Animate";
import { resolveApiBase } from "@/libs/apiBase";

const apiBase = resolveApiBase();

interface SocialPost {
  id: string;
  platform: 'instagram' | 'facebook';
  media_url: string;
  permalink: string;
  caption?: string;
  timestamp: string;
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2H15a6 6 0 0 0-6 6v4h-2v4h2v8h4v-8h3l1-4h-4V8a2 2 0 0 1 2-2h2z" />
    </svg>
  );
}

const PLACEHOLDER_COLORS = ["#e8e4dc", "#d4cfc8", "#c8c4bc", "#dcd8d0", "#e0dcd4", "#ebdcd0"];

export default function SocialSection() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiBase}/social/instagram`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data && json.data.length > 0) {
          setPosts(json.data.slice(0, 6));
        }
      })
      .catch((err) => console.error("Error loading social feed:", err))
      .finally(() => setLoading(false));
  }, []);

  const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "http://localhost:6002";

  const resolveMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://localhost:6002")) {
      return url.replace("http://localhost:6002", IMAGE_BASE);
    }
    return url;
  };

  const items = posts.length > 0
    ? posts
    : Array.from({ length: 6 }, (_, i) => ({ 
        id: String(i), 
        placeholder: true, 
        bg: PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length] 
      }));

  return (
    <section style={{ background: "#faf9f7", padding: "96px 0 0" }}>
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 40px 56px" }}>
        {/* Header */}
        <FadeUp style={{ textAlign: "center", marginBottom: "56px" }}>
          <h2 style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 200, color: "#0e0d0c", margin: 0, letterSpacing: "-0.5px" }}>
            Suivez-nous sur les réseaux
          </h2>
          <p style={{ fontSize: "13px", color: "rgba(14,13,12,0.45)", marginTop: "16px", lineHeight: 1.8 }}>
            Découvrez nos inspirations, nouveautés et coulisses au quotidien.
          </p>
        </FadeUp>
      </div>

      {/* Mosaïque */}
      <FadeIn>
        <div className="social-grid">
          {items.map((item, i) => {
            if ("placeholder" in item) {
              return (
                <div
                  key={item.id}
                  className="social-item"
                  style={{ background: (item as any).bg, height: "340px" }}
                />
              );
            }

            const post = item as SocialPost;
            const caption = post.caption?.split("\n")[0] ?? "";

            return (
              <a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="social-item"
                style={{ display: "block", position: "relative", overflow: "hidden", textDecoration: "none", height: "340px" }}
                aria-label={caption}
              >
                <img
                  src={resolveMediaUrl(post.media_url)}
                  alt={caption}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.5s ease" }}
                  className="social-img"
                />


              </a>
            );
          })}
        </div>
      </FadeIn>

      {/* Boutons de suivi */}
      <div style={{ display: "flex", justifyContent: "center", padding: "48px 40px 96px", background: "#faf9f7" }}>
        <a
          href="https://www.instagram.com/kort.interiors/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: "12px",
            padding: "14px 40px",
            border: "1px solid #0e0d0c",
            fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase",
            color: "#0e0d0c", textDecoration: "none",
            transition: "background 0.2s, color 0.2s",
          }}
          className="social-follow-btn"
        >
          <InstagramIcon />
          Suivre @kort.interiors
        </a>
      </div>

      <style jsx global>{`
        .social-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3px;
        }
        .social-item:hover .social-img {
          transform: scale(1.06);
        }
        .social-follow-btn:hover {
          background: #0e0d0c !important;
          color: #fff !important;
        }
        @media (max-width: 900px) {
          .social-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 560px) {
          .social-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
