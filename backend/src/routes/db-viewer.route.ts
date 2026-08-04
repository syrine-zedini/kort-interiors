import { Router } from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/sequelize';
import { adminAuth } from '../middleware/adminAuth';
import { Product } from '../models/product.model';
import { ProductCategory } from '../models/product_categories.model';
import { ProductVariant } from '../models/product_variant';
import { ProductItem } from '../models/product_item.model';
import { generateSlug } from '../helpers/slug';
import * as joolanService from '../services/joolan.service';

const router = Router();

// ── Local categories flat list (for dropdowns) ───────────────────────────────
// Must be declared BEFORE the /:table wildcard or Express will never reach it.

router.get('/local-categories', async (req, res) => {
  try {
    const cats = await ProductCategory.findAll({
      include: [
        { model: ProductCategory, as: 'parents', attributes: ['id'], through: { attributes: [] }, required: false },
      ],
      attributes: ['id', 'name', 'slug'],
      order: [['name', 'ASC']],
    });
    res.json(cats.map(c => ({
      id: String(c.id),
      name: c.name,
      slug: (c as any).slug ?? '',
      parentIds: ((c as any).parents ?? []).map((p: any) => String(p.id)),
    })));
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/debug-db', async (req, res) => {
  try {
    const productsColumns = await sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products'",
      { type: QueryTypes.SELECT }
    );
    const promotionsColumns = await sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'promotions'",
      { type: QueryTypes.SELECT }
    );
    
    // Also fetch sample product
    const sampleProduct = await Product.findOne({
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      productsColumns,
      promotionsColumns,
      sampleProduct
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const ALLOWED_TABLES: Record<string, string> = {
  products: 'products',
  product_categories: 'product_categories',
  product_category_hierarchy: 'product_category_hierarchy',
  product_items: 'product_items',
  product_variants: 'product_variants',
  colors: 'colors',
  users: 'users',
  commandes: 'commandes',
  commande_items: 'commande_items',
  blogs: 'blogs',
  promotions: 'promotions',
  hero_slides: 'hero_slides',
  styles: 'styles',
  cart_items: 'cart_items',
  oopos_product_photos: 'oopos_product_photos',
};

router.get('/:table', adminAuth, async (req, res) => {
  const table = ALLOWED_TABLES[String(req.params.table)];
  if (!table) {
    return res.status(400).json({ message: `Table non autorisée : ${req.params.table}` });
  }
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Number(req.query.offset) || 0;
  try {
    let rows: any[];
    try {
      rows = await sequelize.query(
        `SELECT * FROM "${table}" ORDER BY "createdAt" DESC NULLS LAST LIMIT :limit OFFSET :offset`,
        { replacements: { limit, offset }, type: QueryTypes.SELECT }
      );
    } catch {
      rows = await sequelize.query(
        `SELECT * FROM "${table}" LIMIT :limit OFFSET :offset`,
        { replacements: { limit, offset }, type: QueryTypes.SELECT }
      );
    }
    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) as total FROM "${table}"`,
      { type: QueryTypes.SELECT }
    ) as any[];
    res.json({ table, total: Number(countResult.total), rows });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ── Local Product CRUD (PostgreSQL only, no OOPOS) ──────────────────────────

router.post('/local-products', adminAuth, async (req, res) => {
  const { 
    code, name, price, description, images, categoryId, discount, colors, sizes, styles, visible,
    details, isDetailsEnabled, manualVariants, sizePricing, sizeMaterialPricing, variants, items
  } = req.body;
  if (!code || !name || !description) return res.status(400).json({ message: 'code, name et description sont requis' });
  try {
    let finalCategoryId = categoryId || null;
    if (finalCategoryId && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(finalCategoryId)) {
      let cat = await ProductCategory.findOne({ where: { slug: finalCategoryId } });
      if (!cat) {
        cat = await ProductCategory.create({ name: finalCategoryId, slug: finalCategoryId } as any);
      }
      finalCategoryId = cat.id;
    }

    const slug = `${generateSlug(name)}-${Date.now()}`;
    const product = await Product.create({
      code: String(code).trim(),
      name: String(name).trim(),
      price: price != null ? Number(price) : undefined,
      discount: discount != null ? Number(discount) : undefined,
      description: description ? String(description).trim() : undefined,
      images: Array.isArray(images) ? images : [],
      colors: Array.isArray(colors) ? colors : [],
      sizes: Array.isArray(sizes) ? sizes : [],
      styles: Array.isArray(styles) ? styles : [],
      visible: visible === true || visible === 'true',
      categoryId: finalCategoryId,
      slug,
      productType: 1,
      details: Array.isArray(details) ? details : [],
      isDetailsEnabled: isDetailsEnabled === true || isDetailsEnabled === 'true',
      manualVariants: Boolean(manualVariants),
      sizePricing: typeof sizePricing === 'object' ? sizePricing : undefined,
      sizeMaterialPricing: typeof sizeMaterialPricing === 'object' ? sizeMaterialPricing : undefined,
    } as any);

    // Save variants if provided
    if (Array.isArray(variants) && variants.length > 0) {
      await ProductVariant.bulkCreate(variants.map(v => ({
        ...v,
        id: undefined,
        productId: product.id,
      })));
    }

    // Save items if provided
    if (Array.isArray(items) && items.length > 0) {
      await ProductItem.bulkCreate(items.map(i => ({
        ...i,
        id: undefined,
        productId: product.id,
      })));
    }

    res.status(201).json(product);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/local-products/:id', adminAuth, async (req, res) => {
  const product = await Product.findByPk(String(req.params.id));
  if (!product) return res.status(404).json({ message: 'Produit introuvable' });
  const { code, name, price, description, images, categoryId, discount, colors, sizes, styles, visible, details, isDetailsEnabled, sizePricing, sizeMaterialPricing, manualVariants, variants, items } = req.body;
  if (name !== undefined) product.name = name;
  if (code !== undefined) product.code = code;
  if (price !== undefined) {
    const parsedPrice = Number(price);
    product.price = isNaN(parsedPrice) ? 0 : parsedPrice;
  }
  if (discount !== undefined) {
    const parsedDiscount = Number(discount);
    product.discount = isNaN(parsedDiscount) ? 0 : parsedDiscount;
  }
  if (description !== undefined) product.description = description;
  if (images !== undefined) product.images = images;
  if (colors !== undefined) (product as any).colors = Array.isArray(colors) ? colors : [];
  if (sizes !== undefined) (product as any).sizes = Array.isArray(sizes) ? sizes : [];
  if (styles !== undefined) (product as any).styles = Array.isArray(styles) ? styles : [];
  if (visible !== undefined) (product as any).visible = Boolean(visible);
  if (details !== undefined) (product as any).details = Array.isArray(details) ? details : [];
  if (isDetailsEnabled !== undefined) (product as any).isDetailsEnabled = Boolean(isDetailsEnabled);
  if (sizePricing !== undefined) {
    (product as any).sizePricing = typeof sizePricing === 'object' ? sizePricing : null;
    product.changed('sizePricing', true);
  }
  if (sizeMaterialPricing !== undefined) {
    (product as any).sizeMaterialPricing = typeof sizeMaterialPricing === 'object' ? sizeMaterialPricing : null;
    product.changed('sizeMaterialPricing', true);
  }
  if (manualVariants !== undefined) (product as any).manualVariants = Boolean(manualVariants);
  if (categoryId !== undefined) {
    if (categoryId && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(categoryId)) {
      let cat = await ProductCategory.findOne({ where: { slug: categoryId } });
      if (!cat) {
        cat = await ProductCategory.create({ name: categoryId, slug: categoryId } as any);
      }
      (product as any).categoryId = cat.id;
    } else {
      (product as any).categoryId = categoryId || null;
    }
  }
  await product.save();

  // Sync variants if provided
  if (variants !== undefined) {
    await ProductVariant.destroy({ where: { productId: product.id } });
    if (Array.isArray(variants) && variants.length > 0) {
      await ProductVariant.bulkCreate(variants.map(v => ({ ...v, id: undefined, productId: product.id })));
    }
  }

  // Sync items if provided
  if (items !== undefined) {
    await ProductItem.destroy({ where: { productId: product.id } });
    if (Array.isArray(items) && items.length > 0) {
      await ProductItem.bulkCreate(items.map(i => ({ ...i, id: undefined, productId: product.id })));
    }
  }

  res.json(product);
});

router.delete('/local-products/:id', adminAuth, async (req, res) => {
  const product = await Product.findByPk(String(req.params.id));
  if (!product) return res.status(404).json({ message: 'Produit introuvable' });
  await product.destroy();
  res.json({ message: 'Supprimé' });
});

router.patch('/local-products/:id/visible', adminAuth, async (req, res) => {
  const product = await Product.findByPk(String(req.params.id));
  if (!product) return res.status(404).json({ message: 'Produit introuvable' });
  (product as any).visible = !(product as any).visible;
  await product.save();
  res.json({ id: product.id, visible: (product as any).visible });
});

// ── Sync categories from OOPOS → PostgreSQL ─────────────────────────────────

router.post('/sync-categories', adminAuth, async (req, res) => {
  try {
    // 1. Get OOPOS catalogue (uses existing cached service)
    const ooposResponse = await joolanService.getCatalogueWeb({ 'output-format': 'json' });
    const raw = Array.isArray(ooposResponse)
      ? ooposResponse
      : Array.isArray(ooposResponse?.data) ? ooposResponse.data : [];

    const isActif = (p: any) => {
      const v = p.Actif ?? p.actif;
      return v === 1 || v === '1' || v === true;
    };

    const RAYONS = new Set([
      'ACCESSOIRES,DECORATION', 'ART DE TABLE', 'LINGE DE BAIN',
      'LINGE DE LIT', 'LINGE DE TABLE', 'LITERIE',
    ]);

    // Build structure: rayon → famille → Set<sousFamille>
    const structure = new Map<string, Map<string, Set<string>>>();
    for (const p of raw.filter(isActif)) {
      const rayon = (p.Rayon || '').trim();
      if (!rayon || !RAYONS.has(rayon)) continue;
      const rawF = (p.Famille || '').trim();
      const famille = rawF !== rayon ? rawF : '';
      if (!famille) continue;
      const sousFamille = (p.SousFamille || '').trim();

      if (!structure.has(rayon)) structure.set(rayon, new Map());
      const fm = structure.get(rayon)!;
      if (!fm.has(famille)) fm.set(famille, new Set());
      if (sousFamille) fm.get(famille)!.add(sousFamille);
    }

    // 2. Clear existing hierarchy then categories
    await sequelize.query('DELETE FROM product_category_hierarchy', { type: QueryTypes.DELETE });
    await sequelize.query('DELETE FROM product_categories', { type: QueryTypes.DELETE });

    // 3. Helper: get or create category by name (handles duplicates)
    const nameMap = new Map<string, string>(); // name → uuid
    const usedSlugs = new Set<string>();

    const getOrCreate = async (name: string): Promise<string> => {
      if (nameMap.has(name)) return nameMap.get(name)!;
      const base = generateSlug(name);
      let slug = base;
      let i = 2;
      while (usedSlugs.has(slug)) slug = `${base}-${i++}`;
      usedSlugs.add(slug);
      const cat = await ProductCategory.create({ name, slug } as any);
      nameMap.set(name, String(cat.id));
      return String(cat.id);
    };

    const link = async (parentId: string, childId: string) => {
      await sequelize.query(
        'INSERT INTO product_category_hierarchy ("parentId", "childId", "createdAt", "updatedAt") VALUES (:parentId, :childId, NOW(), NOW())',
        { replacements: { parentId, childId }, type: QueryTypes.INSERT }
      );
    };

    // 4. Insert rayons → familles → sous-familles
    let created = 0;
    for (const [rayonName, familles] of structure) {
      const rayonId = await getOrCreate(rayonName); created++;
      for (const [familleName, subs] of familles) {
        const familleId = await getOrCreate(familleName); created++;
        await link(rayonId, familleId);
        for (const subName of subs) {
          const subId = await getOrCreate(subName); created++;
          await link(familleId, subId);
        }
      }
    }

    res.json({ success: true, created, message: `${created} catégories synchronisées depuis OOPOS` });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
