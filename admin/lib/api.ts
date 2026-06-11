import api from "./axios";
import { CreateProductPayload, Product, Category, ProductItem } from "@/types/product";
import { Blog, CreateBlogPayload } from "@/types/blog";
import { Promotion, PromotionFiltersOptions, CreatePromotionPayload } from "@/types/promotion";
import { HeroSlide, CreateHeroSlidePayload } from "@/types/heroSlide";

const asArray = <T>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  return [];
};

// ─── Categories ───────────────────────────────────────────────────────────────

export interface CategoryNode {
  id: string;
  name: string;
  productCount: number;
  /** All parent IDs of this node. Empty array for top-level categories.
   *  Length > 1 means this node is shared across multiple parents. */
  parentIds: string[];
  /** Nested children (recursive). Empty array for leaf nodes. */
  children: CategoryNode[];
  banner?: string | null;
}

export const fetchCategories = async (): Promise<CategoryNode[]> => {
  const { data } = await api.get("/categories");
  return Array.isArray(data) ? data : (data.data ?? []);
};

export const createCategory = async (name: string, parentId?: string): Promise<CategoryNode> => {
  const { data } = await api.post("/categories", { name, parentId });
  return data;
};

export const renameCategory = async (id: string, name: string): Promise<CategoryNode> => {
  const { data } = await api.put(`/categories/${id}`, { name });
  return data;
};

export const updateCategoryBanner = async (id: string, banner: string | null): Promise<CategoryNode> => {
  const { data } = await api.put(`/categories/${id}`, { banner });
  return data;
};

export const deleteCategory = async (
  id: string,
  opts: { moveProductsTo?: string | null; deleteChildren?: boolean }
): Promise<void> => {
  await api.delete(`/categories/${id}`, { data: opts });
};

export const linkChildToParent = async (parentId: string, childId: string): Promise<void> => {
  await api.post(`/categories/${parentId}/children/${childId}`);
};

export const unlinkChildFromParent = async (parentId: string, childId: string): Promise<void> => {
  await api.delete(`/categories/${parentId}/children/${childId}`);
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await api.get("/products");
  return asArray<Product>(data);
};

export const fetchProduct = async (id: string): Promise<Product> => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};

export const createProduct = async (payload: CreateProductPayload): Promise<Product> => {
  const { data } = await api.post("/products", payload);
  return data;
};

