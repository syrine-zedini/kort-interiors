import { Op } from "sequelize";
import { sequelize } from "../config/sequelize";
import { ProductVariant } from "../models/product_variant";
import { ProductItem } from "../models/product_item.model";
import { ProductType } from "../enums/productType";
import { v4 as uuidv4 } from "uuid";
import { Product, Color } from "../models";
import { ProductCategory } from "../models/product_categories.model";
import { generateSlug, isUUID } from "../helpers/slug";
import { getApplicablePromotion, calculateFinalPrice, PriceWithPromotion } from "./promotion.service";


interface ProductItemInput {
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
    sortOrder?: number;
}

interface VariantInput {
    id?: string;  // present when updating existing variant
    name?: string;
    description?: string;
    code?: string;
    price?: number;
    discount?: number;
    size?: string;
    color?: string;
    sizePricing?: Record<string, { price?: number; discount?: number }>;
    sizeMaterialPricing?: Record<string, Record<string, number>>;
    sizes?: string[];
    sku?: string;
    images?: string[];
    sortOrder?: number;
    style?: string;
}

interface CreateProductInput {
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
    manualVariants?: boolean;    // true = user manages variants manually, false = auto-generate (default)
    variants?: VariantInput[];   // sub-variants when manualVariants=true
    items?: ProductItemInput[];   // sub-items like "Taie d'oreiller", "Housse de couette"
    details?: { key: string; value: string }[];
    isDetailsEnabled?: boolean;
    styles?: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const includeAll = [
    {
        model: ProductVariant,
        as: "variants",
        include: [{ model: Color, as: "colorData" }, { model: require('../models').Style, as: "styleData" }]
    },
    { model: ProductItem, as: "items" },

];

/**
 * Generate product variants based on sizes, colors, prices, and pricing rules
 * Reusable by both create and update operations
 */
const regenerateProductVariants = async (
    productId: string,
    sizes?: string[],
    colors?: string[],
    prices?: number[],
    discounts?: number[],
    sizePricing?: Record<string, { price?: number; discount?: number }>,
    variantImages?: Record<string, string[]>,
    defaultImages?: string[]
): Promise<void> => {
    // Delete all existing variants for this product
    await ProductVariant.destroy({ where: { productId } });

    // Prepare variant generation parameters
    const variantSizes = (sizes && sizes.length > 0) ? sizes : [undefined];
    const variantColors = (colors && colors.length > 0) ? colors : [undefined];
    const variantPrices = (prices && prices.length > 0) ? prices : [0];
    const variantDiscounts = (discounts && discounts.length > 0) ? discounts : [0];

    // Create all size × color variant combinations
    for (let i = 0; i < variantSizes.length; i++) {
        for (let j = 0; j < variantColors.length; j++) {
            const size = variantSizes[i];
            const colorKey = variantColors[j];

            const sp = (sizePricing && size) ? sizePricing[size] : null;

            // If sizePricing specifies price/discount for this size, use that.
            // Otherwise, iterate over generic prices/discounts arrays
            const targetPrices = sp?.price != null ? [sp.price] : variantPrices;
            const targetDiscounts = sp?.discount != null ? [sp.discount] : variantDiscounts;

            for (let k = 0; k < targetPrices.length; k++) {
                for (let l = 0; l < targetDiscounts.length; l++) {
                    const varImages = (variantImages && colorKey)
                        ? variantImages[colorKey]
                        : defaultImages;

                    await ProductVariant.create({
                        productId,
                        price: targetPrices[k],
                        discount: targetDiscounts[l],
                        size,
                        color: colorKey,
                        sku: "SKU-" + uuidv4().split("-")[0].toUpperCase(),
                        images: varImages,
                    });
                }
            }
        }
    }
};

/**
 * Synchronize product items during update: add new, update existing, delete removed
 */
const syncProductItems = async (
    productId: string,
    newItems?: ProductItemInput[]
): Promise<void> => {
    if (!newItems) {
        // If no items provided, don't modify existing items
        return;
    }

    // Get current items from database
    const currentItems = await ProductItem.findAll({ where: { productId } });
    const currentItemsMap = new Map(currentItems.map(it => [it.id, it]));

    // Track which item IDs we've processed
    const processedIds = new Set<string>();

    // Process each item in the new list
    for (let idx = 0; idx < newItems.length; idx++) {
        const item = newItems[idx];

        if (item.id) {
            // Update existing item
            processedIds.add(item.id);
            await updateProductItem(item.id, {
                ...item,
                sortOrder: idx,
            });
        } else {
            // Add new item
            await addProductItem(productId, {
                ...item,
                sortOrder: idx,
            });
        }
    }

    // Delete items that are no longer in the list
    for (const [itemId] of currentItemsMap) {
        if (!processedIds.has(itemId)) {
            await deleteProductItem(itemId);
        }
    }
};

/**
 * Synchronize product variants during update: add new, update existing, delete removed
 */
const syncProductVariants = async (
    productId: string,
    newVariants?: VariantInput[]
): Promise<void> => {
    if (!newVariants) {
        // If no variants provided, don't modify existing variants
        return;
    }

    // Get current variants from database
    const currentVariants = await ProductVariant.findAll({ where: { productId } });
    const currentVariantsMap = new Map(currentVariants.map(v => [v.id, v]));

    // Track which variant IDs we've processed
    const processedIds = new Set<string>();

    // Process each variant in the new list
    for (let idx = 0; idx < newVariants.length; idx++) {
        const variant = newVariants[idx];

        if (variant.id) {
            // Update existing variant
            processedIds.add(variant.id);
            await updateProductVariant(variant.id, {
                ...variant,
                sortOrder: idx,
            });
        } else {
            // Add new variant
            await addProductVariant(productId, {
                ...variant,
                sortOrder: idx,
            });
        }
    }

    // Delete variants that are no longer in the list
    for (const [variantId] of currentVariantsMap) {
        if (!processedIds.has(variantId)) {
            await deleteProductVariant(variantId);
        }
    }
};

/**
 * Enrich a product with promotion information
 */
async function enrichProductWithPromotion(product: any) {
    const promotion = await getApplicablePromotion(product);

    // Get the base price (used if no size-material pricing)
    const basePrice = product.price || 0;
    const basePricing = calculateFinalPrice(basePrice, promotion);

    // If product has size-material pricing, apply promotion to each combination
    let sizeMaterialPricingWithPromotion: Record<string, Record<string, any>> | undefined;

    if (product.sizeMaterialPricing && typeof product.sizeMaterialPricing === 'object') {
        sizeMaterialPricingWithPromotion = {};

        for (const [size, materials] of Object.entries(product.sizeMaterialPricing)) {
            sizeMaterialPricingWithPromotion[size] = {};

            if (typeof materials === 'object' && materials !== null) {
                for (const [material, price] of Object.entries(materials as Record<string, number>)) {
                    const materialPrice = Number(price) || 0;
                    const materialPricing = calculateFinalPrice(materialPrice, promotion);

                    sizeMaterialPricingWithPromotion[size][material] = {
                        basePrice: materialPrice,
                        finalPrice: materialPricing.finalPrice,
                        savingsAmount: materialPricing.savingsAmount,
                        savingsPercentage: materialPricing.savingsPercentage,
                    };
                }
            }
        }
    }

    return {
        ...product.toJSON ? product.toJSON() : product,
        promotion: promotion ? {
            id: promotion.id,
            name: promotion.name,
            discountType: promotion.discountType,
            discountValue: promotion.discountValue,
        } : null,
        pricing: basePricing,
        sizeMaterialPricingWithPromotion,
    };
}

/**
 * Enrich multiple products with promotion information
 */
async function enrichProductsWithPromotions(products: Product[]) {
    return Promise.all(products.map(enrichProductWithPromotion));
}

// ─── Product CRUD ────────────────────────────────────────────────────────────

export const createProduct = async (data: CreateProductInput) => {
    const priceFixed = (data.prices?.length ?? 0) === 1;
    const discountFixed = (data.discounts?.length ?? 0) === 1;
    const sizesFixed = !data.sizes || data.sizes.length === 1;
    const colorsFixed = !data.colors || data.colors.length === 1;

    let productType: ProductType = ProductType.VARIABLE_VARIABLE_VARIABLE; // Default fallback

    if (priceFixed && discountFixed && sizesFixed && colorsFixed) {
        productType = ProductType.FIXED_FIXED_FIXED;
    } else if (priceFixed && discountFixed) {
        productType = ProductType.FIXED_FIXED_VARIABLE;
    } else {
        productType = ProductType.VARIABLE_VARIABLE_VARIABLE;
    }

    const baseSlug = generateSlug(data.name ?? data.code);
    const slug = await ensureUniqueSlug(baseSlug);

    const product = await Product.create({
        name: data.name || undefined,
        slug,
        code: data.code,
        description: data.description,
        productType,
        price: priceFixed ? data.prices?.[0] : undefined,
        discount: discountFixed ? data.discounts?.[0] : undefined,
        sizes: sizesFixed ? data.sizes : undefined,
        colors: colorsFixed ? data.colors : undefined,
        sizeMaterialPricing: data.sizeMaterialPricing,
        images: data.images,
        categoryId: data.categoryId,
        manualVariants: data.manualVariants ?? false,
        details: data.details,
        isDetailsEnabled: data.isDetailsEnabled ?? false,
        styles: data.styles,
    });

    // --- Variants ---
    if (data.manualVariants && data.variants && data.variants.length > 0) {
        // Manual variant management
        await syncProductVariants(product.id, data.variants);
    } else {
        // Auto-generate variants (default behavior)
        await regenerateProductVariants(
            product.id,
            data.sizes,
            data.colors,
            data.prices,
            data.discounts,
            data.sizePricing,
            data.variantImages,
            data.images
        );
    }

    // --- Items (product group pieces) ---
    if (data.items && data.items.length > 0) {
        for (let idx = 0; idx < data.items.length; idx++) {
            const item = data.items[idx];
            await ProductItem.create({
                productId: product.id,
                name: item.name,
                code: item.code,
                description: item.description,
                price: item.price,
                discount: item.discount,
                sizePricing: item.sizePricing,
                sizeMaterialPricing: item.sizeMaterialPricing,
                sizes: item.sizes,
                colors: item.colors,
                images: item.images,
                sortOrder: item.sortOrder ?? idx,
            });
        }
    }

    return getProductById(product.id);
};

export const getAllProducts = async (search?: string, filters?: { color?: string; size?: string }) => {
    let whereClause: any = {};

    // Search by code, name, or description
    if (search) {
        whereClause = {
            [Op.or]: [
                { name: { [Op.iLike]: `%${search}%` } },
                { code: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } },
            ]
        };
    }

