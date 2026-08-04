import { Op, WhereOptions } from "sequelize";
import { Promotion, Product, ProductCategory } from "../models";
import { PromotionDiscountType } from "../models/promotion.model";

export interface PriceWithPromotion {
  basePrice: number;
  finalPrice: number;
  promotionId?: string;
  promotionName?: string;
  savingsAmount: number;
  savingsPercentage: number;
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
  /** Restrict to specific sizes. Null or empty = applies to all sizes. */
  applicableSizes?: string[] | null;
}

export interface UpdatePromotionPayload extends Partial<CreatePromotionPayload> {}

function validatePromotionDates(startDate: Date, endDate: Date) {
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Dates de promotion invalides");
  }
  if (endDate < startDate) {
    throw new Error("La date de fin doit être après la date de début");
  }
}

function validateFilterSelection(payload: {
  productId?: string | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
}) {
  if (!payload.productId && !payload.categoryId && !payload.subCategoryId) {
    throw new Error("Sélectionnez au moins un filtre: produit, catégorie ou sous-catégorie");
  }
}

const includeRelations = [
  { model: Product, as: "product", attributes: ["id", "name", "slug", "images", "categoryId"] },
  { model: ProductCategory, as: "category", attributes: ["id", "name", "slug"] },
  { model: ProductCategory, as: "subCategory", attributes: ["id", "name", "slug"] },
];

export async function getPromotionFiltersOptions(search = "") {
  const productsWhere: WhereOptions = search
    ? {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { slug: { [Op.iLike]: `%${search}%` } },
        ],
      }
    : {};

  const [products, categories] = await Promise.all([
    Product.findAll({
      where: productsWhere,
      attributes: ["id", "name", "slug", "images", "categoryId", "sizes"],
      order: [["name", "ASC"]],
    }),
    ProductCategory.findAll({
      include: [
        {
          model: ProductCategory,
          as: "children",
          attributes: ["id", "name", "slug"],
          through: { attributes: [] },
          required: false,
        },
        {
          model: ProductCategory,
          as: "parents",
          attributes: ["id", "name", "slug"],
          through: { attributes: [] },
          required: false,
        },
      ],
      attributes: ["id", "name", "slug"],
      order: [["name", "ASC"]],
    }),
  ]);

  const topCategories = categories
    .filter((c) => !c.parents || c.parents.length === 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      children: (c.children ?? []).map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
      })),
    }));

  return {
    products,
    categories: topCategories,
  };
}

export async function getPromotions() {
  return Promotion.findAll({ include: includeRelations, order: [["createdAt", "DESC"]] });
}

export async function createPromotion(payload: CreatePromotionPayload) {
  validateFilterSelection(payload);

  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);
  endDate.setHours(23, 59, 59, 999);
  validatePromotionDates(startDate, endDate);

  if (payload.discountType === "percentage" && payload.discountValue > 100) {
    throw new Error("Le pourcentage de réduction ne peut pas dépasser 100");
  }

  const created = await Promotion.create({
    name: payload.name,
    discountType: payload.discountType,
    discountValue: payload.discountValue,
    startDate,
    endDate,
    isActive: payload.isActive ?? true,
    productId: payload.productId ?? null,
    categoryId: payload.categoryId ?? null,
    subCategoryId: payload.subCategoryId ?? null,
    applicableSizes:
      Array.isArray(payload.applicableSizes) && payload.applicableSizes.length > 0
        ? payload.applicableSizes
        : null,
  });

  const withRelations = await Promotion.findByPk(created.id, { include: includeRelations });
  return withRelations;
}

