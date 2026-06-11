export interface ProductItem {
  id: string;
  productId: string;
  name: string;
  code?: string;
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

export interface ProductVariant {
  id: string;
  productId: string;
  name?: string;
  description?: string;
  code?: string;
  price?: number;
  discount?: number;
  size?: string;
  color?: string;
  colorData?: { id: string; hex: string; nameFr: string; };
  style?: string;
  styleData?: { id: string; nameFr: string; };
  sizePricing?: Record<string, { price?: number; discount?: number }>;
  sizeMaterialPricing?: Record<string, Record<string, number>>;
  sizes?: string[];
  sku?: string;
  images?: string[];
  sortOrder?: number;
}

export interface Product {
  id: string;
  name?: string;
  code: string;
  description?: string;
  productType: number;
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
  manualVariants?: boolean;
  variants?: ProductVariant[];
  items?: ProductItem[];
}

export interface Category {
  id: string;
  name: string;
  productCount?: number;
  children?: Category[];
}

export interface VariantDraft {
  id?: string;
  name?: string;
  description?: string;
  code?: string;
  price?: string;
  discount?: string;
  size?: string;
  color?: string;
  style?: string;
  sizePricing?: Record<string, Record<string, string>>;
  sizeMaterialPricing?: Record<string, Record<string, string>>;
  sizes: string[];
  sku?: string;
  images: string[];
  sortOrder: number;
}

export interface CreateProductPayload {
  name?: string;
  code: string;
  description?: string;
  sizes?: string[];
  colors?: string[];
  prices?: number[];
  discounts?: number[];
  sizePricing?: Record<string, { price?: number; discount?: number }>;
  sizeMaterialPricing?: Record<string, Record<string, number>>;
  images?: string[];
  variantImages?: Record<string, string[]>;
  categoryId?: string;
  details?: { key: string; value: string }[];
  isDetailsEnabled?: boolean;
  styles?: string[];
  manualVariants?: boolean;
  variants?: {
    id?: string;
    name?: string;
    description?: string;
    code?: string;
    price?: number;
    discount?: number;
    size?: string;
    color?: string;
    style?: string;
    sizePricing?: Record<string, { price?: number; discount?: number }>;
    sizeMaterialPricing?: Record<string, Record<string, number>>;
    sizes?: string[];
    sku?: string;
    images?: string[];
  }[];
  items?: {
    id?: string;  // present when updating existing item
    name: string;
    code?: string;
    description?: string;
    price?: number;
    discount?: number;
    sizePricing?: Record<string, { price?: number; discount?: number }>;
    sizeMaterialPricing?: Record<string, Record<string, number>>;
    sizes?: string[];
    colors?: string[];
    images?: string[];
  }[];
}