    const products = await Product.findAll({ where: whereClause, include: includeAll });

    // Filter by attributes (color, size) if provided
    let filteredProducts = products;
    if (filters?.color || filters?.size) {
        filteredProducts = products.filter((product) => {
            // If no variants, product doesn't match attribute filters
            if (!product.variants || product.variants.length === 0) return false;

            return product.variants.some((variant: any) => {
                const colorMatch = !filters.color || variant.color === filters.color;
                const sizeMatch = !filters.size || variant.size === filters.size;
                return colorMatch && sizeMatch;
            });
        });
    }

    return await enrichProductsWithPromotions(filteredProducts);
};

export const getProductsByCategoryId = async (categoryId: string) => {
    const category = await ProductCategory.findByPk(categoryId, {
        include: [{ model: ProductCategory, as: "children", attributes: ["id"] }],
    });

    if (!category) throw new Error("Category not found");

    const categoryIds: string[] = category.children && category.children.length > 0
        ? [category.id, ...category.children.map((c) => c.id)]
        : [category.id];

    const products = await Product.findAll({
        where: { categoryId: categoryIds },
        include: includeAll,
    });
    return await enrichProductsWithPromotions(products);
};

export const getCategoryVariants = async (categoryId: string) => {
    const products = await getProductsByCategoryId(categoryId);
    const variantsList: any[] = [];

    for (const product of products) {
        if (!product.variants || product.variants.length === 0) {
            variantsList.push({ ...product, mainProductId: product.id });
            continue;
        }

        for (const variant of product.variants) {
            const finalPrice = variant.price != null ? variant.price : product.price;
            const finalDiscount = variant.discount != null ? variant.discount : product.discount;
            // Assuming promotion is already attached to product
            const pricing = product.promotion ? calculateFinalPrice(finalPrice || 0, product.promotion) : calculateFinalPrice(finalPrice || 0, null);

            variantsList.push({
                ...product,
                variantId: variant.id,
                mainProductId: product.id,
                name: variant.name || product.name,
                price: finalPrice,
                discount: finalDiscount,
                images: variant.images && variant.images.length > 0 ? variant.images : product.images,
                colorData: variant.colorData,
                styleData: variant.styleData,
                pricing,
            });
        }
    }
    return variantsList;
};

