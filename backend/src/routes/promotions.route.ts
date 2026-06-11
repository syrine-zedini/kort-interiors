import { Router } from "express";
import {
  createPromotion,
  deletePromotion,
  getPromotionFiltersOptions,
  getPromotions,
  updatePromotion,
} from "../services/promotion.service";

const router = Router();

router.get("/options", async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const data = await getPromotionFiltersOptions(search);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/", async (_req, res) => {
  try {
    const promotions = await getPromotions();
    res.json(promotions);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const promotion = await createPromotion(req.body);
    res.status(201).json(promotion);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const promotion = await updatePromotion(req.params.id, req.body);
    res.json(promotion);
  } catch (err: any) {
    if (err.message === "Promotion non trouvée") {
      return res.status(404).json({ message: err.message });
    }
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await deletePromotion(req.params.id);
    res.json(result);
  } catch (err: any) {
    if (err.message === "Promotion non trouvée") {
      return res.status(404).json({ message: err.message });
    }
    res.status(400).json({ message: err.message });
  }
});

export default router;
