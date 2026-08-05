import { Router, Request, Response } from "express";
import { PromoModalSettings } from "../models";

const router = Router();

// GET settings (publicly accessible by frontend)
router.get("/", async (req: Request, res: Response) => {
  try {
    const settings = await PromoModalSettings.findOne();
    if (!settings) {
      return res.status(404).json({ message: "No settings found" });
    }
    return res.json(settings);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT settings (used by admin dashboard)
router.put("/", async (req: Request, res: Response) => {
  try {
    let settings = await PromoModalSettings.findOne();
    if (!settings) {
      // Fallback fallback if somehow not seeded
      settings = await PromoModalSettings.create(req.body);
    } else {
      await settings.update(req.body);
    }
    return res.json(settings);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
