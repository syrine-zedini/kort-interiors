import { Router } from "express";
import {
    getAllHeroSlides,
    getHeroSlideById,
    createHeroSlide,
    updateHeroSlide,
    deleteHeroSlide,
} from "../services/heroSlide.service";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Hero Slides
 *   description: Manage hero section slides
 */

/**
 * @swagger
 * /hero-slides:
 *   post:
 *     summary: Create a new hero slide
 *     tags: [Hero Slides]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               eyebrow:
 *                 type: string
 *                 example: "Nouvelle Collection"
 *               title:
 *                 type: string
 *                 example: "L'art du linge de maison"
 *               subtitle:
 *                 type: string
 *                 example: "Des matières nobles, des couleurs intemporelles."
 *               bg:
 *                 type: string
 *                 example: "#0e0d0c"
 *               cta:
 *                 type: string
 *                 example: "Découvrir la collection"
 *               image:
 *                 type: string
 *                 example: "/assets/imgs/products/article_1.jpg"
 *               sortOrder:
 *                 type: integer
 *                 example: 0
 *     responses:
 *       201:
 *         description: Hero slide created successfully
 *       400:
 *         description: Bad request
 */
router.post("/", async (req, res) => {
    try {
        const slide = await createHeroSlide(req.body);
        res.status(201).json(slide);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @swagger
 * /hero-slides:
 *   get:
 *     summary: Get all hero slides
 *     tags: [Hero Slides]
 *     responses:
 *       200:
 *         description: List of all hero slides ordered by sortOrder
 */
router.get("/", async (req, res) => {
    try {
        const slides = await getAllHeroSlides();
        res.json(slides);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @swagger
 * /hero-slides/{id}:
 *   get:
 *     summary: Get a hero slide by ID
 *     tags: [Hero Slides]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Hero slide UUID
 *     responses:
 *       200:
 *         description: Hero slide details
 *       404:
 *         description: Hero slide not found
 */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const slide = await getHeroSlideById(id);

        if (!slide) {
            return res.status(404).json({ message: "Slide héroïque non trouvée" });
        }

        res.json(slide);
    } catch (err: any) {
        console.error("Error fetching hero slide:", err);
        res.status(500).json({ message: "Erreur serveur: " + err.message });
    }
});

/**
 * @swagger
 * /hero-slides/{id}:
 *   put:
 *     summary: Update a hero slide
 *     tags: [Hero Slides]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Hero slide UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eyebrow:
 *                 type: string
 *               title:
 *                 type: string
 *               subtitle:
 *                 type: string
 *               bg:
 *                 type: string
 *               cta:
 *                 type: string
 *               image:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Hero slide updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Hero slide not found
 */
router.put("/:id", async (req, res) => {
    try {
        const slide = await updateHeroSlide(req.params.id, req.body);
        res.json(slide);
    } catch (err: any) {
        if (err.message === "Slide héroïque non trouvée") {
            return res.status(404).json({ message: err.message });
        }
        res.status(400).json({ message: err.message });
    }
});

/**
 * @swagger
 * /hero-slides/{id}:
 *   delete:
 *     summary: Delete a hero slide
 *     tags: [Hero Slides]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Hero slide UUID
 *     responses:
 *       200:
 *         description: Hero slide deleted successfully
 *       404:
 *         description: Hero slide not found
 */
router.delete("/:id", async (req, res) => {
    try {
        await deleteHeroSlide(req.params.id);
        res.json({ message: "Slide héroïque supprimée avec succès" });
    } catch (err: any) {
        if (err.message === "Slide héroïque non trouvée") {
            return res.status(404).json({ message: err.message });
        }
        res.status(400).json({ message: err.message });
    }
});

export default router;
