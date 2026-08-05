import { Router, Request, Response } from "express";
import { VideoSectionSettings } from "../models";

const router = Router();

// GET video section settings (public)
router.get("/", async (req: Request, res: Response) => {
  try {
    const settings = await VideoSectionSettings.findOne();
    if (!settings) {
      return res.status(404).json({ message: "No settings found" });
    }
    return res.json(settings);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT video section settings (admin update)
router.put("/", async (req: Request, res: Response) => {
  try {
    let settings = await VideoSectionSettings.findOne();
    if (!settings) {
      settings = await VideoSectionSettings.create(req.body);
    } else {
      await settings.update(req.body);
    }
    return res.json(settings);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
