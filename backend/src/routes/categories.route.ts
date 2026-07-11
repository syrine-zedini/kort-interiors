import { Router } from 'express';
import { getSiteSettings } from '../config/siteSettings';
import { ProductCategory } from '../models/product_categories.model';
import {
    getAllCategoriesWithChildren,
    getLocalCategoriesWithChildren,
    getCategoryById,
    createCategory,
    renameCategory,
    updateCategoryBanner,
    deleteCategory,
    addChildToParent,
    removeChildFromParent,
} from '../services/categories.service';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

// GET /categories  — full tree with product counts

router.get('/', async (req, res) => {
    try {
        const { productSource } = getSiteSettings();
        const result = productSource === 'local'
            ? await getLocalCategoriesWithChildren()
            : await getAllCategoriesWithChildren();
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

// GET /categories/:id
router.get('/:id', async (req, res) => {
    try {
        const cat = await getCategoryById(String(req.params.id));
        res.json(cat);
    } catch (err: any) {
        res.status(404).json({ message: err.message });
    }
});

// POST /categories  — body: { name, parentId? }
router.post('/', adminAuth, async (req, res) => {
    try {
        const { name, parentId } = req.body;
        if (!name) return res.status(400).json({ message: 'name is required' });
        const cat = await createCategory(name, parentId);
        res.status(201).json(cat);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /categories/:id  — body: { name?, banner? }
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const id = String(req.params.id);
        const { name, banner } = req.body;

        // If neither name nor banner is provided
        if (!name && banner === undefined) {
            return res.status(400).json({ message: 'name or banner is required' });
        }

        let result;

        // Update name if provided
        if (name) {
            result = await renameCategory(id, name);
        }

        // Update banner if provided
        if (banner !== undefined) {
            result = await updateCategoryBanner(id, banner);
        }

        res.json(result);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH /categories/:id/visible  — toggle visibility
router.patch('/:id/visible', adminAuth, async (req, res) => {
    try {
        const id = String(req.params.id);
        let cat: ProductCategory | null = await ProductCategory.findByPk(id);
        if (!cat) cat = await ProductCategory.findOne({ where: { slug: id } });
        if (!cat) return res.status(404).json({ message: 'Category not found' });
        (cat as any).visible = !(cat as any).visible;
        await cat.save();
        res.json({ id: cat.id, visible: (cat as any).visible });
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /categories/:id
// body: { moveProductsTo?: string | null, deleteChildren?: boolean }
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const { moveProductsTo, deleteChildren } = req.body;
        const result = await deleteCategory(
            String(req.params.id),
            moveProductsTo ?? null,
            deleteChildren === true
        );
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

// POST /categories/:parentId/children/:childId  — link existing child to a parent
router.post('/:parentId/children/:childId', adminAuth, async (req, res) => {
    try {
        const result = await addChildToParent(String(req.params.parentId), String(req.params.childId));
        res.status(201).json(result);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /categories/:parentId/children/:childId  — unlink (child becomes top-level)
router.delete('/:parentId/children/:childId', adminAuth, async (req, res) => {
    try {
        const result = await removeChildFromParent(String(req.params.parentId), String(req.params.childId));
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
