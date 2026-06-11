import api from "@/libs/axios";

export interface Promotion {
  id: string;
  name: string;
  discountType: "percentage" | "fixed";
  discountValue: number | string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  productId?: string | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
  product?: {
    id: string;
    name: string;
    slug?: string;
    images?: string[];
    categoryId?: string;
  };
  category?: {
    id: string;
    name: string;
    slug?: string;
  };
  subCategory?: {
    id: string;
    name: string;
    slug?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const fetchPromotions = async (): Promise<Promotion[]> => {
  const { data } = await api.get("/promotions");
  return Array.isArray(data) ? data : [];
};
