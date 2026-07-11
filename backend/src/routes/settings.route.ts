import { Router } from 'express';
import { getSiteSettings, updateSiteSettings, ProductSource } from '../config/siteSettings';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

router.get('/', (_req, res) => {
  res.json(getSiteSettings());
});

router.put('/', adminAuth, (req, res) => {
  const { productSource } = req.body;
  if (productSource && !['oopos', 'local'].includes(productSource)) {
    return res.status(400).json({ message: 'productSource doit être "oopos" ou "local"' });
  }
  const updated = updateSiteSettings({ productSource: productSource as ProductSource });
  res.json(updated);
});

export default router;
