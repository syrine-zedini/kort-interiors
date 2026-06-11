import { Router } from 'express';
import {
    getAllCategoriesWithChildren,
    getCategoryById,
    createCategory,
    renameCategory,
    updateCategoryBanner,
    deleteCategory,
    addChildToParent,
    removeChildFromParent,
} from '../services/categories.service';
import { authorize } from '../middleware/authorize';

const router = Router();

// GET /categories  — full tree with product counts

router.get('/', async (req, res) => {
    try {
        const result = await getAllCategoriesWithChildren();
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

// GET /categories/:id
router.get('/:id', async (req, res) => {
    try {
        const cat = await getCategoryById(req.params.id);
        res.json(cat);
    } catch (err: any) {
        res.status(404).json({ message: err.message });
    }
});

// POST /categories  — body: { name, parentId? }
router.post('/', async (req, res) => {
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
router.put('/:id', async (req, res) => {
    try {
        const { name, banner } = req.body;

        // If neither name nor banner is provided
        if (!name && banner === undefined) {
            return res.status(400).json({ message: 'name or banner is required' });
        }

        let result;

        // Update name if provided
        if (name) {
            result = await renameCategory(req.params.id, name);
        }

        // Update banner if provided
        if (banner !== undefined) {
            result = await updateCategoryBanner(req.params.id, banner);
        }

        res.json(result);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /categories/:id
// body: { moveProductsTo?: string | null, deleteChildren?: boolean }
router.delete('/:id', async (req, res) => {
    try {
        const { moveProductsTo, deleteChildren } = req.body;
        const result = await deleteCategory(
            req.params.id,
            moveProductsTo ?? null,
            deleteChildren === true
        );
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

// POST /categories/:parentId/children/:childId  — link existing child to a parent
router.post('/:parentId/children/:childId', async (req, res) => {
    try {
        const result = await addChildToParent(req.params.parentId, req.params.childId);
        res.status(201).json(result);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /categories/:parentId/children/:childId  — unlink (child becomes top-level)
router.delete('/:parentId/children/:childId', async (req, res) => {
    try {
        const result = await removeChildFromParent(req.params.parentId, req.params.childId);
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