const ensureUniqueSlug = async (base: string, excludeProductId?: string) => {
    let candidate = base;
    let suffix = 1;

    // keep trying until we find a free slug (or it's already ours)
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const existing = await Product.findOne({ where: { slug: candidate } });
        if (!existing) return candidate;
        if (excludeProductId && existing.id === excludeProductId) return candidate;

        suffix += 1;
        candidate = `${base}-${suffix}`;
    }
};

export const getProductById = async (id: string) => {
    const product = isUUID(id)
        ? await Product.findByPk(id, { include: includeAll })
        : await Product.findOne({
            where: {
                [Op.or]: [
                    { slug: id },
                    { code: id },
                ]
            },
            include: includeAll
        });
    if (!product) throw new Error("Product not found");
    return await enrichProductWithPromotion(product);
};

export const getProductsByCode = async (code: string) => {
    const products = await Product.findAll({
        where: { code },
        include: includeAll,
        order: [['createdAt', 'ASC']],
    });
    if (products.length === 0) throw new Error("No products found with this code");

    // Enrich all products with promotions
    const enriched = await Promise.all(
        products.map((p) => enrichProductWithPromotion(p))
    );
    return enriched;
};

export const updateProduct = async (id: string, data: Partial<CreateProductInput>) => {
    const product = await Product.findByPk(id);
    if (!product) throw new Error("Product not found");

    // Determine new slug if name or code changed
    const nextSlug = data.name
        ? await ensureUniqueSlug(generateSlug(data.name), product.id)
        : data.code
            ? await ensureUniqueSlug(generateSlug(data.code), product.id)
            : product.slug;

    // Prepare updated sizes, colors, prices
    const updatedSizes = data.sizes !== undefined ? data.sizes : product.sizes;
    const updatedColors = data.colors !== undefined ? data.colors : product.colors;
    const updatedPrices = data.prices !== undefined ? data.prices : (product.price != null ? [product.price] : undefined);
    const updatedDiscounts = data.discounts !== undefined ? data.discounts : (product.discount != null ? [product.discount] : undefined);

    // Determine the variant mode (manual vs auto)
    const manualVariants = data.manualVariants !== undefined ? data.manualVariants : product.manualVariants;

    // Recalculate product type based on new pricing structure (only for auto-generate mode)
    const priceFixed = (updatedPrices?.length ?? 0) === 1;
    const discountFixed = (updatedDiscounts?.length ?? 0) === 1;
    const sizesFixed = !updatedSizes || updatedSizes.length === 1;
    const colorsFixed = !updatedColors || updatedColors.length === 1;

    let productType: ProductType = ProductType.VARIABLE_VARIABLE_VARIABLE;
    if (priceFixed && discountFixed && sizesFixed && colorsFixed) {
        productType = ProductType.FIXED_FIXED_FIXED;
    } else if (priceFixed && discountFixed) {
        productType = ProductType.FIXED_FIXED_VARIABLE;
    }

    // Clear sizeMaterialPricing if not explicitly provided
    const updatedSizeMaterialPricing = data.sizeMaterialPricing !== undefined ? data.sizeMaterialPricing : product.sizeMaterialPricing;

    await product.update({
        name: data.name !== undefined ? (data.name || undefined) : product.name,
        slug: nextSlug,
        code: data.code !== undefined ? data.code : product.code,
        description: data.description,
        productType,
        price: priceFixed ? updatedPrices?.[0] : undefined,
        discount: discountFixed ? updatedDiscounts?.[0] : undefined,
        sizes: sizesFixed ? updatedSizes : undefined,
        colors: colorsFixed ? updatedColors : undefined,
        sizeMaterialPricing: updatedSizeMaterialPricing,
        images: data.images,
        categoryId: data.categoryId,
        manualVariants,
        details: data.details !== undefined ? data.details : product.details,
        isDetailsEnabled: data.isDetailsEnabled !== undefined ? data.isDetailsEnabled : product.isDetailsEnabled,
        styles: data.styles !== undefined ? data.styles : product.styles,
    });

    // Sync product items (add/update/delete)
    await syncProductItems(id, data.items);

    // Handle variants based on mode
    if (manualVariants && data.variants !== undefined) {
        // Manual variant mode: sync the provided variants
        await syncProductVariants(id, data.variants);
    } else if (!manualVariants) {
        // Auto-generate mode: regenerate variants if sizes, colors, or pricing changed
        const shouldRegenerateVariants =
            data.sizes !== undefined ||
            data.colors !== undefined ||
            data.prices !== undefined ||
            data.discounts !== undefined ||
            data.sizePricing !== undefined ||
            data.sizeMaterialPricing !== undefined;

        if (shouldRegenerateVariants) {
            await regenerateProductVariants(
                id,
                updatedSizes,
                updatedColors,
                updatedPrices,
                updatedDiscounts,
                data.sizePricing,
                data.variantImages,
                data.images
            );
        }
    }

    return getProductById(id);
};

