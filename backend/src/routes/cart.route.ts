import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import {
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  getUserCart,
  getCartItem,
  calculateCartTotals,
  calculateCartSubtotal,
} from '../services/cart.service';
import { Color } from '../models/color.model';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Manage user shopping cart
 */

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 description: UUID of the product
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity to add
 *               selectedSize:
 *                 type: string
 *                 description: Selected size variant (optional)
 *               selectedColor:
 *                 type: string
 *                 description: Selected color variant (optional)
 *     responses:
 *       201:
 *         description: Item added to cart or quantity updated
 *       400:
 *         description: Bad request or validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const { productId, quantity, selectedSize, selectedColor, selectedItemId, selectedMaterial } = req.body;

    // Validation
    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'quantity must be at least 1' });
    }

    const cartItem = await addToCart({
      userId: req.user!.id,
      productId,
      quantity,
      selectedSize,
      selectedColor,
      selectedItemId,
      selectedMaterial,
    });

    res.status(201).json(cartItem);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get user's cart with all items
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of cart items with product details
 *       401:
 *         description: Unauthorized
 */
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const cartItems = await getUserCart(req.user!.id);
    
    // Ensure color names are included by fetching colors if not present
    const colorIds = [...new Set(cartItems
      .filter((item: any) => item.selectedColor && !item.colorName)
      .map((item: any) => item.selectedColor))] as string[];
    
    let colorMap = new Map();
    if (colorIds.length > 0) {
      const colors = await Color.findAll({
        where: { id: colorIds },
        attributes: ['id', 'nameFr'],
      });
      colorMap = new Map(colors.map(c => [c.id, c.nameFr]));
    }
    
    // Merge color names into items that don't have them
    const itemsWithColors = cartItems.map((item: any) => {
      // Parse images if they're JSON strings
      if (item.product?.images && typeof item.product.images === 'string') {
        item.product.images = JSON.parse(item.product.images);
      }
      return {
        ...item,
        colorName: item.colorName || (item.selectedColor ? colorMap.get(item.selectedColor) : undefined),
      };
    });
    
    res.json(itemsWithColors);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /cart/totals:
 *   get:
 *     summary: Get cart totals (subtotal, shipping, grand total)
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart totals and calculations
 *       401:
 *         description: Unauthorized
 */
router.get('/totals', auth, async (req: Request, res: Response) => {
  try {
    const totals = await calculateCartTotals(req.user!.id);
    res.json(totals);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /cart/{cartItemId}:
 *   get:
 *     summary: Get a specific cart item
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartItemId
 *         schema:
 *           type: string
 *         required: true
 *         description: Cart item ID
 *     responses:
 *       200:
 *         description: Cart item details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart item not found
 */
router.get('/:cartItemId', auth, async (req: Request, res: Response) => {
  try {
    const cartItem = await getCartItem(String(req.params.cartItemId));
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    res.json(cartItem);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /cart/{cartItemId}:
 *   patch:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartItemId
 *         schema:
 *           type: string
 *         required: true
 *         description: Cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: New quantity (0 to remove)
 *     responses:
 *       200:
 *         description: Cart item updated or removed
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart item not found
 */
router.patch('/:cartItemId', auth, async (req: Request, res: Response) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ message: 'quantity must be >= 0' });
    }

    const updatedItem = await updateCartItemQuantity(String(req.params.cartItemId), quantity);
    res.json(updatedItem || { message: 'Item removed from cart' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /cart/{cartItemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartItemId
 *         schema:
 *           type: string
 *         required: true
 *         description: Cart item ID
 *     responses:
 *       200:
 *         description: Item removed from cart
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart item not found
 */
router.delete('/:cartItemId', auth, async (req: Request, res: Response) => {
  try {
    const result = await removeFromCart(String(req.params.cartItemId));
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /cart:
 *   delete:
 *     summary: Clear entire cart for user
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 *       401:
 *         description: Unauthorized
 */
router.delete('/', auth, async (req: Request, res: Response) => {
  try {
    const result = await clearCart(req.user!.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
