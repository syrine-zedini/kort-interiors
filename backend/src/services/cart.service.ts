import { CartItem } from '../models/cart_item.model';
import { Product } from '../models/product.model';
import { Color } from '../models/color.model';
import { ProductVariant } from '../models/product_variant';
import { ProductItem } from '../models/product_item.model';
import { Op } from 'sequelize';
import { getApplicablePromotion, calculateFinalPrice } from './promotion.service';
import { getProductById } from './product.service';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (s?: string | null): boolean => !!s && UUID_RE.test(s);

interface AddToCartInput {
  userId: string;
  productId: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedMaterial?: string;
  selectedItemId?: string;
}

interface CartCalculations {
  subtotal: number;
  itemCount: number;
  items: any[];
}

interface CartTotals extends CartCalculations {
  shipping: number;
  grandTotal: number;
}

// ─── Cart Item Management ────────────────────────────────────────────────────

/**
 * Add item to cart or increment quantity if already exists
 */
export const addToCart = async (input: AddToCartInput) => {
  const { userId, productId, quantity, selectedSize, selectedColor, selectedMaterial, selectedItemId } = input;

  // Validate quantity
  if (quantity < 1) {
    throw new Error('Quantity must be at least 1');
  }

  // ✅ CORRECTION : Use getProductById instead of Product.findByPk
  // This works with both local products (UUID) and Oopos products (codes)
  let product;
  try {
    product = await getProductById(productId);
  } catch (err) {
    throw new Error('Product not found');
  }

  // Validate stock (if you have stock tracking)
  const normalizedSelectedSize = selectedItemId
    ? `__item__:${selectedItemId}:${selectedSize ?? ""}`
    : selectedSize;

  await validateStock(productId, quantity, normalizedSelectedSize, selectedColor);

  // Get current price (handle variable pricing)
  const priceAtPurchase = await getProductPrice(
    productId,
    selectedSize, // pass original un-normalized size for pricing lookup
    selectedColor,
    selectedMaterial,
    selectedItemId
  );

  // Check if item already in cart
  const whereCondition: any = {
    userId,
    productId,
    selectedItemId: selectedItemId ?? null,
  };

  // Only add size/color/material to the where clause if they're provided
  if (normalizedSelectedSize !== undefined && normalizedSelectedSize !== null) {
    whereCondition.selectedSize = normalizedSelectedSize;
  } else {
    whereCondition.selectedSize = null;
  }

  if (selectedColor !== undefined && selectedColor !== null) {
    whereCondition.selectedColor = selectedColor;
  } else {
    whereCondition.selectedColor = null;
  }

  if (selectedMaterial !== undefined && selectedMaterial !== null) {
    whereCondition.selectedMaterial = selectedMaterial;
  } else {
    whereCondition.selectedMaterial = null;
  }

  const existingCartItem = await CartItem.findOne({
    where: whereCondition,
  });

  if (existingCartItem) {
    // Increment quantity
    const newQuantity = existingCartItem.quantity + quantity;
    await validateStock(productId, newQuantity, normalizedSelectedSize, selectedColor);
    return await existingCartItem.update({ quantity: newQuantity });
  }

  // Create new cart item
  return await CartItem.create({
    userId,
    productId,
    quantity,
    priceAtPurchase,
    selectedItemId: selectedItemId ?? undefined,
    selectedSize: normalizedSelectedSize,
    selectedColor,
    selectedMaterial,
  });
};

/**
 * Update quantity of an item in cart
 */