export const deleteProduct = async (id: string) => {
    const product = await Product.findByPk(id);
    if (!product) throw new Error("Product not found");

    await ProductVariant.destroy({ where: { productId: id } });
    await ProductItem.destroy({ where: { productId: id } });
    await product.destroy();

    return { message: "Product deleted" };
};

// ─── Product Items (sub-pieces) CRUD ─────────────────────────────────────────

export const addProductItem = async (productId: string, data: ProductItemInput) => {
    const product = await Product.findByPk(productId);
    if (!product) throw new Error("Product not found");

    const count = await ProductItem.count({ where: { productId } });
    return ProductItem.create({
        productId,
        name: data.name,
        code: data.code,
        description: data.description,
        price: data.price,
        discount: data.discount,
        sizePricing: data.sizePricing,
        sizeMaterialPricing: data.sizeMaterialPricing,
        sizes: data.sizes,
        colors: data.colors,
        images: data.images,
        sortOrder: data.sortOrder ?? count,
    });
};

export const updateProductItem = async (itemId: string, data: Partial<ProductItemInput>) => {
    const item = await ProductItem.findByPk(itemId);
    if (!item) throw new Error("Item not found");
    await item.update(data);
    return item;
};

export const deleteProductItem = async (itemId: string) => {
    const item = await ProductItem.findByPk(itemId);
    if (!item) throw new Error("Item not found");
    await item.destroy();
    return { message: "Item deleted" };
};

