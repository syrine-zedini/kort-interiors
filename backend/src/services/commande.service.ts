import { Commande } from '../models/commande.model';
import { CommandeItem } from '../models/commande_item.model';
import { CartItem } from '../models/cart_item.model';
import { User } from '../models/user.model';
import { calculateCartTotals } from './cart.service';
import { sequelize } from '../config/sequelize';

export const placeOrder = async (
  userId: string,
  shippingAddress?: any,
  billingAddress?: any,
  paymentMethod?: string
) => {
  // Validate required fields
  if (!shippingAddress) {
    throw new Error('Shipping address is required');
  }

  // Fetch user and validate phone number
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }
  if (!user.phoneNumber) {
    throw new Error('Phone number is required');
  }

  // Get cart items and totals
  const cartItems = await CartItem.findAll({ where: { userId } });
  if (cartItems.length === 0) {
    throw new Error('Cart is empty');
  }

  const totals = await calculateCartTotals(userId);

  // Start transaction
  const transaction = await sequelize.transaction();

  try {
    // 1. Create Commande
    const commande = await Commande.create(
      {
        userId,
        status: 'pending',
        totalAmount: totals.grandTotal,
        shippingAddress,
        billingAddress,
        paymentMethod,
        paymentStatus: 'unpaid',
      },
      { transaction }
    );

    // 2. Create CommandeItems and deduct stock
    const commandeItemsData = cartItems.map((item) => ({
      commandeId: commande.id,
      productId: item.productId,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
    }));

    await CommandeItem.bulkCreate(commandeItemsData, { transaction });

    // 3. Clear Cart
    await CartItem.destroy({ where: { userId }, transaction });

    await transaction.commit();

    return commande;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
