import { Router } from "express";
import { Style } from "../models";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const styles = await Style.findAll();
        res.json(styles);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const { nameFr } = req.body;
        const style = await Style.create({ nameFr });
        res.status(201).json(style);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const style = await Style.findByPk(req.params.id);
        if (!style) {
            return res.status(404).json({ message: "Style not found" });
        }
        await style.update({ nameFr: req.body.nameFr });
        res.json(style);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const style = await Style.findByPk(req.params.id);
        if (!style) {
            return res.status(404).json({ message: "Style not found" });
        }
        await style.destroy();
        res.json({ message: "Style deleted" });
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