export const updateCartItemQuantity = async (cartItemId: string, quantity: number) => {
  if (quantity < 0) {
    throw new Error('Quantity cannot be negative');
  }

  const cartItem = await CartItem.findByPk(cartItemId);
  if (!cartItem) {
    throw new Error('Cart item not found');
  }

  // Remove item if quantity is 0
  if (quantity === 0) {
    await cartItem.destroy();
    return null;
  }

  // Validate stock before updating
  await validateStock(cartItem.productId, quantity, cartItem.selectedSize, cartItem.selectedColor);

  return await cartItem.update({ quantity });
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (cartItemId: string) => {
  const cartItem = await CartItem.findByPk(cartItemId);
  if (!cartItem) {
    throw new Error('Cart item not found');
  }

  await cartItem.destroy();
  return { success: true };
};

/**
 * Clear entire cart for a user
 */
export const clearCart = async (userId: string) => {
  await CartItem.destroy({
    where: { userId },
  });
  return { success: true };
};

// ─── Cart Retrieval ─────────────────────────────────────────────────────────

/**
 * Get all cart items for a user with product details
 */
export const getUserCart = async (userId: string) => {
  // Fetch cart items WITHOUT Product include to avoid UUID type mismatch
  // (OOPOS productIds like "oopos-1093" are TEXT, but products.id is UUID)
  const cartItems = await CartItem.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
  });

  // Fetch local products only for cart items with valid UUID productIds
  const localProductIds = [...new Set(cartItems.map(i => i.productId).filter(isUUID))];
  const localProducts = localProductIds.length > 0
    ? await Product.findAll({
        where: { id: localProductIds },
        attributes: ['id', 'name', 'description', 'images', 'price', 'discount', 'sizeMaterialPricing', 'categoryId'],
      })
    : [];
  const localProductMap = new Map(localProducts.map((p: any) => [p.id, p.toJSON()]));

  // Fetch OOPOS product details (images, name, price) for non-UUID productIds
  const ooposProductIds = [...new Set(cartItems.map(i => i.productId).filter(id => !isUUID(id)))];
  const ooposProductMap = new Map<string, any>();
  await Promise.all(ooposProductIds.map(async (productId) => {
    try {
      const p = await getProductById(productId);
      ooposProductMap.set(productId, p);
    } catch { /* OOPOS product not found, leave null */ }
  }));

  // Attach local or OOPOS product to each cart item
  const cartItemsWithProduct: any[] = cartItems.map(item => ({
    ...(item.toJSON() as any),
    product: localProductMap.get(item.productId) ?? ooposProductMap.get(item.productId) ?? null,
  }));

  // Fetch color details — only for UUID-format selectedColors (local DB colors)
  const colorIds = [...new Set(cartItems.map(item => item.selectedColor).filter(isUUID))] as string[];
  const colors = colorIds.length > 0 ? await Color.findAll({
    where: { id: colorIds },
    attributes: ['id', 'nameFr'],
  }) : [];

  const colorMap = new Map(colors.map(c => [c.id, c.nameFr]));

  // Fetch product items only for local UUID productIds
  const cartProductIds = [...new Set(cartItems.map((item) => item.productId).filter(isUUID))];
  const productItems = cartProductIds.length > 0
    ? await ProductItem.findAll({
        where: { productId: cartProductIds },
        attributes: ["id", "productId", "name", "images", "sizes", "price", "discount"],
      })
    : [];
  const pieceNameMap = new Map(productItems.map((pi) => [pi.id, pi.name]));
  const pieceImageMap = new Map(
    productItems.map((pi: any) => [pi.id, Array.isArray(pi.images) ? pi.images[0] : undefined])
  );
  const productItemsByProductId = new Map<string, any[]>();
  for (const item of productItems as any[]) {
    const list = productItemsByProductId.get(item.productId) ?? [];
    list.push(item);
    productItemsByProductId.set(item.productId, list);
  }

  // Map cart items with color names
  const itemsWithColors = cartItemsWithProduct.map(item => {
    const itemData = item;
    const isEncodedPiece = typeof item.selectedSize === "string" && item.selectedSize.startsWith("__item__:");
    const piecePayload = isEncodedPiece ? item.selectedSize!.replace("__item__:", "") : "";
    const [pieceIdRaw, ...pieceSizeParts] = piecePayload.split(":");
    let pieceId: string | undefined = itemData.selectedItemId ?? pieceIdRaw ?? undefined;
    let pieceSize: string | undefined = isEncodedPiece ? (pieceSizeParts.join(":") || undefined) : item.selectedSize;

    // Fallback for old cart rows that were stored without selectedItemId/encoded marker.
    if (!pieceId) {
      const candidates = productItemsByProductId.get(item.productId) ?? [];
      const selectedSize = item.selectedSize;
      const rowPrice = Number(item.priceAtPurchase);
      const bySizeAndPrice = candidates.find((candidate: any) => {
        const sizes: string[] = Array.isArray(candidate.sizes) ? candidate.sizes : [];
        const sizeMatches = selectedSize ? sizes.includes(selectedSize) : false;
        const sizePricing = candidate.sizePricing && selectedSize ? candidate.sizePricing[selectedSize] : undefined;
        const basePrice =
          sizePricing?.price != null
            ? Number(sizePricing.price)
            : candidate.price != null
              ? Number(candidate.price)
              : undefined;
        const discount =
          sizePricing?.discount != null
            ? Number(sizePricing.discount)
            : candidate.discount != null
              ? Number(candidate.discount)
              : 0;
        const finalPrice = basePrice != null ? Math.max(0, basePrice - discount) : undefined;
        return sizeMatches && finalPrice != null && finalPrice === rowPrice;
      });
      const bySizeOnly = candidates.find((candidate: any) => {
        const sizes: string[] = Array.isArray(candidate.sizes) ? candidate.sizes : [];
        return selectedSize ? sizes.includes(selectedSize) : false;
      });
      const inferred = bySizeAndPrice ?? bySizeOnly;
      if (inferred) {
        pieceId = inferred.id;
        pieceSize = selectedSize ?? pieceSize;
      }
    }

    const pieceName = pieceId ? pieceNameMap.get(pieceId) : undefined;
    const pieceImage = pieceId ? pieceImageMap.get(pieceId) : undefined;
    // Parse images if they're JSON strings
    if (itemData.product?.images && typeof itemData.product.images === 'string') {
      itemData.product.images = JSON.parse(itemData.product.images);
    }
    return {
      ...itemData,
      pieceId,
      pieceName,
      pieceImage,
      displaySize: pieceId ? pieceSize : item.selectedSize,
      colorName: item.selectedColor ? colorMap.get(item.selectedColor) : undefined,
    };
  });

  // Enrich products with promotion data (local DB products only — OOPOS products have no UUID id)
  const enrichedItems = await Promise.all(
    itemsWithColors.map(async (item: any) => {
      if (item.product && isUUID(item.product.id)) {
        const promotion = await getApplicablePromotion(item.product);

        // Add promotion data to the product
        item.product.promotion = promotion ? {
          id: promotion.id,
          name: promotion.name,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
        } : null;

        // Calculate base pricing with promotion
        const basePrice = Number(item.product.price) || 0;
        const basePricing = calculateFinalPrice(basePrice, promotion);
        item.product.pricing = basePricing;

        // Calculate pricing for size-material combinations if they exist
        if (item.product.sizeMaterialPricing && typeof item.product.sizeMaterialPricing === 'object') {
          item.product.sizeMaterialPricingWithPromotion = {};

          for (const [size, materials] of Object.entries(item.product.sizeMaterialPricing)) {
            item.product.sizeMaterialPricingWithPromotion[size] = {};

            if (typeof materials === 'object' && materials !== null) {
              for (const [material, price] of Object.entries(materials as Record<string, number>)) {
                const materialPrice = Number(price) || 0;
                const materialPricing = calculateFinalPrice(materialPrice, promotion);

                item.product.sizeMaterialPricingWithPromotion[size][material] = {
                  basePrice: materialPrice,
                  finalPrice: materialPricing.finalPrice,
                  savingsAmount: materialPricing.savingsAmount,
                  savingsPercentage: materialPricing.savingsPercentage,
                };
              }
            }
          }
        }
      }
      return item;
    })
  );

  return enrichedItems;
};

