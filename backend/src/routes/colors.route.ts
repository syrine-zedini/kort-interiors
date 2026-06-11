import { Router } from 'express';
import { Color } from '../models/color.model';

const router = Router();

// GET /colors
router.get('/', async (_req, res) => {
    try {
        const colors = await Color.findAll({ order: [['nameFr', 'ASC']] });
        res.json(colors);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// POST /colors
router.post('/', async (req, res) => {
    try {
        const { nameFr, hex } = req.body;
        if (!nameFr || !hex) return res.status(400).json({ message: 'nameFr and hex are required' });
        const color = await Color.create({ nameFr, hex });
        res.status(201).json(color);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /colors/:id
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Color.destroy({ where: { id: req.params.id } });
        if (!deleted) return res.status(404).json({ message: 'Color not found' });
        res.json({ message: 'Deleted' });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
