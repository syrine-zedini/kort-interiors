import React, { useState } from "react";
import { ProductWithVariants } from "../../types/product";

interface ProductCardProps {
    product: ProductWithVariants;
    onSelect: (product: ProductWithVariants) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
    const [hovered, setHovered] = useState(false);

    if (!product) return null;

    const variant = product?.variants?.[0] || null;

    let displayImage = variant?.images?.[0] || product.images?.[0] || "";
    if (displayImage && displayImage !== "/placeholder.png") {
        if (!displayImage.startsWith("/assets/") && !displayImage.startsWith("http")) {
            displayImage = `${process.env.NEXT_PUBLIC_IMAGE_URL}${displayImage}`;
        }
    }

    const priceCandidates: number[] = [];
    const pushPrice = (value?: unknown) => {
        const n = Number(value);
        if (Number.isFinite(n) && n > 0) {
            priceCandidates.push(n);
        }
    };

    // Product-level pricing
    pushPrice(product.pricing?.finalPrice);
    if (product.price != null) {
        const base = Number(product.price);
        const discount = Number(product.discount ?? 0);
        pushPrice(Math.max(0, base - discount));
    }

    // Variant-level pricing
    (product.variants ?? []).forEach((v) => {
        const base = Number(v.price ?? NaN);
        if (Number.isFinite(base)) {
            const discount = Number(v.discount ?? 0);
            pushPrice(Math.max(0, base - discount));
        }
    });

    // Size/material pricing (with and without promotion)
    if (product.sizeMaterialPricingWithPromotion && typeof product.sizeMaterialPricingWithPromotion === "object") {
        Object.values(product.sizeMaterialPricingWithPromotion).forEach((materials) => {
            if (!materials || typeof materials !== "object") return;
            Object.values(materials).forEach((pricing: any) => pushPrice(pricing?.finalPrice));
        });
    }
    if (product.sizeMaterialPricing && typeof product.sizeMaterialPricing === "object") {
        Object.values(product.sizeMaterialPricing).forEach((materials) => {
            if (!materials || typeof materials !== "object") return;
            Object.values(materials).forEach((price) => pushPrice(price));
        });
    }

    const minPrice = priceCandidates.length > 0 ? Math.min(...priceCandidates) : null;
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onSelect(product)}
            style={{ cursor: "pointer" }}
        >
            {/* Image */}
            <div style={{
                position: "relative",
                overflow: "hidden",
                background: "#f5f3f0",
                aspectRatio: "3 / 4",
            }}>
                {displayImage ? (
                    <img
                        src={displayImage}
                        alt={product.code}
                        style={{
                            width: "100%", height: "100%",
                            objectFit: "cover",
                            transform: hovered ? "scale(1.04)" : "scale(1)",
                            transition: "transform 0.7s cubic-bezier(0.16,1,0.3,1)",
                            display: "block",
                        }}
                    />
                ) : (
                    <div style={{ width: "100%", height: "100%", background: "#ece8e2" }} />
                )}

                {/* Promotion badge */}
                {product.promotion && (
                    <div style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        background: "#c0392b",
                        color: "#fff",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                    }}>
                        {product.promotion.discountType === "percentage"
                            ? `-${Number(product.promotion.discountValue).toFixed(0)}%`
                            : `-${Number(product.promotion.discountValue).toFixed(2)}DT`}
                    </div>
                )}

                {/* Bouton survol */}
                <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    padding: "16px",
                    opacity: hovered ? 1 : 0,
                    transform: hovered ? "translateY(0)" : "translateY(8px)",
                    transition: "opacity 0.3s ease, transform 0.3s ease",
                }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelect(product); }}
                        style={{
                            width: "100%",
                            padding: "13px",
                            background: "#fff",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "9px",
                            letterSpacing: "2.5px",
                            textTransform: "uppercase",
                            fontWeight: 600,
                            color: "#1a1a1a",
                        }}
                    >
                        Voir le produit
                    </button>
                </div>
            </div>

            {/* Infos produit */}
            <div style={{ padding: "14px 0 24px" }}>
                <h3 style={{
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "#1a1a1a",
                    margin: "0 0 6px",
                    letterSpacing: "0.2px",
                }}>
                    {product.code}
                </h3>
                {product.name && (
                    <p style={{
                        fontSize: "12px",
                        color: "#666",
                        margin: "0 0 6px",
                        fontStyle: "italic",
                    }}>
                        {product.name}
                    </p>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {product.promotion && product.pricing?.basePrice != null && (
                        <span style={{
                            fontSize: "12px",
                            color: "#888",
                            textDecoration: "line-through",
                        }}>
                            {Number(product.pricing.basePrice).toFixed(2)} DT
                        </span>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{
                            fontSize: "13px",
                            color: product.promotion ? "#c0392b" : "#1a1a1a",
                            fontWeight: 500,
                        }}>
                            {minPrice != null ? `${minPrice.toFixed(2)} DT` : "Prix indisponible"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
