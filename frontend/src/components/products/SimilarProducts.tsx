import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "@/libs/axios";
import { ProductWithVariants } from "../../types/product";
import { ProductCard } from "./card";

interface SimilarProductsProps {
    categoryId?: string;
    currentProductId: string;
    categorySlug?: string;
}

export const SimilarProducts: React.FC<SimilarProductsProps> = ({ categoryId, currentProductId, categorySlug }) => {
    const router = useRouter();
    const [products, setProducts] = useState<ProductWithVariants[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!categorySlug) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        const fetchSimilar = async () => {
            setLoading(true);
            try {
                const res = await api.get<ProductWithVariants[]>(`/products/category/${categorySlug}`);
                if (!cancelled) {
                    const allProducts = res.data || [];
                    const similar = allProducts.filter(p => p.id !== currentProductId).slice(0, 4);
                    setProducts(similar);
                }
            } catch (err) {
                // ignore
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchSimilar();
        return () => {
            cancelled = true;
        };
    }, [categorySlug, currentProductId]);

    if (loading || products.length === 0) return null;

    return (
        <div style={{ padding: "80px 24px", maxWidth: 1300, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 60 }}>
                <div style={{ height: 1, background: "#e0e0e0", flex: 1, maxWidth: 300 }} />
                <h2 style={{
                    margin: "0 24px",
                    fontSize: 22,
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    color: "#1a1a1a"
                }}>
                    VOUS POUVEZ AUSSI ACHETER
                </h2>
                <div style={{ height: 1, background: "#e0e0e0", flex: 1, maxWidth: 300 }} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: "24px" }}>
                {products.map(product => (
                    <div key={product.id} style={{ display: "flex", flexDirection: "column" }}>
                        <ProductCard
                            product={product}
                            onSelect={() => {
                                const pSlug = (product.slug ?? product.id)?.replace(/\//g, '~');
                                router.push(`/products/${categorySlug}/${pSlug}`);
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