// ─── Product Variants (manual) CRUD ──────────────────────────────────────────

export const addProductVariant = async (productId: string, data: VariantInput) => {
    const product = await Product.findByPk(productId);
    if (!product) throw new Error("Product not found");

    const count = await ProductVariant.count({ where: { productId } });

    // Auto-generate SKU if not provided
    const sku = data.sku || ("SKU-" + uuidv4().split("-")[0].toUpperCase());

    return ProductVariant.create({
        productId,
        name: data.name,
        description: data.description,
        code: data.code,
        price: data.price,
        discount: data.discount,
        size: data.size,
        color: data.color,
        sizePricing: data.sizePricing,
        sizeMaterialPricing: data.sizeMaterialPricing,
        sizes: data.sizes,
        sku,
        images: data.images,
        sortOrder: data.sortOrder ?? count,
        style: data.style,
    });
};

export const updateProductVariant = async (variantId: string, data: Partial<VariantInput>) => {
    const variant = await ProductVariant.findByPk(variantId);
    if (!variant) throw new Error("Variant not found");
    await variant.update(data);
    return variant;
};

export const deleteProductVariant = async (variantId: string) => {
    const variant = await ProductVariant.findByPk(variantId);
    if (!variant) throw new Error("Variant not found");
    await variant.destroy();
    return { message: "Variant deleted" };
};