export const updateProduct = async (id: string, payload: Partial<CreateProductPayload>): Promise<Product> => {
  const { data } = await api.put(`/products/${id}`, payload);
  return data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`);
};

// ─── Product Items ────────────────────────────────────────────────────────────
export const addProductItem = async (
  productId: string,
  item: { name: string; description?: string; price?: number; discount?: number; sizes?: string[]; images?: string[] }
): Promise<ProductItem> => {
  const { data } = await api.post(`/products/${productId}/items`, item);
  return data;
};

export const updateProductItem = async (
  productId: string,
  itemId: string,
  item: Partial<{ name: string; description?: string; price?: number; discount?: number; sizes?: string[]; images?: string[]; sortOrder: number }>
): Promise<ProductItem> => {
  const { data } = await api.put(`/products/${productId}/items/${itemId}`, item);
  return data;
};

export const deleteProductItem = async (productId: string, itemId: string): Promise<void> => {
  await api.delete(`/products/${productId}/items/${itemId}`);
};

// ─── Image Upload ─────────────────────────────────────────────────────────────
// ─── Colors ───────────────────────────────────────────────────────────────────

export interface Color {
  id: string;
  nameFr: string;
  hex: string;
}

export const fetchColors = async (): Promise<Color[]> => {
  const { data } = await api.get("/colors");
  return asArray<Color>(data);
};

export const createColor = async (nameFr: string, hex: string): Promise<Color> => {
  const { data } = await api.post("/colors", { nameFr, hex });
  return data;
};

export const deleteColor = async (id: string): Promise<void> => {
  await api.delete(`/colors/${id}`);
};

// ─── Styles ───────────────────────────────────────────────────────────────────

export interface Style {
  id: string;
  nameFr: string;
}

export const fetchStyles = async (): Promise<Style[]> => {
  const { data } = await api.get("/styles");
  return asArray<Style>(data);
};

export const createStyle = async (nameFr: string): Promise<Style> => {
  const { data } = await api.post("/styles", { nameFr });
  return data;
};

export const deleteStyle = async (id: string): Promise<void> => {
  await api.delete(`/styles/${id}`);
};

// ─── Image Upload ─────────────────────────────────────────────────────────────

export const uploadImages = async (files: File[]): Promise<string[]> => {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const { data } = await api.post("/files/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  // backend returns array of paths like ["/public/uuid.jpg"]
  return Array.isArray(data) ? data.map((d: any) => d.path ?? d) : [data.path ?? data];
};

// ─── Users (Admin) ────────────────────────────────────────────────────────────

export interface UserWithStats {
  id: string;
  username: string;
  email: string;
  phoneNumber?: string;
  createdAt: string;
  nombreCommandes: number;
  montantTotal: number;
}

export const fetchUsers = async (): Promise<UserWithStats[]> => {
  const { data } = await api.get("/users");
  return asArray<UserWithStats>(data);
};

// ─── Commandes (Admin) ────────────────────────────────────────────────────────

export type CommandeStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface CommandeItemType {
  id: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  selectedSize?: string;
  selectedColor?: string;
  product?: { id: string; name: string; images?: string[] };
}

export interface CommandeType {
  id: string;
  userId: string;
  status: CommandeStatus;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod?: string;
  trackingNumber?: string;
  shippingAddress?: any;
  createdAt: string;
  user?: { id: string; username: string; email: string };
  items?: CommandeItemType[];
}

export const fetchCommandes = async (): Promise<CommandeType[]> => {
  const { data } = await api.get("/commandes");
  return asArray<CommandeType>(data);
};

export const updateCommandeStatus = async (
  id: string,
  status: CommandeStatus
): Promise<CommandeType> => {
  const { data } = await api.patch(`/commandes/${id}/status`, { status });
  return data;
};

export const updateCommandeTracking = async (
  id: string,
  trackingNumber: string
): Promise<CommandeType> => {
  const { data } = await api.patch(`/commandes/${id}/tracking`, { trackingNumber });
  return data;
};

// ─── Blogs ────────────────────────────────────────────────────────────────────

export const fetchBlogs = async (): Promise<Blog[]> => {
  const { data } = await api.get("/blogs");
  return asArray<Blog>(data);
};

export const fetchBlog = async (id: string): Promise<Blog> => {
  const { data } = await api.get(`/blogs/${id}`);
  return data;
};

export const createBlog = async (payload: CreateBlogPayload): Promise<Blog> => {
  const { data } = await api.post("/blogs", payload);
  return data;
};

export const updateBlog = async (id: string, payload: Partial<CreateBlogPayload>): Promise<Blog> => {
  const { data } = await api.put(`/blogs/${id}`, payload);
  return data;
};

export const deleteBlog = async (id: string): Promise<void> => {
  await api.delete(`/blogs/${id}`);
};

// ─── Promotions ───────────────────────────────────────────────────────────────

export const fetchPromotionFilterOptions = async (search = ""): Promise<PromotionFiltersOptions> => {
  const { data } = await api.get("/promotions/options", { params: { search } });
  return data;
};

export const fetchPromotions = async (): Promise<Promotion[]> => {
  const { data } = await api.get("/promotions");
  return Array.isArray(data) ? data : [];
};

export const createPromotion = async (payload: CreatePromotionPayload): Promise<Promotion> => {
  const { data } = await api.post("/promotions", payload);
  return data;
};

export const deletePromotion = async (id: string): Promise<void> => {
  await api.delete(`/promotions/${id}`);
};

// ─── Hero Slides ───────────────────────────────────────────────────────────────

export const fetchHeroSlides = async (): Promise<HeroSlide[]> => {
  const { data } = await api.get("/hero-slides");
  return asArray<HeroSlide>(data);
};

export const fetchHeroSlide = async (id: string): Promise<HeroSlide> => {
  const { data } = await api.get(`/hero-slides/${id}`);
  return data;
};

export const createHeroSlide = async (payload: CreateHeroSlidePayload): Promise<HeroSlide> => {
  const { data } = await api.post("/hero-slides", payload);
  return data;
};

export const updateHeroSlide = async (id: string, payload: Partial<CreateHeroSlidePayload>): Promise<HeroSlide> => {
  const { data } = await api.put(`/hero-slides/${id}`, payload);
  return data;
};

export const deleteHeroSlide = async (id: string): Promise<void> => {
  await api.delete(`/hero-slides/${id}`);
};
