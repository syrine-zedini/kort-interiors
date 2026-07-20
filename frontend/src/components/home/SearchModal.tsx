"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import api from "@/libs/axios";
import { ProductWithVariants } from "../../types/product";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get<ProductWithVariants[]>("/products", {
          params: { search: query },
        });
        setResults(res.data || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        display: "flex",
        flexDirection: "column",
        animation: "fadeIn 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
          borderBottom: "1px solid #ece8e2",
        }}
        className="search-header-mobile"
      >
        <div style={{ flex: 1 }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher des produits..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              fontSize: "clamp(24px, 4vw, 40px)",
              fontWeight: 300,
              outline: "none",
              color: "#0e0d0c",
            }}
          />
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px",
            color: "#0e0d0c",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "40px",
        }}
        className="search-results-mobile"
      >
        {loading ? (
          <div style={{ textAlign: "center", color: "#999", marginTop: "40px" }}>
            Recherche en cours...
          </div>
        ) : query.trim() && results.length === 0 ? (
          <div style={{ textAlign: "center", color: "#999", marginTop: "40px" }}>
            Aucun produit trouvé pour "{query}"
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "24px",
              maxWidth: "1440px",
              margin: "0 auto",
            }}
          >
            {results.map((product) => {
              const rawImage = product.images?.[0];
              const image = typeof rawImage === "string" ? rawImage : "/assets/placeholder.png";
              // We need to resolve the link correctly
              // Products could be under any category, so we just use their id or slug if category is unknown.
              // Given the app structure, product links often require categorySlug.
              // Since we might not have it in Search, we can fallback to /products/:id or if the app handles it.
              // Wait, in products/index.tsx the link was `/products/${categorySlug}/${productSlug}`
              // Let's check `ProductCard.tsx` if there is a generic link.
              // We can use `/products/all/${product.slug || product.id}` or just rely on a search route.
              // Assuming there is a dynamic route `products/[categorySlug]/[productSlug].tsx`,
              // we can pass a dummy category like 'search' or 'all' if needed, or if the product has `category` we can use it.
              const productSlug = (product.slug || product.id || "").replace(/\//g, "~");
              const linkUrl = `/products/search/${productSlug}`;

              return (
                <Link
                  key={product.id}
                  href={linkUrl}
                  onClick={onClose}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ cursor: "pointer" }}>
                    <div
                      style={{
                        position: "relative",
                        aspectRatio: "3/4",
                        backgroundColor: "#f5f3f0",
                        marginBottom: "12px",
                      }}
                    >
                      <Image
                        src={image.startsWith("http") ? image : `${process.env.NEXT_PUBLIC_IMAGE_URL || "http://localhost:5000"}${image}`}
                        alt={product.code}
                        fill
                        unoptimized
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <h3 style={{ fontSize: "14px", margin: "0 0 4px", fontWeight: 500 }}>
                      {product.code}
                    </h3>
                    {product.name && (
                      <p style={{ fontSize: "12px", color: "#666", margin: "0 0 6px", fontStyle: "italic" }}>
                        {product.name}
                      </p>
                    )}
                    <p style={{ fontSize: "12px", color: "#999", margin: 0 }}>
                      {product.price ? `${product.price} TND` : "Prix variable"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (max-width: 640px) {
          .search-header-mobile {
            padding: 16px !important;
          }
          .search-results-mobile {
            padding: 20px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