export async function updatePromotion(id: string, payload: UpdatePromotionPayload) {
  const promotion = await Promotion.findByPk(id);
  if (!promotion) throw new Error("Promotion non trouvée");

  const nextStart = payload.startDate ? new Date(payload.startDate) : promotion.startDate;
  const nextEnd = payload.endDate ? new Date(payload.endDate) : promotion.endDate;
  if (payload.endDate) {
    nextEnd.setHours(23, 59, 59, 999);
  }
  validatePromotionDates(nextStart, nextEnd);

  const nextType = payload.discountType ?? promotion.discountType;
  const nextValue = payload.discountValue ?? Number(promotion.discountValue);
  if (nextType === "percentage" && nextValue > 100) {
    throw new Error("Le pourcentage de réduction ne peut pas dépasser 100");
  }

  await promotion.update({
    ...payload,
    startDate: nextStart,
    endDate: nextEnd,
    applicableSizes:
      "applicableSizes" in payload
        ? Array.isArray(payload.applicableSizes) && payload.applicableSizes.length > 0
          ? payload.applicableSizes
          : null
        : promotion.applicableSizes,
  });

  return Promotion.findByPk(id, { include: includeRelations });
}

export async function deletePromotion(id: string) {
  const promotion = await Promotion.findByPk(id);
  if (!promotion) throw new Error("Promotion non trouvée");
  await promotion.destroy();
  return { message: "Promotion supprimée" };
}

/**
 * Check if a promotion is currently active (within date range and isActive flag)
 */
export function isPromotionActive(promotion: Promotion): boolean {
  if (!promotion.isActive) return false;
  const now = new Date();
  return now >= promotion.startDate && now <= promotion.endDate;
}

/**
 * Get the applicable promotion for a product.
 * @param product  The product to find a promotion for.
 * @param selectedSize  Optional size selected by the customer. Used to skip
 *                      promotions whose applicableSizes don't include it.
 */
export async function getApplicablePromotion(
  product: Product,
  selectedSize?: string | null
): Promise<Promotion | null> {
  const now = new Date();

  /** Returns true if the promo applies to the current selectedSize */
  const sizeMatches = (p: Promotion): boolean => {
    if (!p.applicableSizes || p.applicableSizes.length === 0) return true; // all sizes
    if (!selectedSize) return true; // no size filter requested → show promo
    return p.applicableSizes.includes(selectedSize);
  };

  // Check for product-specific promotion
  const productPromotions = await Promotion.findAll({
    where: {
      productId: product.id,
      isActive: true,
    },
    order: [["createdAt", "DESC"]],
  });

  const activePromotion = productPromotions.find(p => {
    const startDate = new Date(p.startDate);
    const endDate = new Date(p.endDate);
    return now >= startDate && now <= endDate && sizeMatches(p);
  });

  if (activePromotion) return activePromotion;

  // Check for category/subcategory promotion (no size restriction on category promos)
  if (product.categoryId) {
    const categoryPromotions = await Promotion.findAll({
      where: {
        categoryId: product.categoryId,
        isActive: true,
      },
      order: [["createdAt", "DESC"]],
    });

    const activeCategoryPromotion = categoryPromotions.find(p => {
      const startDate = new Date(p.startDate);
      const endDate = new Date(p.endDate);
      return now >= startDate && now <= endDate;
    });

    if (activeCategoryPromotion) return activeCategoryPromotion;
  }

  return null;
}

/**
 * Calculate the final price after applying a promotion
 */
export function calculateFinalPrice(
  basePrice: number,
  promotion: Promotion | null
): PriceWithPromotion {
  if (!promotion) {
    return {
      basePrice,
      finalPrice: basePrice,
      savingsAmount: 0,
      savingsPercentage: 0,
    };
  }

  let savingsAmount = 0;
  if (promotion.discountType === "percentage") {
    savingsAmount = (basePrice * Number(promotion.discountValue)) / 100;
  } else {
    savingsAmount = Number(promotion.discountValue);
  }

  const finalPrice = Math.max(0, basePrice - savingsAmount);

  return {
    basePrice,
    finalPrice,
    promotionId: promotion.id,
    promotionName: promotion.name,
    savingsAmount,
    savingsPercentage:
      basePrice > 0 ? (savingsAmount / basePrice) * 100 : 0,
  };
}
