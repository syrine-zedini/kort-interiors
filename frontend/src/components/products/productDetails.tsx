import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { ProductWithVariants, ProductVariant } from "../../types/product";
import { useAddToCart } from "@/hooks/useCart";
import { getAllColors } from "@/services/color.service";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/home/AuthModal";
import api from "@/libs/axios";

interface ProductDetailsProps {
    product: ProductWithVariants;
    categorySlug?: string;
    initialColor?: string;
    initialSize?: string;
}

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";
const MATERIAL_ONLY_SIZE_KEY = "__material_only__";

function resolveImg(path: string | undefined): string {
    if (!path) return "/placeholder.png";
    if (path.startsWith("/assets/") || path.startsWith("http")) return path;
    return `${IMAGE_BASE}${path}`;
}

// ✅ FONCTION UTILITAIRE: Générer une couleur hex à partir d'un nom de couleur
const generateColorHex = (colorName: string): string => {
    // Map de couleurs communes français → hex
    const colorMap: Record<string, string> = {
        // Blancs / Crèmes
        "blanc": "#FFFFFF",
        "blanc casse": "#F8F4EC",
        "blanc casse2": "#F0EAD6",
        "ivoire": "#FFFFF0",
        "creme": "#FFFDD0",
        "crème": "#FFFDD0",
        "ecru": "#F0DFB4",
        // Gris / Argent / Anthracite
        "gris": "#808080",
        "gris clair": "#D3D3D3",
        "gris fonce": "#4A4A4A",
        "anthracite": "#383838",
        "argent": "#C0C0C0",
        "chrome": "#C0C0C0",
        "titan": "#5A6472",
        "platine": "#E5E4E2",
        // Noirs
        "noir": "#000000",
        // Bleus
        "bleu": "#4169E1",
        "bleu clair": "#ADD8E6",
        "bleu marine": "#000080",
        "bleu nuit": "#0D1B2A",
        "bleunuit": "#0D1B2A",
        "navy": "#001F5B",
        "indigo": "#4B0082",
        "denim": "#1560BD",
        // Verts
        "vert": "#228B22",
        "vert clair": "#90EE90",
        "vert kaki": "#4B5320",
        "kaki": "#5C5A1E",
        "sauge": "#7C9D74",
        "menthe": "#3EB489",
        "emeraude": "#50C878",
        "olive": "#808000",
        "foret": "#228B22",
        // Rouges / Roses / Fuchsia
        "rouge": "#CC1818",
        "bordeaux": "#800020",
        "grenat": "#6B0F1A",
        "framboise": "#C72C48",
        "rose": "#FF69B4",
        "rose clair": "#FFB6C1",
        "rose fushia": "#FF1493",
        "fushia": "#FF1493",
        "fuchsia": "#FF1493",
        "dahlia": "#BC3F7C",
        // Oranges / Corail / Saumon
        "orange": "#FFA500",
        "corail": "#FF7F50",
        "saumon": "#FA8072",
        "terracotta": "#E2725B",
        "rouille": "#A0522D",
        // Jaunes / Or / Dorés
        "jaune": "#FFD700",
        "or": "#FFD700",
        "gold": "#FFD700",
        "dore": "#DAA520",
        "doré": "#DAA520",
        "dore-jaune": "#DAA520",
        "doré-jaune": "#DAA520",
        "modoré": "#8B6914",
        "modore": "#8B6914",
        "mordore": "#8B6914",
        "mordoré": "#8B6914",
        "ocre": "#CC7722",
        "moutarde": "#C8A415",
        // Bruns / Camel / Taupe
        "marron": "#6F4E37",
        "marron fonce": "#3D2B1F",
        "chocolat": "#7B3F00",
        "brun": "#795548",
        "camel": "#C19A6B",
        "caramel": "#C68E5B",
        "noisette": "#9C6B30",
        "taupe": "#7A6A58",
        "beige": "#D4B896",
        "lin": "#E8D5B7",
        "sable": "#D4B896",
        "angora": "#E8D5C4",
        "naturel": "#D2B48C",
        "terre": "#8B5E3C",
        // OOPOS-specific colors & materials
        "stanless steel": "#A8A9AD",
        "stainless steel": "#A8A9AD",
        "inox": "#A8A9AD",
        "acier": "#A8A9AD",
        "canard": "#006D6F",
        "crepuscule": "#6B4E8C",
        "glacier": "#B0CDE0",
        "lagon": "#00A8A8",
        "mint": "#98D5B5",
        "gris souris": "#9E9E9E",
        "rose fume": "#C5908E",
        "titane": "#878681",
        "uni bleu": "#4169E1",
        // Violets / Lilas / Lavande
        "violet": "#800080",
        "mauve": "#E0B0FF",
        "lilas": "#C8A2C8",
        "lavande": "#B57EDC",
        "prune": "#4E1A45",
        // Autres
        "turquoise": "#40E0D0",
        "transparent": "rgba(200,200,200,0.5)",
        "multicolore": "linear-gradient(135deg, #f00, #0f0, #00f)",
    };

    if (!colorName || colorName === "." || colorName.trim() === "") return "#d1d5db";

    const normalized = colorName.toLowerCase().trim()
        .normalize("NFD").replace(/[̀-ͯ]/g, ""); // strip accents for fallback
    const normalizedWithAccents = colorName.toLowerCase().trim();
    if (colorMap[normalizedWithAccents]) return colorMap[normalizedWithAccents];
    if (colorMap[normalized]) return colorMap[normalized];

    // Strip trailing digits (OOPOS codes like "BLANC35809" → "blanc", "GRIS SOURIS42" → "gris souris")
    const withoutSuffix = normalized.replace(/\d+$/, "").trim();
    if (colorMap[withoutSuffix]) return colorMap[withoutSuffix];
    // Try first word only ("gris souris" → "gris")
    const firstWord = withoutSuffix.split(" ")[0];
    if (firstWord && colorMap[firstWord]) return colorMap[firstWord];

    // Keyword-based fallback for pattern/motif names
    const up = colorName.toUpperCase();
    if (/AZUR|MARIN|HORIZON|OCEAN|NEBULA|FLUX|LIANO/.test(up)) return "#5B9BD5";
    if (/JUNGLE|VERDA|FEUILLAGE|FORET|PALMIER|TROPICAL|HERBA/.test(up)) return "#5C9E6A";
    if (/FLAMME|TERRA|ROUILLE|CORAIL|TULIPA|TAROKO/.test(up)) return "#D9603B";
    if (/SABLE|DUNE|NUBE|SOUL|TRAME/.test(up)) return "#C8A97E";
    if (/PINK|PETAL|FLORINA|PASTELA|ORNELLA/.test(up)) return "#E8839F";
    if (/BLOOM|FLORA|FLORAISON|FLOREX|SYLVA|SYLORA/.test(up)) return "#B5785C";
    if (/NOIR|SHADOW|OMBRE/.test(up)) return "#3A3A3A";
    if (/OR|GOLD|SOLAIRE|PRISME/.test(up)) return "#C9A84C";
    if (/VERT|SAUGE|OLIVE|SAFARI/.test(up)) return "#7A9E6E";

    // Deterministic pastel color from name hash (unique per pattern)
    let hash = 0;
    for (let i = 0; i < colorName.length; i++) {
        hash = colorName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    const s = 35 + (Math.abs(hash >> 8) % 25);
    const l = 52 + (Math.abs(hash >> 16) % 20);
    return `hsl(${h}, ${s}%, ${l}%)`;
};


export const ProductDetails: React.FC<ProductDetailsProps> = ({ product, categorySlug, initialColor, initialSize }) => {
    const router = useRouter();
    if (!product) return <p>Produit introuvable</p>;

    const displayName = product.name || product.code || "";

    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
        product.variants?.[0] ?? null
    );
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState<string>(initialSize ?? "");
    const [selectedColorId, setSelectedColorId] = useState<string>(
        product.items?.[0]?.colors?.[0] ??
        product.colors?.[0] ??
        product.variants?.find((v) => v.color)?.color ??
        ""
    );
    const [selectedMaterial, setSelectedMaterial] = useState<string>("");
    const [descriptionOpen, setDescriptionOpen] = useState(true);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [isMainImageZoomOpen, setIsMainImageZoomOpen] = useState(false);
    const [allColors, setAllColors] = useState<Record<string, { nameFr: string; hex: string }>>({});
    const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
    const [itemSelectedSizes, setItemSelectedSizes] = useState<Record<string, string>>({});
    const [selectedItem, setSelectedItem] = useState<import("../../types/product").ProductItem | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [hoverZoomData, setHoverZoomData] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [subHoverZoomData, setSubHoverZoomData] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageTransitioning, setImageTransitioning] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [initialColorResolved, setInitialColorResolved] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState<ProductWithVariants[]>([]);

    const { addToCart, isAdding } = useAddToCart();
    const { isAuthenticated } = useAuth();
    const hasItems = product.items && product.items.length > 0;

    const displayImages: string[] =
        (hasItems
            ? product.images
            : (selectedVariant?.images?.length ? selectedVariant.images : product.images)) ?? [];

    const [mainImage, setMainImage] = useState<string>(resolveImg(displayImages[0]));

    React.useEffect(() => {
        setMainImage(resolveImg(displayImages[0]));
        setCurrentImageIndex(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedVariant, product.id]);

    const displayPrice = Number(selectedVariant?.price ?? product.price ?? 0);
    const displayDiscount = Number(selectedVariant?.discount ?? product.discount ?? 0);

    const applyProductPromotion = (basePrice: number): number => {
        if (!product.promotion) return basePrice;
        const discountValue = Number(product.promotion.discountValue ?? 0);
        if (!Number.isFinite(discountValue) || discountValue <= 0) return basePrice;
        if (product.promotion.discountType === "percentage") {
            return Math.max(0, basePrice - (basePrice * discountValue) / 100);
        }
        return Math.max(0, basePrice - discountValue);
    };

    // For variant-driven products, the selected variant price must win over product-level pricing.
    const selectedVariantHasOwnPrice = selectedVariant?.price != null;
    const variantOrProductCalculatedPrice = Math.max(0, displayPrice - displayDiscount);
    const variantOrProductPromotedPrice = applyProductPromotion(variantOrProductCalculatedPrice);
    const productLevelFinalPrice = Number(product.pricing?.finalPrice);
    const basePriceBeforeMaterial =
        !selectedVariantHasOwnPrice && Number.isFinite(productLevelFinalPrice)
            ? productLevelFinalPrice
            : variantOrProductPromotedPrice;

    const sizes = Array.from(new Set(
        product.variants?.map((v) => v.size).filter(Boolean) ?? []
    )) as string[];
    const visibleSizes = sizes.filter((size) => size !== MATERIAL_ONLY_SIZE_KEY);
    const effectiveSelectedSize =
        selectedSize || (sizes.length === 1 ? sizes[0] : "");

    // Get materials available for selected size and find the price
    // Use promotion-adjusted pricing if available, otherwise use original pricing
    const materialsForSize =
        product.sizeMaterialPricingWithPromotion?.[effectiveSelectedSize] ??
        product.sizeMaterialPricing?.[effectiveSelectedSize] ??
        {};
    const hasSelectedMaterial = selectedMaterial && selectedMaterial in materialsForSize;

    // If using promotion-adjusted pricing, materialPrice is an object with pricing info; otherwise it's just a number
    let finalPrice = Number.isFinite(basePriceBeforeMaterial) ? basePriceBeforeMaterial : 0;
    if (hasSelectedMaterial) {
        const materialPrice = materialsForSize[selectedMaterial];
        if (typeof materialPrice === 'object' && 'finalPrice' in materialPrice) {
            // Promotion-adjusted pricing
            finalPrice = Number((materialPrice as { finalPrice?: number | string }).finalPrice ?? basePriceBeforeMaterial);
        } else {
            // Original pricing (just a number)
            finalPrice = Number(materialPrice) || basePriceBeforeMaterial;
        }
    }
    finalPrice = Number.isFinite(finalPrice) ? finalPrice : 0;
    const savingsAmount = Math.max(0, displayPrice - finalPrice);

    // Build color options from all related products (same code) to show all available colors
    const getAllColorIds = () => {
        const colorSet = new Set<string>();
        (relatedProducts.length > 0 ? relatedProducts : [product]).forEach((p) => {
            // Add product-level colors
            if (p.colors && p.colors.length > 0) {
                p.colors.forEach((c) => colorSet.add(c));
            }
            // Add variant colors
            if (p.variants) {
                p.variants.forEach((v) => {
                    if (v.color) colorSet.add(v.color);
                });
            }
        });
        return Array.from(colorSet);
    };

    const rawColorIds = getAllColorIds();

    const colorMap = useMemo(() => allColors, [allColors]);

    // Build set of colors that have images attached (from produits_couleurs SQL via backend)
    const colorsWithImages = useMemo(() => {
        const s = new Set<string>();
        (relatedProducts.length > 0 ? relatedProducts : [product]).forEach((p) => {
            (p.variants ?? []).forEach((v: any) => {
                if (v.color && v.images && v.images.length > 0) s.add(v.color);
            });
        });
        return s;
    }, [relatedProducts, product]);

    // Only show colors that have photos; if none have photos, show all
    const colorOptions = Array.from(new Set<string>(rawColorIds))
    .filter((colorName) => colorsWithImages.size === 0 || colorsWithImages.has(colorName))
    .map((colorName: string) => {
        const meta = colorMap[colorName];
        if (meta) {
            return {
                key: colorName,
                hex: meta.hex,
                label: meta.nameFr,
            };
        }
        return {
            key: colorName,
            hex: generateColorHex(colorName),
            label: colorName,
        };
    });

    // If current selectedColorId was filtered out (no images), auto-select the first color that has images
    useEffect(() => {
        if (colorsWithImages.size > 0 && !colorsWithImages.has(selectedColorId)) {
            const firstColor = Array.from(colorsWithImages)[0];
            setSelectedColorId(firstColor);
            const allVariants = (relatedProducts.length > 0 ? relatedProducts : [product])
                .flatMap((p: any) => p.variants ?? []);
            const matchingVariant = allVariants.find(
                (v: any) => v.color === firstColor && v.images?.length > 0
            );
            if (matchingVariant) setSelectedVariant(matchingVariant as any);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [colorsWithImages]);

    const materials = product.sizeMaterialPricingWithPromotion?.[effectiveSelectedSize]
        ? Object.keys(product.sizeMaterialPricingWithPromotion[effectiveSelectedSize])
        : (product.sizeMaterialPricing?.[effectiveSelectedSize]
            ? Object.keys(product.sizeMaterialPricing[effectiveSelectedSize])
            : []);

    // ✅ CORRECTION: Derive selected color name for display (now it's a string)
    const selectedColorMeta = selectedColorId ? colorMap[selectedColorId] : undefined;
    const selectedColorName =
        selectedColorMeta?.nameFr ??
        selectedColorId ?? // ✅ PRIORITÉ: Use selectedColorId directly (it's the color name)
        selectedVariant?.colorData?.nameFr ??
        selectedVariant?.color ??
        "";

    // Helper: update URL query params via shallow routing
    const updateQueryParams = (params: Record<string, string | undefined>) => {
        const currentQuery = { ...router.query };
        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                currentQuery[key] = value;
            } else {
                delete currentQuery[key];
            }
        });
        router.replace({ pathname: router.pathname, query: currentQuery }, undefined, { shallow: true });
    };

    // Load color metadata once, then resolve initialColor from query param
    useEffect(() => {
        (async () => {
            try {
                const colors = await getAllColors();
                const map: Record<string, { nameFr: string; hex: string }> = {};
                colors.forEach((c) => {
                    map[c.id] = { nameFr: c.nameFr, hex: c.hex };
                });
                setAllColors(map);

                // Resolve initialColor query param to a color ID
                if (initialColor && !initialColorResolved) {
                    const normalizedQuery = initialColor.toLowerCase().trim();
                    // Try matching by color name (case-insensitive)
                    const matchByName = colors.find(
                        (c) => c.nameFr.toLowerCase().trim() === normalizedQuery
                    );
                    if (matchByName) {
                        setSelectedColorId(matchByName.id);
                        // Also select matching variant
                        const matchingVariant = product.variants?.find(
                            (v) => v.color === matchByName.id && (!initialSize || v.size === initialSize)
                        ) ?? product.variants?.find((v) => v.color === matchByName.id);
                        if (matchingVariant) setSelectedVariant(matchingVariant);
                    } else {
                        // Try matching by UUID directly
                        const matchById = colors.find((c) => c.id === initialColor);
                        if (matchById) {
                            setSelectedColorId(matchById.id);
                            const matchingVariant = product.variants?.find(
                                (v) => v.color === matchById.id && (!initialSize || v.size === initialSize)
                            ) ?? product.variants?.find((v) => v.color === matchById.id);
                            if (matchingVariant) setSelectedVariant(matchingVariant);
                        } else {
                            // ✅ AJOUTÉ: Try matching as a color name string
                            setSelectedColorId(initialColor);
                            const matchingVariant = product.variants?.find(
                                (v) => v.color?.toLowerCase() === initialColor.toLowerCase()
                            );
                            if (matchingVariant) setSelectedVariant(matchingVariant);
                        }
                    }
                    setInitialColorResolved(true);
                }

                // Resolve initialSize if provided (select matching variant)
                if (initialSize && !initialColor) {
                    const matchingVariant = product.variants?.find((v) => v.size === initialSize);
                    if (matchingVariant) {
                        setSelectedVariant(matchingVariant);
                        if (matchingVariant.color) setSelectedColorId(matchingVariant.color);
                    }
                }
            } catch (e) {
                // fail silently; UI will just use neutral placeholders
            }
        })();
    }, []);

    useEffect(() => {
        if (!product.items?.length) return;
        const qtyDefaults: Record<string, number> = {};
        const sizeDefaults: Record<string, string> = {};
        for (const item of product.items) {
            qtyDefaults[item.id] = 1;
            sizeDefaults[item.id] = item.sizes?.[0] ?? "";
        }
        setItemQuantities(qtyDefaults);
        setItemSelectedSizes(sizeDefaults);
    }, [product.items]);

    // Fetch all products with the same code to display all available colors
    useEffect(() => {
        if (!product.code) return;
        (async () => {
            try {
                const response = await api.get<ProductWithVariants[]>(
                    `/products/by-code/${product.code}`,
                    { params: { _t: Date.now() } }
                );
                setRelatedProducts(response.data ?? []);
            } catch (err) {
                // Fail silently; if we can't fetch related products, just use current product
                setRelatedProducts([product]);
            }
        })();
    }, [product.code]);

    useEffect(() => {
        if (!isMainImageZoomOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsMainImageZoomOpen(false);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isMainImageZoomOpen]);

    const stopPropagation = (e: React.MouseEvent | React.ChangeEvent<HTMLSelectElement>) => {
        e.stopPropagation();
    };

    // ✅ CORRECTION: Handle color selection (now colorId can be a string like "ROSE CLAIR")
    const handleColorSelect = (colorId: string, colorName: string) => {
        // Find which product has this color
        const targetProduct = (relatedProducts.length > 0 ? relatedProducts : [product]).find((p) => {
            // Check if color is in product colors
            if (p.colors && p.colors.includes(colorId)) return true;
            // Check if color is in variant colors (now string comparison)
            if (p.variants?.some((v) => v.color === colorId || v.color?.toLowerCase() === colorId.toLowerCase())) return true;
            return false;
        });

        if (targetProduct && targetProduct.slug !== product.slug) {
            // Navigate to the product variant that has this color
            const targetVariant = targetProduct.variants?.find((v) => v.color === colorId || v.color?.toLowerCase() === colorId.toLowerCase());
            const categorySlugParam = categorySlug ? `/${categorySlug}` : "";
            const newPath = `/products${categorySlugParam}/${targetProduct.slug}?color=${colorName}`;
            router.push(newPath);
        } else {
            // Same product, just update color selection
            setSelectedColorId(colorId);
            
            // ✅ AJOUTÉ: Also update selectedVariant to match the new color
            const matchingVariant = product.variants?.find((v) => 
                v.color === colorId || v.color?.toLowerCase() === colorId.toLowerCase()
            );
            if (matchingVariant) {
                setSelectedVariant(matchingVariant);
            }
            
            updateQueryParams({ color: colorName });
        }
    };

    const hasSizeSelector = visibleSizes.length > 0;
    const requiresMaterialSelection = materials.length > 0;
    const canDisplayMainPrice =
        (!hasSizeSelector && !requiresMaterialSelection) ||
        (effectiveSelectedSize && (!requiresMaterialSelection || Boolean(selectedMaterial)));

    return (
        <div style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "40px 20px",
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            background: "#fff",
        }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">

                {/* ── Left: Main image ── */}
                <div>
                    <div
                        style={{
                            background: "#f7f5f2",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: 420,
                            maxHeight: "calc(100vh - 180px)",
                            overflow: "hidden",
                            cursor: "crosshair",
                            position: "relative",
                        }}
                        onClick={() => setIsMainImageZoomOpen(true)}
                        onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                            setHoverZoomData({ x, y, width: rect.width, height: rect.height });
                        }}
                        onMouseLeave={() => setHoverZoomData(null)}
                    >
                        <img
                            src={mainImage}
                            alt={product.name}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                display: "block",
                                opacity: imageTransitioning ? 0 : 1,
                                transition: "opacity 0.3s ease-in-out",
                            }}
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
                                        backgroundImage: `url(${mainImage})`,
                                        backgroundSize: `${hoverZoomData.width * 2.5}px ${hoverZoomData.height * 2.5}px`,
                                        backgroundPosition: `${hoverZoomData.x}% ${hoverZoomData.y}%`,
                                        backgroundRepeat: "no-repeat",
                                    }}
                                />
                            </div>
                        )}

                        {/* Left Arrow Button */}
                        {displayImages.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setImageTransitioning(true);
                                    setTimeout(() => {
                                        const newIndex = currentImageIndex === 0 ? displayImages.length - 1 : currentImageIndex - 1;
                                        setCurrentImageIndex(newIndex);
                                        setMainImage(resolveImg(displayImages[newIndex]));
                                        setTimeout(() => setImageTransitioning(false), 50);
                                    }, 300);
                                }}
                                style={{
                                    position: "absolute",
                                    left: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "rgba(255, 255, 255, 0.9)",
                                    border: "1px solid #ddd",
                                    borderRadius: "50%",
                                    width: 40,
                                    height: 40,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    fontSize: 20,
                                    color: "#1a1a1a",
                                    zIndex: 10,
                                    transition: "all 0.2s",
                                }}
                                onMouseMove={(e) => e.stopPropagation()}
                                onMouseEnter={(e) => {
                                    e.stopPropagation();
                                    setHoverZoomData(null);
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 1)";
                                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
                                }}
                                onMouseLeave={(e) => {
                                    e.stopPropagation();
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                ‹
                            </button>
                        )}

                        {/* Right Arrow Button */}
                        {displayImages.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setImageTransitioning(true);
                                    setTimeout(() => {
                                        const newIndex = (currentImageIndex + 1) % displayImages.length;
                                        setCurrentImageIndex(newIndex);
                                        setMainImage(resolveImg(displayImages[newIndex]));
                                        setTimeout(() => setImageTransitioning(false), 50);
                                    }, 300);
                                }}
                                style={{
                                    position: "absolute",
                                    right: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "rgba(255, 255, 255, 0.9)",
                                    border: "1px solid #ddd",
                                    borderRadius: "50%",
                                    width: 40,
                                    height: 40,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    fontSize: 20,
                                    color: "#1a1a1a",
                                    zIndex: 10,
                                    transition: "all 0.2s",
                                }}
                                onMouseMove={(e) => e.stopPropagation()}
                                onMouseEnter={(e) => {
                                    e.stopPropagation();
                                    setHoverZoomData(null);
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 1)";
                                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
                                }}
                                onMouseLeave={(e) => {
                                    e.stopPropagation();
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                ›
                            </button>
                        )}
                    </div>
                    <p style={{ margin: "8px 0 0", fontSize: 11, color: "#888", textAlign: "center" }}>
                        Cliquer sur l'image pour zoomer
                    </p>
                    {/* Thumbnail dots if multiple images */}
                    {displayImages.length > 1 && (
                        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
                            {displayImages.map((img, i) => {
                                const url = resolveImg(img);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setCurrentImageIndex(i);
                                            setMainImage(url);
                                        }}
                                        style={{
                                            width: 8, height: 8, borderRadius: "50%",
                                            background: mainImage === url ? "#1a1a1a" : "#ccc",
                                            border: "none", cursor: "pointer", padding: 0,
                                            transition: "background 0.2s",
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Right: Info ── */}
                <div style={{ display: "flex", flexDirection: "column", paddingTop: 8 }}>

                    {/* Brand + Product code (primary) + name (secondary) */}
                    <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 14, color: "#555", margin: "0 0 6px 0" }}>
                            {product.brand ?? "KORT INTERIORS"}
                        </p>
                        {/* Code as primary identifier */}
                        <h1 style={{
                            fontSize: 28,
                            fontWeight: 400,
                            color: "#1a1a1a",
                            margin: 0,
                            fontFamily: "Georgia, 'Times New Roman', serif",
                            letterSpacing: "0.01em",
                            lineHeight: 1.2,
                        }}>
                            {product.code}
                        </h1>
                        {/* Name as secondary (optional) */}
                        {product.name && (
                            <p style={{ fontSize: 13, color: "#666", margin: "8px 0 0", fontStyle: "italic" }}>
                                {product.name}
                            </p>
                        )}
                    </div>

                    {/* Price */}
                    {canDisplayMainPrice ? (
                        <div style={{ marginBottom: 24 }}>
                            {(displayDiscount > 0 || product.promotion) && (
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 14, color: "#888", textDecoration: "line-through" }}>
                                            {displayPrice.toFixed(2)}DT
                                        </span>
                                        {product.promotion && (
                                            <span style={{
                                                display: "inline-block",
                                                background: "#c0392b",
                                                color: "#fff",
                                                fontSize: 11,
                                                fontWeight: 700,
                                                padding: "4px 10px",
                                                borderRadius: "3px",
                                                letterSpacing: "0.5px",
                                            }}>
                                                {product.promotion.discountType === "percentage"
                                                    ? `-${Number(product.promotion.discountValue).toFixed(2)}%`
                                                    : `-${Number(product.promotion.discountValue).toFixed(2)}DT`}
                                            </span>
                                        )}
                                    </div>
                                    {savingsAmount > 0 && (
                                        <p style={{ fontSize: 12, color: "#c0392b", margin: "6px 0 0" }}>
                                            Économisez {savingsAmount.toFixed(2)}DT
                                        </p>
                                    )}
                                </div>
                            )}
                            <span style={{ fontSize: 28, fontWeight: 400, color: (displayDiscount > 0 || product.promotion) ? "#c0392b" : "#1a1a1a" }}>
                                {finalPrice.toFixed(2)}DT
                            </span>
                        </div>
                    ) : (
                        <p style={{ fontSize: 14, color: "#999", margin: "0 0 24px" }}>
                            {!effectiveSelectedSize && hasSizeSelector
                                ? "Sélectionnez une taille pour voir le prix"
                                : "Sélectionnez un matériau pour voir le prix"}
                        </p>
                    )}

                    {hasItems && (
                        <div style={{ marginBottom: 24 }}>
                            <p style={{ fontSize: 13, color: "#555", marginBottom: 16, fontWeight: 600, letterSpacing: 0.5 }}>Composition</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                {product.items!.map((item) => {
                                    const pieceQty = itemQuantities[item.id] ?? 1;
                                    const pieceSize = itemSelectedSizes[item.id] ?? "";
                                    const sizePricing = pieceSize ? item.sizePricing?.[pieceSize] : undefined;
                                    const itemBasePrice =
                                        sizePricing?.price != null
                                            ? Number(sizePricing.price)
                                            : item.price != null
                                                ? Number(item.price)
                                                : undefined;
                                    const itemDiscount =
                                        sizePricing?.discount != null
                                            ? Number(sizePricing.discount)
                                            : item.discount != null
                                                ? Number(item.discount)
                                                : 0;
                                    const itemMaterialPrice =
                                        itemSelectedSizes[`${item.id}__material`] && item.sizeMaterialPricing?.[pieceSize]
                                            ? item.sizeMaterialPricing[pieceSize][itemSelectedSizes[`${item.id}__material`]]
                                            : null;
                                    const itemFinalPrice = itemMaterialPrice != null ? itemMaterialPrice : (itemBasePrice != null ? Math.max(0, itemBasePrice - itemDiscount) : undefined);

                                    // Colors for this piece
                                    const pieceColorIds: string[] = item.colors ?? [];
                                    const pieceSelectedColorId = itemSelectedSizes[`${item.id}__color`] ?? pieceColorIds[0] ?? "";
                                    const pieceColorMeta = pieceSelectedColorId ? colorMap[pieceSelectedColorId] : undefined;
                                    const pieceColorName = pieceColorMeta?.nameFr ?? "";

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                setSelectedItem(item);
                                            }}
                                            style={{
                                                border: "1px solid #e8e8e8",
                                                padding: "20px",
                                                background: "#fff",
                                                cursor: "pointer",
                                                transition: "border-color 0.2s",
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#1a1a1a")}
                                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e8e8e8")}
                                        >
                                            {/* Header: image + name + price */}
                                            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                                                <div style={{ width: 64, height: 64, flexShrink: 0, border: "1px solid #f0f0f0", overflow: "hidden" }}>
                                                    <img
                                                        src={resolveImg(item.images?.[0])}
                                                        alt={item.name}
                                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a", margin: "0 0 2px" }}>
                                                        {item.name}
                                                    </p>
                                                    {item.description && (
                                                        <p style={{ fontSize: 12, color: "#888", margin: 0 }}>{item.description}</p>
                                                    )}
                                                </div>
                                                {itemFinalPrice != null && (
                                                    <span style={{ fontSize: 16, fontWeight: 500, color: "#1a1a1a", whiteSpace: "nowrap" }}>
                                                        dès {itemFinalPrice.toFixed(2)}DT
                                                    </span>
                                                )}
                                            </div>

                                            {/* Color selector */}
                                            {pieceColorIds.length > 0 && (
                                                <div style={{ marginBottom: 14 }}>
                                                    <p style={{ fontSize: 13, color: "#333", margin: "0 0 10px 0" }}>
                                                        Couleur : <strong>{pieceColorName || "—"}</strong>
                                                    </p>
                                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                        {pieceColorIds.map((colorId) => {
                                                            const meta = colorMap[colorId];
                                                            const isSelected = pieceSelectedColorId === colorId;
                                                            return (
                                                                <button
                                                                    key={colorId}
                                                                    title={meta?.nameFr ?? colorId}
                                                                    onClick={(e) => {
                                                                        stopPropagation(e);
                                                                        setItemSelectedSizes((prev) => ({
                                                                            ...prev,
                                                                            [`${item.id}__color`]: colorId,
                                                                        }));
                                                                    }}
                                                                    style={{
                                                                        width: 30,
                                                                        height: 30,
                                                                        borderRadius: "50%",
                                                                        backgroundColor: meta?.hex ?? "#d1d5db",
                                                                        border: isSelected ? "2px solid #1a1a1a" : "2px solid #fff",
                                                                        cursor: "pointer",
                                                                        padding: 0,
                                                                        boxShadow: "0 0 0 1px #e0e0e0",
                                                                        transition: "border-color 0.15s",
                                                                    }}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Material selector */}
                                            {pieceSize && item.sizeMaterialPricing?.[pieceSize] && Object.keys(item.sizeMaterialPricing[pieceSize]).length > 0 && (
                                                <div style={{ marginBottom: 14 }}>
                                                    <p style={{ fontSize: 13, color: "#333", margin: "0 0 10px 0" }}>
                                                        Matériau : <strong>{itemSelectedSizes[`${item.id}__material`] || "—"}</strong>
                                                    </p>
                                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                        {Object.keys(item.sizeMaterialPricing[pieceSize]).map((material) => {
                                                            const isSelected = itemSelectedSizes[`${item.id}__material`] === material;
                                                            return (
                                                                <button
                                                                    key={material}
                                                                    onClick={(e) => {
                                                                        stopPropagation(e);
                                                                        setItemSelectedSizes((prev) => ({
                                                                            ...prev,
                                                                            [`${item.id}__material`]: material,
                                                                        }));
                                                                    }}
                                                                    style={{
                                                                        padding: "6px 12px",
                                                                        borderRadius: "4px",
                                                                        border: isSelected ? "2px solid #1a1a1a" : "1px solid #d5d0ca",
                                                                        background: isSelected ? "#1a1a1a" : "#fff",
                                                                        color: isSelected ? "#fff" : "#1a1a1a",
                                                                        cursor: "pointer",
                                                                        fontSize: 12,
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
                                                <div style={{ marginBottom: 14, position: "relative" }}>
                                                    <select
                                                        value={pieceSize}
                                                        onClick={stopPropagation}
                                                        onChange={(e) => {
                                                            stopPropagation(e);
                                                            setItemSelectedSizes((prev) => ({
                                                                ...prev,
                                                                [item.id]: e.target.value,
                                                            }));
                                                        }}
                                                        style={{
                                                            width: "100%",
                                                            appearance: "none",
                                                            WebkitAppearance: "none",
                                                            border: "1px solid #bbb",
                                                            borderRadius: 0,
                                                            padding: "12px 40px 12px 14px",
                                                            fontSize: 13,
                                                            color: pieceSize ? "#1a1a1a" : "#888",
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
                                                        position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                                                        pointerEvents: "none", fontSize: 11, color: "#555",
                                                    }}>▼</span>
                                                </div>
                                            )}

                                            {/* Quantity + Add to cart */}
                                            <div style={{ display: "flex", gap: 0 }}>
                                                <div style={{ position: "relative", flexShrink: 0 }}>
                                                    <select
                                                        value={pieceQty}
                                                        onClick={stopPropagation}
                                                        onChange={(e) => {
                                                            stopPropagation(e);
                                                            setItemQuantities((prev) => ({
                                                                ...prev,
                                                                [item.id]: parseInt(e.target.value),
                                                            }));
                                                        }}
                                                        style={{
                                                            appearance: "none",
                                                            WebkitAppearance: "none",
                                                            border: "1px solid #bbb",
                                                            borderRight: "none",
                                                            borderRadius: 0,
                                                            padding: "12px 32px 12px 14px",
                                                            fontSize: 13,
                                                            color: "#1a1a1a",
                                                            background: "#fff",
                                                            cursor: "pointer",
                                                            width: 72,
                                                        }}
                                                    >
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                                            <option key={n} value={n}>{n}</option>
                                                        ))}
                                                    </select>
                                                    <span style={{
                                                        position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                                                        pointerEvents: "none", fontSize: 10, color: "#555",
                                                    }}>▼</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    disabled={isAdding}
                                                    onClick={async (e) => {
                                                        stopPropagation(e);
                                                        try {
                                                            await addToCart(
                                                                product.id,
                                                                pieceQty,
                                                                pieceSize || undefined,
                                                                undefined,
                                                                item.id,
                                                                itemSelectedSizes[`${item.id}__material`] || undefined
                                                            );
                                                            setToastMessage('✓ Produit ajouté au panier!');
                                                            setShowToast(true);
                                                            setTimeout(() => setShowToast(false), 3000);
                                                        } catch (err: any) {
                                                            if (err?.message === "AUTH_REQUIRED" || err?.code === "AUTH_REQUIRED" || err?.response?.status === 401) {
                                                                setShowAuthModal(true);
                                                            } else {
                                                                setToastMessage('✕ Erreur lors de l\'ajout au panier');
                                                                setShowToast(true);
                                                                setTimeout(() => setShowToast(false), 3000);
                                                            }
                                                        }
                                                    }}
                                                    style={{
                                                        flex: 1,
                                                        padding: "12px 16px",
                                                        background: isAdding ? "#555" : "#1a1a1a",
                                                        color: "#fff",
                                                        border: "none",
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        letterSpacing: 1.5,
                                                        cursor: isAdding ? "not-allowed" : "pointer",
                                                        transition: "background 0.2s",
                                                    }}
                                                >
                                                    AJOUTER AU PANIER
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Colors */}
                    {colorOptions.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: 14, color: "#333", margin: "0 0 12px 0" }}>
                                Couleur : <strong>{selectedColorName || "—"}</strong>
                            </p>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                {colorOptions.map((colorOption) => {
                                    const isSelected = selectedColorId === colorOption.key;
                                    return (
                                        <button
                                            key={colorOption.key}
                                            aria-label={colorOption.label || "Couleur"}
                                            title={colorOption.label || colorOption.hex}
                                            onClick={() => {
                                                handleColorSelect(colorOption.key, colorOption.label);
                                            }}
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
                    {materials.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: 14, color: "#333", margin: "0 0 12px 0" }}>
                                Matériau : <strong>{selectedMaterial || "—"}</strong>
                            </p>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                {materials.map((material) => {
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
                    {visibleSizes.length > 0 && (
                        <div style={{ marginBottom: 12, position: "relative" }}>
                            <select
                                value={selectedSize}
                                onChange={(e) => {
                                    const size = e.target.value;
                                    setSelectedSize(size);
                                    updateQueryParams({ size });
                                    const v = product.variants?.find((v) => v.size === size && (v.colorData?.hex ?? v.color) === (selectedVariant?.colorData?.hex ?? selectedVariant?.color))
                                        ?? product.variants?.find((v) => v.size === size);
                                    if (v) setSelectedVariant(v);
                                }}
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
                                {visibleSizes.map((size) => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                            <span style={{
                                position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                                pointerEvents: "none", fontSize: 12, color: "#555",
                            }}>▼</span>
                        </div>
                    )}

                    {/* Quantity + Add to cart (hidden for products with compositions) */}
                    {!hasItems && (
                        <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
                            {/* Quantity dropdown */}
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
                                        height: "100%",
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

                            {/* Add to cart button */}
                            <button
                                onClick={async () => {
                                    if (visibleSizes.length > 0 && !effectiveSelectedSize) {
                                        setToastMessage('✕ Veuillez sélectionner une taille');
                                        setShowToast(true);
                                        setTimeout(() => setShowToast(false), 3000);
                                        return;
                                    }
                                    try {
                                        await addToCart(
                                            product.id,
                                            quantity,
                                            selectedVariant?.size || effectiveSelectedSize,
                                            selectedColorId || selectedVariant?.color,
                                            undefined,
                                            selectedMaterial
                                        );
                                        setToastMessage('✓ Produit ajouté au panier!');
                                        setShowToast(true);
                                        setTimeout(() => setShowToast(false), 3000);
                                    } catch (err: any) {
                                        if (err?.message === "AUTH_REQUIRED" || err?.code === "AUTH_REQUIRED" || err?.response?.status === 401) {
                                            setShowAuthModal(true);
                                        } else {
                                            setToastMessage('✕ Erreur lors de l\'ajout au panier');
                                            setShowToast(true);
                                            setTimeout(() => setShowToast(false), 3000);
                                        }
                                    }
                                }}
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
                    )}

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

                    {/* Divider */}
                    <div style={{ borderTop: "1px solid #e8e8e8" }} />

                    {/* Description collapsible */}
                    <div>
                        <div
                            onClick={() => setDescriptionOpen(!descriptionOpen)}
                            style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                padding: "16px 0", cursor: "pointer",
                            }}
                        >
                            <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>Description</span>
                            <span style={{ fontSize: 20, color: "#1a1a1a", lineHeight: 1, fontWeight: 300 }}>
                                {descriptionOpen ? "×" : "+"}
                            </span>
                        </div>
                        {descriptionOpen && product.description && (
                            <div style={{ fontSize: 14, color: "#333", lineHeight: 1.8, paddingBottom: 16 }}>
                                {product.description}
                            </div>
                        )}
                    </div>

                    {/* Details table */}
                    {product.isDetailsEnabled && product.details && product.details.length > 0 && (
                        <>
                            <div style={{ borderTop: "1px solid #e8e8e8" }} />
                            <div>
                                <div
                                    onClick={() => setDetailsOpen(!detailsOpen)}
                                    style={{
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        padding: "16px 0", cursor: "pointer",
                                    }}
                                >
                                    <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>Détails</span>
                                    <span style={{ fontSize: 20, color: "#1a1a1a", lineHeight: 1, fontWeight: 300 }}>
                                        {detailsOpen ? "×" : "+"}
                                    </span>
                                </div>
                                {detailsOpen && (
                                    <div style={{ paddingBottom: 16 }}>
                                        <table style={{
                                            width: "100%",
                                            borderCollapse: "collapse",
                                            fontSize: 14,
                                            color: "#333",
                                            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                                        }}>
                                            <tbody>
                                                {product.details.map((detail, idx) => (
                                                    <tr
                                                        key={idx}
                                                        style={{
                                                            borderBottom: idx < product.details!.length - 1 ? "1px solid #f0f0f0" : "none",
                                                        }}
                                                    >
                                                        <td style={{
                                                            padding: "10px 12px 10px 0",
                                                            fontWeight: 600,
                                                            color: "#555",
                                                            whiteSpace: "nowrap",
                                                            verticalAlign: "top",
                                                            width: "40%",
                                                        }}>
                                                            {detail.key}
                                                        </td>
                                                        <td style={{
                                                            padding: "10px 0",
                                                            color: "#1a1a1a",
                                                            lineHeight: 1.6,
                                                        }}>
                                                            {detail.value}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

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

            {/* Main image zoom modal */}
            {isMainImageZoomOpen && (
                <div
                    onClick={() => setIsMainImageZoomOpen(false)}
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
                        onClick={() => setIsMainImageZoomOpen(false)}
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
                        src={mainImage}
                        alt={product.name}
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

            {/* Composition details modal */}
            {selectedItem && (
                <div
                    onClick={() => setSelectedItem(null)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.45)",
                        zIndex: 1200,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        backdropFilter: "blur(2px)",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: 860,
                            maxHeight: "90vh",
                            overflowY: "auto",
                            background: "#fff",
                            boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
                            display: "flex",
                            flexDirection: "column",
                            position: "relative",
                        }}
                    >
                        {/* Close button – top-right */}
                        <button
                            onClick={() => setSelectedItem(null)}
                            style={{
                                position: "absolute",
                                top: 16,
                                right: 20,
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: 22,
                                lineHeight: 1,
                                color: "#1a1a1a",
                                zIndex: 10,
                                padding: 4,
                            }}
                            aria-label="Fermer"
                        >
                            ×
                        </button>

                        {/* Two-column body */}
                        <div style={{ display: "grid", gridTemplateColumns: "420px 1fr" }}>

                            {/* Left: large image */}
                            <div
                                style={{ overflow: "hidden", background: "#f7f5f2", position: "relative", cursor: "crosshair" }}
                                onMouseMove={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                                    setSubHoverZoomData({ x, y, width: rect.width, height: rect.height });
                                }}
                                onMouseLeave={() => setSubHoverZoomData(null)}
                            >
                                <img
                                    src={resolveImg(selectedItem.images?.[0])}
                                    alt={selectedItem.name}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        minHeight: 420,
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />

                                {/* Hover Zoom Lens for Sub Product */}
                                {subHoverZoomData && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: `${subHoverZoomData.x}%`,
                                            top: `${subHoverZoomData.y}%`,
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
                                                backgroundImage: `url(${resolveImg(selectedItem.images?.[0])})`,
                                                backgroundSize: `${subHoverZoomData.width * 2.5}px ${subHoverZoomData.height * 2.5}px`,
                                                backgroundPosition: `${subHoverZoomData.x}% ${subHoverZoomData.y}%`,
                                                backgroundRepeat: "no-repeat",
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Right: details */}
                            <div style={{ padding: "40px 36px 36px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 0 }}>

                                {/* Brand */}
                                {product.brand && (
                                    <p style={{
                                        margin: "0 0 6px",
                                        fontSize: 13,
                                        color: "#888",
                                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                                        letterSpacing: "0.04em",
                                    }}>
                                        {product.brand}
                                    </p>
                                )}

                                {/* Product name */}
                                <h2 style={{
                                    margin: "0 0 20px",
                                    fontSize: 26,
                                    fontWeight: 400,
                                    color: "#1a1a1a",
                                    fontFamily: "Georgia, 'Times New Roman', serif",
                                    lineHeight: 1.25,
                                    letterSpacing: "0.01em",
                                }}>
                                    {selectedItem.name}
                                </h2>

                                {/* Main description */}
                                {selectedItem.description && (
                                    <p style={{
                                        margin: "0 0 20px",
                                        fontSize: 14,
                                        color: "#333",
                                        lineHeight: 1.8,
                                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                                        maxHeight: 220,
                                        overflowY: "auto",
                                        paddingRight: 8,
                                    }}>
                                        {selectedItem.description}
                                    </p>
                                )}

                                {/* Specs bullet list */}
                                {(selectedItem.sizes?.length || selectedItem.colors?.length) && (
                                    <ul style={{
                                        margin: "0 0 24px",
                                        padding: "0 0 0 18px",
                                        fontSize: 14,
                                        color: "#333",
                                        lineHeight: 1.9,
                                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                                    }}>
                                        {selectedItem.sizes?.length ? (
                                            <li>
                                                <strong>Tailles disponibles :</strong>{" "}
                                                {selectedItem.sizes.join(", ")}
                                            </li>
                                        ) : null}
                                        {selectedItem.colors?.length ? (
                                            <li>
                                                <strong>Coloris :</strong>{" "}
                                                {selectedItem.colors
                                                    .map((colorId) => colorMap[colorId]?.nameFr ?? colorId)
                                                    .join(", ")}
                                            </li>
                                        ) : null}
                                        {selectedItem.price != null ? (
                                            <li>
                                                <strong>Prix :</strong>{" "}
                                                {Number(selectedItem.price).toFixed(2)} DT
                                            </li>
                                        ) : null}
                                    </ul>
                                )}

                                {/* Price callout */}
                                {selectedItem.price != null && (
                                    <div style={{
                                        marginTop: "auto",
                                        paddingTop: 16,
                                        borderTop: "1px solid #ececec",
                                        display: "flex",
                                        alignItems: "baseline",
                                        gap: 6,
                                    }}>
                                        <span style={{
                                            fontSize: 13,
                                            color: "#888",
                                            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                                        }}>
                                            dès
                                        </span>
                                        <span style={{
                                            fontSize: 28,
                                            fontWeight: 400,
                                            color: "#1a1a1a",
                                            fontFamily: "Georgia, 'Times New Roman', serif",
                                        }}>
                                            {Number(selectedItem.price).toFixed(2)} DT
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
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
        </div>
    );
};