/**
 * Get single cart item
 */
export const getCartItem = async (cartItemId: string) => {
  const cartItem = await CartItem.findByPk(cartItemId);
  if (!cartItem) return null;
  const product = isUUID(cartItem.productId)
    ? await Product.findByPk(cartItem.productId)
    : null;
  return { ...(cartItem.toJSON() as any), product };
};

// ─── Cart Calculations ──────────────────────────────────────────────────────

/**
 * Calculate cart subtotal and item count
 */
export const calculateCartSubtotal = async (userId: string): Promise<CartCalculations> => {
  const cartItems = await CartItem.findAll({ where: { userId } });

  // Fetch local products only for UUID productIds (skip OOPOS items)
  const localIds = [...new Set(cartItems.map(i => i.productId).filter(isUUID))];
  const localProducts = localIds.length > 0
    ? await Product.findAll({
        where: { id: localIds },
        attributes: ['id', 'name', 'description', 'images', 'price', 'discount', 'sizeMaterialPricing', 'categoryId'],
      })
    : [];
  const productMap = new Map(localProducts.map((p: any) => [p.id, p.toJSON()]));

  let subtotal = 0;
  let itemCount = 0;

  for (const item of cartItems) {
    let itemPrice = Number(item.priceAtPurchase);
    const product = productMap.get(item.productId);

    if (product) {
      const promotion = await getApplicablePromotion(product);
      if (promotion) {
        const priceWithPromotion = calculateFinalPrice(itemPrice, promotion);
        itemPrice = priceWithPromotion.finalPrice;
      }
    }

    subtotal += itemPrice * item.quantity;
    itemCount += item.quantity;
  }

  return {
    subtotal,
    itemCount,
    items: cartItems,
  };
};

