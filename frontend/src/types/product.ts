// types/product.ts

export enum ProductType {
    FIXED_FIXED_FIXED = 1,       // Prix fixe, remise fixe, taille/couleur fixe
    FIXED_FIXED_VARIABLE = 2,    // Prix fixe, remise fixe, taille/couleur variable
    VARIABLE_VARIABLE_VARIABLE = 3, // Prix variable, remise variable, taille/couleur variable
}

// Promotion type
export interface Promotion {
    id: string;
    name: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
}

// Pricing with promotion applied
export interface Pricing {
    basePrice: number;
    finalPrice: number;
    promotionId?: string;
    promotionName?: string;
    savingsAmount: number;
    savingsPercentage: number;
}

// Product Variant interface
export interface ProductVariant {
    id: string;
    productId: string;
    price?: number;
    discount?: number;
    size?: string;
    color?: string;
    colorData?: { id: string; hex: string; nameFr: string; };
    style?: string;
    styleData?: { id: string; nameFr: string; };
    stock?: number;
    sku?: string;
    images?: string[];
}

// Product Item — a piece within a product group (e.g. "Taie d'oreiller", "Housse de couette")
export interface ProductItem {
    id: string;
    productId: string;
    name: string;
    description?: string;
    price?: number;
    discount?: number;
    sizePricing?: Record<string, { price?: number; discount?: number }>;
    sizes?: string[];
    colors?: string[];
    sizeMaterialPricing?: Record<string, Record<string, number>>;
    images?: string[];
    sortOrder: number;
}

// Main Product interface
export interface Product {
    id: string;
    slug: string;
    name?: string;
    code: string;
    brand?: string;
    description?: string;
    productType: ProductType;
    price?: number;
    discount?: number;
    sizes?: string[];
    colors?: string[];
    sizeMaterialPricing?: Record<string, Record<string, number>>;
    images?: string[];
    categoryId?: string;
    details?: { key: string; value: string }[];
    isDetailsEnabled?: boolean;
    styles?: string[];
    sizePricing?: Record<string, { price?: number; discount?: number }>;
    variants?: ProductVariant[];
    items?: ProductItem[];
    promotion?: Promotion | null;
    pricing?: Pricing;
    sizeMaterialPricingWithPromotion?: Record<string, Record<string, {
        basePrice: number;
        finalPrice: number;
        savingsAmount: number;
        savingsPercentage: number;
    }>>;
}

// Product with variants (frontend-friendly type)
export type ProductWithVariants = Product & {
    variants: ProductVariant[];
    items: ProductItem[];
};