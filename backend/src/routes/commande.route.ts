import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { placeOrder } from '../services/commande.service';
import { Commande } from '../models/commande.model';
import { CommandeItem } from '../models/commande_item.model';
import { User } from '../models/user.model';
import { Product } from '../models/product.model';

const router = Router();

// GET /api/v1/commandes/me — Get user's orders
router.get('/me', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });
    const commandes = await Commande.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: CommandeItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'images'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(commandes);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/v1/commandes — Admin: list all orders
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const commandes = await Commande.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email'],
        },
        {
          model: CommandeItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'images'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(commandes);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/v1/commandes/:id/status — Admin: update order status
router.patch('/:id/status', auth, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const commande = await Commande.findByPk(String(req.params.id));
    if (!commande) return res.status(404).json({ message: 'Commande not found' });
    await commande.update({ status });
    res.json(commande);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/v1/commandes/:id/tracking — Admin: update order tracking number
router.patch('/:id/tracking', auth, async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.body;
    const commande = await Commande.findByPk(String(req.params.id));
    if (!commande) return res.status(404).json({ message: 'Commande not found' });
    await commande.update({ trackingNumber });
    res.json(commande);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/v1/commandes — Place a new order from user's cart
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { shippingAddress, billingAddress, paymentMethod } = req.body;
    const commande = await placeOrder(req.user.id, shippingAddress, billingAddress, paymentMethod);
    res.status(201).json(commande);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
