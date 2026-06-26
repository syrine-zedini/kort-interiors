import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { placeOrder } from '../services/commande.service';
import { Commande } from '../models/commande.model';
import { CommandeItem } from '../models/commande_item.model';
import { User } from '../models/user.model';
import { Product } from '../models/product.model';
import { getProductById } from '../services/product.service';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (s?: string | null) => !!s && UUID_RE.test(s);

async function enrichCommandeItems(commandes: any[]): Promise<any[]> {
  // Collect all unique productIds across all orders
  const allItems = commandes.flatMap((c: any) => c.items ?? []);
  const localIds = [...new Set(allItems.map((i: any) => i.productId).filter(isUUID))];
  const ooposIds = [...new Set(allItems.map((i: any) => i.productId).filter((id: string) => !isUUID(id)))];

  // Fetch local products
  const localProducts = localIds.length > 0
    ? await Product.findAll({ where: { id: localIds }, attributes: ['id', 'name', 'images'] })
    : [];
  const productMap = new Map(localProducts.map((p: any) => [p.id, p.toJSON()]));

  // Fetch OOPOS products
  await Promise.all(ooposIds.map(async (pid: string) => {
    try {
      const p = await getProductById(pid);
      productMap.set(pid, { id: p.id, name: (p as any).name, images: (p as any).images ?? [] });
    } catch { /* not found */ }
  }));

  return commandes.map((c: any) => ({
    ...c.toJSON ? c.toJSON() : c,
    items: (c.items ?? []).map((item: any) => ({
      ...(item.toJSON ? item.toJSON() : item),
      product: productMap.get(item.productId) ?? null,
    })),
  }));
}

const router = Router();

// GET /api/v1/commandes/me — Get user's orders
router.get('/me', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });
    const commandes = await Commande.findAll({
      where: { userId: req.user.id },
      include: [{ model: CommandeItem, as: 'items' }],
      order: [['createdAt', 'DESC']],
    });
    res.json(await enrichCommandeItems(commandes));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/v1/commandes — Admin: list all orders
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const commandes = await Commande.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
        { model: CommandeItem, as: 'items' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(await enrichCommandeItems(commandes));
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

// POST /api/v1/commandes — Place a new order (sent directly to OOPOS)
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { shippingAddress, billingAddress, paymentMethod } = req.body;
    const result = await placeOrder(req.user.id, shippingAddress, billingAddress, paymentMethod);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