/**
 * Calculate shipping (flat fee or based on weight/rules)
 */
export const calculateShipping = (subtotal: number, itemCount: number, shippingConfig?: any): number => {
  // Default: Free shipping over 100, otherwise 10
  if (shippingConfig?.freeShippingThreshold && subtotal >= shippingConfig.freeShippingThreshold) {
    return 0;
  }

  return shippingConfig?.baseShippingFee || 10;
};

/**
 * Calculate complete cart totals
 */
export const calculateCartTotals = async (
  userId: string,
  shippingConfig?: any
): Promise<CartTotals> => {
  const { subtotal, itemCount, items } = await calculateCartSubtotal(userId);
  const shipping = calculateShipping(subtotal, itemCount, shippingConfig);
  const grandTotal = Math.round((subtotal + shipping) * 100) / 100;

  return {
    subtotal,
    itemCount,
    shipping,
    grandTotal,
    items,
  };
};

// ─── Validation & Helpers ──────────────────────────────────────────────────

/**
 * Validate that product has sufficient stock
 * (Implement based on your stock model)
 */
export const validateStock = async (
  productId: string,
  quantity: number,
  selectedSize?: string,
  selectedColor?: string
): Promise<void> => {
  // TODO: Implement based on your stock model
  // For now, we'll assume unlimited stock
  // You can add stock validation here if you have a stock tracking system

  return;
};

/**
 * Get product price (handles variable pricing based on size/color)
 */
export const getProductPrice = async (
  productId: string,
  selectedSize?: string,
  selectedColor?: string,
  selectedMaterial?: string,
  selectedItemId?: string
): Promise<number> => {
  // ✅ CORRECTION : Use getProductById instead of Product.findByPk
  // This works with both local products (UUID) and Oopos products (codes)
  let product;
  try {
    product = await getProductById(productId);
  } catch (err) {
    throw new Error('Product not found');
  }

  if (selectedItemId && isUUID(productId)) {
    const item = await ProductItem.findOne({
      where: {
        id: selectedItemId,
        productId,
      },
    });
    if (!item) {
      throw new Error('Product item not found');
    }
    const itemData = item.toJSON() as any;

    // Check sizeMaterialPricing first
    if (selectedSize && selectedMaterial && itemData.sizeMaterialPricing?.[selectedSize]?.[selectedMaterial] != null) {
      return Number(itemData.sizeMaterialPricing[selectedSize][selectedMaterial]);
    }

    const sizePricing = selectedSize ? itemData.sizePricing?.[selectedSize] : undefined;
    const basePrice =
      sizePricing?.price != null
        ? Number(sizePricing.price)
        : item.price != null
          ? Number(item.price)
          : undefined;
    const discount =
      sizePricing?.discount != null
        ? Number(sizePricing.discount)
        : item.discount != null
          ? Number(item.discount)
          : 0;
    if (basePrice != null) {
      return Math.max(0, basePrice - discount);
    }
    throw new Error('Product item price not available');
  }

  // Check sizeMaterialPricing for main product
  if (selectedSize && selectedMaterial && (product as any).sizeMaterialPricing?.[selectedSize]?.[selectedMaterial] != null) {
    return Number((product as any).sizeMaterialPricing[selectedSize][selectedMaterial]);
  }

  // If product has variants with different prices (local DB products only)
  if (isUUID(productId) && (selectedSize || selectedColor)) {
    const variant = await ProductVariant.findOne({
      where: {
        productId,
        ...(selectedSize && { size: selectedSize }),
        ...(selectedColor && { color: selectedColor }),
      },
    });

    if (variant && variant.price) {
      return Number(variant.price);
    }
  }

  // Return base product price
  if ((product as any).price) {
    return Number((product as any).price);
  }

  throw new Error('Product price not available');
};

/**
 * Apply discount to cart total
 */
export const applyDiscount = (subtotal: number, discountPercentage: number): number => {
  if (discountPercentage < 0 || discountPercentage > 100) {
    throw new Error('Discount percentage must be between 0 and 100');
  }

  return Math.round(subtotal * (1 - discountPercentage / 100) * 100) / 100;
};

/**
 * Check if cart is empty
 */
export const isCartEmpty = async (userId: string): Promise<boolean> => {
  const count = await CartItem.count({ where: { userId } });
  return count === 0;
};
