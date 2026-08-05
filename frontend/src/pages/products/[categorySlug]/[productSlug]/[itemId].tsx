import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ClientSideLayout } from "../../../../layouts/client-side";
import Loader from "../../../../layouts/client-side/loader";
import api from "@/libs/axios";
import { ProductWithVariants, ProductItem } from "@/types/product";
import { useAddToCart } from "@/hooks/useCart";
import { getAllColors } from "@/services/color.service";
import AuthModal from "@/components/home/AuthModal";
import { SimilarProducts } from "@/components/products/SimilarProducts";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

function resolveImg(path: string | undefined): string {
    if (!path) return "/placeholder.png";
    return path.startsWith("http") ? path : `${IMAGE_BASE}${path}`;
}

export default function ItemDetailPage() {
    const router = useRouter();
    const { categorySlug, productSlug, itemId } = router.query;

    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<ProductWithVariants | null>(null);
    const [item, setItem] = useState<ProductItem | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState<string>("");
    const [selectedColor, setSelectedColor] = useState<string>("");
    const [selectedMaterial, setSelectedMaterial] = useState<string>("");
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [allColors, setAllColors] = useState<Record<string, { nameFr: string; hex: string }>>({});
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
    const [hoverZoomData, setHoverZoomData] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    const { addToCart, isAdding } = useAddToCart();

    // Load colors
    useEffect(() => {
        (async () => {
            try {
                const colors = await getAllColors();
                const map: Record<string, { nameFr: string; hex: string }> = {};
                colors.forEach((c) => {
                    map[c.id] = { nameFr: c.nameFr, hex: c.hex };
                });
                setAllColors(map);
            } catch (e) {
                // fail silently
            }
        })();
    }, []);

    // Fetch product and find item
    useEffect(() => {
        if (!productSlug || Array.isArray(productSlug) || !itemId || Array.isArray(itemId)) return;

        let cancelled = false;
        const run = async () => {
            setLoading(true);
            setProduct(null);
            setItem(null);
            try {
                const res = await api.get<ProductWithVariants>(`/products/${productSlug}`, {
                    params: { _t: Date.now() },
                });
                if (!cancelled) {
                    setProduct(res.data);
                    const foundItem = res.data.items?.find((i) => i.id === itemId);
                    setItem(foundItem || null);
                    // Set default size and color
                    if (foundItem) {
                        if (foundItem.sizes?.length) {
                            setSelectedSize(foundItem.sizes[0]);
                        }
                        if (foundItem.colors?.length) {
                            setSelectedColor(foundItem.colors[0]);
                        }
                    }
                }
            } catch (e) {
                if (!cancelled) {
                    setProduct(null);
                    setItem(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [productSlug, itemId]);

    if (!productSlug || Array.isArray(productSlug) || !itemId || Array.isArray(itemId) || loading) {
        return <Loader />;
    }

    if (!product || !item) {
        return (
            <ClientSideLayout isNavbarOn={true}>
                <div style={{ paddingTop: 88, background: "#fff", minHeight: "100vh" }}>
                    <div style={{ borderTop: "1px solid #ece8e2" }}>
                        <div style={{ padding: "80px 24px", textAlign: "center", color: "#999" }}>
                            Produit introuvable.
                        </div>
                    </div>
                </div>
            </ClientSideLayout>
        );
    }

    const itemPrice = Number(item.price ?? 0);
    const itemDiscount = Number(item.discount ?? 0);
    const itemFinalPrice = Math.max(0, itemPrice - itemDiscount);

    const itemColorIds = item.colors ?? [];
    const colorOptions = Array.from(new Set<string>(itemColorIds)).map((id: string) => {
        const meta = allColors[id];
        return {
            key: id,
            hex: meta?.hex ?? "#d1d5db",
            label: meta?.nameFr ?? "",
        };
    });

    const materialOptions = selectedSize && item.sizeMaterialPricing?.[selectedSize]
        ? Object.keys(item.sizeMaterialPricing[selectedSize])
        : [];

    const handleAddToCart = async () => {
        try {
            await addToCart(
                product.id,
                quantity,
                selectedSize || undefined,
                selectedColor || undefined,
                item.id,
                selectedMaterial || undefined
            );
            setToastMessage('✓ Produit ajouté au panier!');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (err: any) {
            if (err?.message === "AUTH_REQUIRED" || err?.code === "AUTH_REQUIRED") {
                setShowAuthModal(true);
            } else {
                setToastMessage('✕ Erreur lors de l\'ajout au panier');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            }
        }
    };

    return (
        <ClientSideLayout isNavbarOn={true}>
            <div style={{ paddingTop: 88, background: "#fff", minHeight: "100vh" }}>
                <div style={{ borderTop: "1px solid #ece8e2" }}>
                    <div style={{
                        maxWidth: 1200,
                        margin: "0 auto",
                        padding: "40px 20px",
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    }}>
                        {/* Back button */}
                        <Link
                            href={`/products/${categorySlug}/${productSlug}`}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "32px",
                                fontSize: "10px",
                                letterSpacing: "2px",
                                textTransform: "uppercase",
                                color: "#666",
                                textDecoration: "none",
                                transition: "color 0.2s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#1a1a1a")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
                        >
                            ← Retour au produit
                        </Link>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">

                            {/* Left: Item image */}
                            <div>
                                <div
                                    style={{
                                        background: "#f7f5f2",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minHeight: 420,
                                        overflow: "hidden",
                                        cursor: "crosshair",
                                        position: "relative",
                                    }}
                                    onClick={() => setIsImageZoomOpen(true)}
                                    onMouseMove={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                                        setHoverZoomData({ x, y, width: rect.width, height: rect.height });
                                    }}
                                    onMouseLeave={() => setHoverZoomData(null)}
                                >
                                    <img
                                        src={resolveImg(item.images?.[0])}
                                        alt={item.name}
                                        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                                    />

                                    {/* Hover Zoom Lens */}
                                    {hoverZoomData && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: `${hoverZoomData.x}%`,
                                                top: `${hoverZoomData.y}%`,
                                                transform: "translate(-50%, -50%)",
                                                width: 180,
                                                height: 180,
                                                borderRadius: "50%",
                                                border: "2px solid rgba(26, 26, 26, 0.3)",
                                                overflow: "hidden",
                                                boxShadow: "0 4px 20px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.3)",
                                                pointerEvents: "none",
                                                zIndex: 20,
                                                background: "#f7f5f2",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    backgroundImage: `url(${resolveImg(item.images?.[0])})`,
                                                    backgroundSize: `${hoverZoomData.width * 2.5}px ${hoverZoomData.height * 2.5}px`,
                                                    backgroundPosition: `${hoverZoomData.x}% ${hoverZoomData.y}%`,
                                                    backgroundRepeat: "no-repeat",
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Item info */}
                            <div style={{ display: "flex", flexDirection: "column", paddingTop: 8 }}>

                                {/* Brand + Item name */}
                                <div style={{ marginBottom: 16 }}>
                                    <p style={{ fontSize: 14, color: "#555", margin: "0 0 6px 0" }}>
                                        {product.brand ?? "KORT INTERIORS"}
                                    </p>
                                    <h1 style={{
                                        fontSize: 28,
                                        fontWeight: 400,
                                        color: "#1a1a1a",
                                        margin: 0,
                                        fontFamily: "Georgia, 'Times New Roman', serif",
                                        letterSpacing: "0.01em",
                                        lineHeight: 1.2,
                                    }}>
                                        {item.name}
                                    </h1>
                                    <p style={{ fontSize: 13, color: "#888", margin: "8px 0 0", fontStyle: "italic" }}>
                                        Pièce du produit: {product.name}
                                    </p>
                                </div>

                                {/* Price */}
                                <div style={{ marginBottom: 24 }}>
                                    {itemDiscount > 0 && (
                                        <div style={{ marginBottom: 12 }}>
                                            <span style={{ fontSize: 14, color: "#888", textDecoration: "line-through" }}>
                                                {itemPrice.toFixed(2)}DT
                                            </span>
                                            <p style={{ fontSize: 12, color: "#c0392b", margin: "6px 0 0" }}>
                                                Économisez {itemDiscount.toFixed(2)}DT
                                            </p>
                                        </div>
                                    )}
                                    <span style={{ fontSize: 28, fontWeight: 400, color: itemDiscount > 0 ? "#c0392b" : "#1a1a1a" }}>
                                        {itemFinalPrice.toFixed(2)}DT
                                    </span>
                                </div>

                                {/* Description */}
                                {item.description && (
                                    <div style={{ marginBottom: 24 }}>
                                        <p style={{ fontSize: 14, color: "#333", lineHeight: 1.8 }}>
                                            {item.description}
                                        </p>
                                    </div>
                                )}

                                {/* Colors */}
                                {colorOptions.length > 0 && (
                                    <div style={{ marginBottom: 20 }}>
                                        <p style={{ fontSize: 14, color: "#333", margin: "0 0 12px 0" }}>
                                            Couleur : <strong>{allColors[selectedColor]?.nameFr || "—"}</strong>
                                        </p>
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                            {colorOptions.map((colorOption) => {
                                                const isSelected = selectedColor === colorOption.key;
                                                return (
                                                    <button
                                                        key={colorOption.key}
                                                        title={colorOption.label || colorOption.hex}
                                                        onClick={() => setSelectedColor(colorOption.key)}
                                                        style={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: "50%",
                                                            backgroundColor: colorOption.hex,
                                                            border: isSelected ? "2px solid #1a1a1a" : "2px solid #fff",
                                                            cursor: "pointer",
                                                            padding: 0,
                                                            boxShadow: "0 0 0 1px #e0e0e0",
                                                            transition: "outline 0.15s ease",
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Material selector */}
                                {materialOptions.length > 0 && (
                                    <div style={{ marginBottom: 20 }}>
                                        <p style={{ fontSize: 14, color: "#333", margin: "0 0 12px 0" }}>
                                            Matériau : <strong>{selectedMaterial || "—"}</strong>
                                        </p>
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                            {materialOptions.map((material) => {
                                                const isSelected = selectedMaterial === material;
                                                return (
                                                    <button
                                                        key={material}
                                                        onClick={() => setSelectedMaterial(material)}
                                                        style={{
                                                            padding: "8px 16px",
                                                            borderRadius: "4px",
                                                            border: isSelected ? "2px solid #1a1a1a" : "1px solid #d5d0ca",
                                                            background: isSelected ? "#1a1a1a" : "#fff",
                                                            color: isSelected ? "#fff" : "#1a1a1a",
                                                            cursor: "pointer",
                                                            fontSize: 13,
                                                            fontWeight: isSelected ? 600 : 400,
                                                            transition: "all 0.2s",
                                                        }}
                                                    >
                                                        {material}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Size dropdown */}
                                {item.sizes && item.sizes.length > 0 && (
                                    <div style={{ marginBottom: 12, position: "relative" }}>
                                        <select
                                            value={selectedSize}
                                            onChange={(e) => setSelectedSize(e.target.value)}
                                            style={{
                                                width: "100%",
                                                appearance: "none",
                                                WebkitAppearance: "none",
                                                border: "1px solid #bbb",
                                                borderRadius: 0,
                                                padding: "14px 40px 14px 16px",
                                                fontSize: 14,
                                                color: selectedSize ? "#1a1a1a" : "#888",
                                                background: "#fff",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <option value="" disabled>Taille...</option>
                                            {item.sizes.map((size) => (
                                                <option key={size} value={size}>{size}</option>
                                            ))}
                                        </select>
                                        <span style={{
                                            position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                                            pointerEvents: "none", fontSize: 12, color: "#555",
                                        }}>▼</span>
                                    </div>
                                )}

                                {/* Quantity + Add to cart */}
                                <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
                                    <div style={{ position: "relative", flexShrink: 0 }}>
                                        <select
                                            value={quantity}
                                            onChange={(e) => setQuantity(parseInt(e.target.value))}
                                            style={{
                                                appearance: "none",
                                                WebkitAppearance: "none",
                                                border: "1px solid #bbb",
                                                borderRight: "none",
                                                borderRadius: 0,
                                                padding: "14px 36px 14px 16px",
                                                fontSize: 14,
                                                color: "#1a1a1a",
                                                background: "#fff",
                                                cursor: "pointer",
                                                width: 80,
                                            }}
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                                <option key={n} value={n}>{n}</option>
                                            ))}
                                        </select>
                                        <span style={{
                                            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                                            pointerEvents: "none", fontSize: 11, color: "#555",
                                        }}>▼</span>
                                    </div>

                                    <button
                                        onClick={handleAddToCart}
                                        disabled={isAdding}
                                        style={{
                                            flex: 1,
                                            padding: "14px 24px",
                                            background: isAdding ? "#555" : "#1a1a1a",
                                            color: "#fff",
                                            border: "none",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            letterSpacing: 1.5,
                                            cursor: isAdding ? "not-allowed" : "pointer",
                                            opacity: isAdding ? 0.7 : 1,
                                            transition: "background 0.2s",
                                        }}
                                    >
                                        {isAdding ? 'AJOUT EN COURS...' : 'AJOUTER AU PANIER'}
                                    </button>
                                </div>

                                {/* Trust badges */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                                    {[
                                        { icon: "🛍", label: "Livraison express gratuite" },
                                        { icon: "↩", label: "Retours 30 jours gratuits" },
                                        { icon: "3×", label: "3 x sans frais dès 300 DT" },
                                    ].map(({ icon, label }) => (
                                        <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#333" }}>
                                            <span style={{ fontSize: 14, width: 22, textAlign: "center", flexShrink: 0 }}>{icon}</span>
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Similar Products */}
            <SimilarProducts 
                relatedProducts={(product as any).relatedProducts}
                categoryId={product.categoryId} 
                currentProductId={product.id} 
                categorySlug={Array.isArray(categorySlug) ? categorySlug[0] : categorySlug ?? ""} 
            />


            {/* Toast Notification */}
            {showToast && (
                <div style={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
                    background: toastMessage.includes('✕') ? '#ef4444' : '#fff',
                    color: toastMessage.includes('✕') ? '#fff' : '#1a1a1a',
                    padding: '16px 20px',
                    zIndex: 1000,
                    animation: 'slideUp 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                    borderLeft: toastMessage.includes('✕') ? 'none' : '3px solid #1a1a1a',
                    minWidth: 260,
                }}>
                    {!toastMessage.includes('✕') && (
                        <div style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: '#1a1a1a',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>
                        </div>
                    )}
                    <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>
                            {toastMessage.includes('✕') ? 'Erreur' : 'Ajouté au panier'}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: toastMessage.includes('✕') ? 'rgba(255,255,255,0.8)' : '#666' }}>
                            {toastMessage.includes('✕') ? "Une erreur est survenue." : "Votre article a bien été ajouté."}
                        </p>
                    </div>
                </div>
            )}

            {/* Image zoom modal */}
            {isImageZoomOpen && (
                <div
                    onClick={() => setIsImageZoomOpen(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 1250,
                        background: "rgba(0, 0, 0, 0.75)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 20,
                        backdropFilter: "blur(4px)",
                    }}
                >
                    <button
                        onClick={() => setIsImageZoomOpen(false)}
                        style={{
                            position: "absolute",
                            top: 16,
                            right: 20,
                            border: "none",
                            background: "transparent",
                            color: "#fff",
                            fontSize: 30,
                            lineHeight: 1,
                            cursor: "pointer",
                            padding: 4,
                        }}
                        aria-label="Fermer le zoom"
                    >
                        ×
                    </button>
                    <img
                        src={resolveImg(item?.images?.[0])}
                        alt={item?.name}
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            width: "auto",
                            height: "auto",
                            maxWidth: "95vw",
                            maxHeight: "92vh",
                            objectFit: "contain",
                            display: "block",
                        }}
                    />
                </div>
            )}

            {/* Auth Modal */}
            <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

            <style jsx>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </ClientSideLayout>
    );
}
