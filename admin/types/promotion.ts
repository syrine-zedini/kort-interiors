export type PromotionDiscountType = "percentage" | "fixed";

export interface Promotion {
  id: string;
  name: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  productId?: string | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
  product?: { id: string; name: string; slug?: string; images?: string[]; categoryId?: string };
  category?: { id: string; name: string; slug?: string };
  subCategory?: { id: string; name: string; slug?: string };
  createdAt: string;
  updatedAt: string;
}

export interface PromotionFilterCategory {
  id: string;
  name: string;
  slug?: string;
  children: Array<{ id: string; name: string; slug?: string }>;
}

export interface PromotionFiltersOptions {
  products: Array<{
    id: string;
    name: string;
    slug?: string;
    images?: string[];
    categoryId?: string;
  }>;
  categories: PromotionFilterCategory[];
}

export interface CreatePromotionPayload {
  name: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  productId?: string | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
}
