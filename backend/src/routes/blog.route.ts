import { Router } from "express";
import {
    getAllBlogs,
    getBlogById,
    getBlogBySlug,
    createBlog,
    updateBlog,
    deleteBlog,
} from "../services/blog.service";
import { isUUID } from "../helpers/slug";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Blogs
 *   description: Manage blog posts
 */

/**
 * @swagger
 * /blogs:
 *   post:
 *     summary: Create a new blog post
 *     tags: [Blogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Mon premier article"
 *               slug:
 *                 type: string
 *                 description: Optional - auto-generated from title if not provided
 *                 example: "mon-premier-article"
 *               description:
 *                 type: string
 *                 example: "Description courte de l'article"
 *               content:
 *                 type: string
 *                 example: "Contenu complet de l'article..."
 *               image:
 *                 type: string
 *                 example: "/public/images/blog1.jpg"
 *               author:
 *                 type: string
 *                 example: "Jean Dupont"
 *     responses:
 *       201:
 *         description: Blog post created successfully
 *       400:
 *         description: Bad request
 */
router.post("/", async (req, res) => {
    try {
        const blog = await createBlog(req.body);
        res.status(201).json(blog);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @swagger
 * /blogs:
 *   get:
 *     summary: Get all blog posts
 *     tags: [Blogs]
 *     responses:
 *       200:
 *         description: List of all blog posts
 */
router.get("/", async (req, res) => {
    try {
        const blogs = await getAllBlogs();
        res.json(blogs);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @swagger
 * /blogs/{id}:
 *   get:
 *     summary: Get a blog post by ID or slug
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Blog post UUID or slug
 *     responses:
 *       200:
 *         description: Blog post details
 *       404:
 *         description: Blog post not found
 */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let blog = null;
        
        // If the parameter looks like a UUID, try ID lookup first
        if (isUUID(id)) {
            blog = await getBlogById(id);
        }
        
        // If not found by ID or not a UUID, try by slug
        if (!blog) {
            blog = await getBlogBySlug(id);
        }
        
        if (!blog) {
            return res.status(404).json({ message: "Blog non trouvé" });
        }
        
        res.json(blog);
    } catch (err: any) {
        console.error("Error fetching blog:", err);
        res.status(500).json({ message: "Erreur serveur: " + err.message });
    }
});

/**
 * @swagger
 * /blogs/{id}:
 *   put:
 *     summary: Update a blog post
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Blog post UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *               author:
 *                 type: string
 *     responses:
 *       200:
 *         description: Blog post updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Blog post not found
 */
router.put("/:id", async (req, res) => {
    try {
        const blog = await updateBlog(req.params.id, req.body);
        res.json(blog);
    } catch (err: any) {
        if (err.message === "Blog non trouvé") {
            return res.status(404).json({ message: err.message });
        }
        res.status(400).json({ message: err.message });
    }
});

/**
 * @swagger
 * /blogs/{id}:
 *   delete:
 *     summary: Delete a blog post
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Blog post UUID
 *     responses:
 *       200:
 *         description: Blog post deleted successfully
 *       404:
 *         description: Blog post not found
 */
router.delete("/:id", async (req, res) => {
    try {
        await deleteBlog(req.params.id);
        res.json({ message: "Blog supprimé avec succès" });
    } catch (err: any) {
        if (err.message === "Blog non trouvé") {
            return res.status(404).json({ message: err.message });
        }
        res.status(400).json({ message: err.message });
    }
});

export default router;
