import { Router } from "express";
import {
    createProduct,
    getAllProducts,
    getProductById,
    getProductsByCode,
    updateProduct,
    deleteProduct,
    getProductsByCategoryId,
    addProductItem,
    updateProductItem,
    deleteProductItem,
    addProductVariant,
    updateProductVariant,
    deleteProductVariant,
    getCategoryVariants,
    getLocalCategoryVariants,
} from "../services/product.service";
import { getSiteSettings } from "../config/siteSettings";
import { getMagasinsDisponibles, getProductPosPhotos, setProductPosPhotos } from "../services/joolan.service";
import { ProductCategory } from "../models/product_categories.model";
import { isUUID } from "../helpers/slug";

const router = Router();

// GET  /products/oopos-photos/:code  — retourne les URLs stockées pour ce produit
router.get('/oopos-photos/:code', async (req, res) => {
    try {
        const code = decodeURIComponent(req.params.code);
        const urls = await getProductPosPhotos(code);
        res.json({ product_code: code, photo_urls: urls });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// PUT  /products/oopos-photos/:code  — body: { photo_urls: ["url1", "url2"] }
router.put('/oopos-photos/:code', async (req, res) => {
    try {
        const code = decodeURIComponent(req.params.code);
        const { photo_urls } = req.body;
        if (!Array.isArray(photo_urls)) return res.status(400).json({ error: 'photo_urls must be an array' });
        await setProductPosPhotos(code, photo_urls);
        res.json({ success: true, product_code: code, photo_urls });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * @swagger
 * /products/debug/magasins:
 *   get:
 *     summary: Liste tous les magasins disponibles dans OOPOS (diagnostic)
 *     description: >
 *       Retourne la liste distincte des noms de magasins trouvés dans le
 *       catalogue OOPOS (sans filtre). Utile pour trouver la valeur exacte
 *       à mettre dans la variable OOPOS_MAGASIN du fichier .env.
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Liste des magasins
 */
router.get("/debug/magasins", async (req, res) => {
    try {
        const magasins = await getMagasinsDisponibles();
        const currentMagasin = process.env.OOPOS_MAGASIN || '(non défini)';
        res.json({
            message: "Liste des magasins disponibles dans le catalogue OOPOS",
            currentFilter: currentMagasin,
            magasins,
            tip: magasins.length > 0
                ? `Ajoutez OOPOS_MAGASIN=<nom_du_magasin> dans votre .env puis redémarrez le backend`
                : "Aucun champ Magasin trouvé dans les produits OOPOS"
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});



/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product with automatic variants
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Daisy chanvre"
 *               description:
 *                 type: string
 *                 example: "Nappe lin & coton lavé 150 g/m² imprimé jaune beige"
 *               prices:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [86.0, 90.0]
 *                 description: Table of prices for variants
 *               discounts:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [0, 5]
 *                 description: Table of discounts for variants
 *               sizes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["155x155", "250x250"]
 *               colors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["jaune beige", "vert"]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["/public/image/abc.jpg"]
 *                 description: Default product images
 *               variantImages:
 *                 type: object
 *                 additionalProperties:
 *                   type: array
 *                   items:
 *                     type: string
 *                 description: Mapping color => images for each variant
 *                 example:
 *                   "jaune beige": ["/public/image/jaune1.jpg", "/public/image/jaune2.jpg"]
 *                   "vert": ["/public/image/vert1.jpg"]
 *               categoryId:
 *                 type: string
 *                 example: "728159b4-092c-462f-8484-b5b29e8ae1e1"
 *     responses:
 *       201:
 *         description: Product created with all variants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 productType:
 *                   type: integer
 *                 price:
 *                   type: number
 *                 discount:
 *                   type: number
 *                 sizes:
 *                   type: array
 *                   items:
 *                     type: string
 *                 colors:
 *                   type: array
 *                   items:
 *                     type: string
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 *                 categoryId:
 *                   type: string
 *                 variants:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       size:
 *                         type: string
 *                       color:
 *                         type: string
 *                       price:
 *                         type: number
 *                       discount:
 *                         type: number
 *                       sku:
 *                         type: string
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *       400:
 *         description: Bad request
 */
router.post("/", async (req, res) => {
    try {
        const product = await createProduct(req.body);
        res.status(201).json(product);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products with optional search and filtering
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product code, name, or description
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Filter by color (UUID or name)
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *         description: Filter by size
 *     responses:
 *       200:
 *         description: List of products with variants
 */
router.get("/", async (req, res) => {
    try {
        const search = req.query.search as string | undefined;
        const color = req.query.color as string | undefined;
        const size = req.query.size as string | undefined;
        const showAll = req.query.showAll === 'true' || req.query.showAll === '1';
        const products = await getAllProducts(search, { color, size, showAll });
        res.json(products);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @swagger
 * /products/by-code/{code}:
 *   get:
 *     summary: Get all products with the same code (for color variant selection)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Product code (e.g., TEST56)
 *     responses:
 *       200:
 *         description: Array of products with the same code
 *       404:
 *         description: No products found with this code
 */
router.get("/by-code/:code", async (req, res) => {
    try {
        const showAll = req.query.showAll === 'true' || req.query.showAll === '1';
        const products = await getProductsByCode(req.params.code, showAll);
        res.json(products);
    } catch (err: any) {
        res.status(404).json({ message: err.message });
    }
});

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               discount:
 *                 type: number
 *               sizes:
 *                 type: array
 *                 items:
 *                   type: string
 *               colors:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     price:
 *                       type: number
 *                     discount:
 *                       type: number
 *                     size:
 *                       type: string
 *                     color:
 *                       type: string
 *                     sku:
 *                       type: string
 *     responses:
 *       200:
 *         description: Product updated
 *       400:
 *         description: Bad request
 */
router.put("/:id", async (req, res) => {
    try {
        const product = await updateProduct(req.params.id, req.body);
        res.json(product);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted
 *       400:
 *         description: Error deleting product
 */
router.delete("/:id", async (req, res) => {
    try {
        const result = await deleteProduct(req.params.id);
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});
/**
 * @swagger
 * /products/category/{categoryId}:
 *   get:
 *     summary: Get all products by category ID with variants
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: List of products in the category with variants
 */
router.get("/category/:categoryId", async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { productSource } = getSiteSettings();

        if (isUUID(categoryId)) {
            // UUID always means a truly local category
            const products = await getLocalCategoryVariants(categoryId);
            return res.json(products);
        }

        if (productSource !== 'oopos') {
            // Local/hybrid mode: also check slug in local DB
            const localCat = await ProductCategory.findOne({ where: { slug: categoryId } as any });
            if (localCat) {
                const products = await getLocalCategoryVariants(categoryId);
                return res.json(products);
            }
        }

        const showAll = req.query.showAll === 'true' || req.query.showAll === '1';
        const products = await getProductsByCategoryId(categoryId, showAll);
        res.json(products);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @swagger
 * /products/category/{categoryId}/variants:
 *   get:
 *     summary: Get all products and variants flattened by category ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: List of variants in the category
 */
router.get("/category/:categoryId/variants", async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { productSource } = getSiteSettings();

        // If source is local, always use local DB
        if (productSource === 'local') {
            const products = await getLocalCategoryVariants(categoryId);
            return res.json(products);
        }

        if (isUUID(categoryId)) {
            // UUID always means a truly local category
            const products = await getLocalCategoryVariants(categoryId);
            return res.json(products);
        }

        // In OOPOS mode: slug-based IDs go directly to OOPOS
        if (productSource !== 'oopos') {
            const localCat = await ProductCategory.findOne({ where: { slug: categoryId } as any });
            if (localCat) {
                const products = await getLocalCategoryVariants(categoryId);
                return res.json(products);
            }
        }

        const showAll = req.query.showAll === 'true' || req.query.showAll === '1';
        const products = await getCategoryVariants(categoryId, showAll);
        res.json(products);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @swagger
 * /{id}:
 *   get:
 *     summary: Get a product by UUID or slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product UUID or slug
 *     responses:
 *       200:
 *         description: Product object
 *       404:
 *         description: Product not found
 */
router.get("/:id", async (req, res) => {
    try {
        const product = await getProductById(req.params.id);
        res.json(product);
    } catch (err: any) {
        res.status(404).json({ message: err.message });
    }
});

// ─── Product Items (sub-pieces of a product group) ────────────────────────────

// POST /products/:id/items  — add an item to a product
router.post("/:id/items", async (req, res) => {
    try {
        const item = await addProductItem(req.params.id, req.body);
        res.status(201).json(item);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /products/:id/items/:itemId  — update an item
router.put("/:id/items/:itemId", async (req, res) => {
    try {
        const item = await updateProductItem(req.params.itemId, req.body);
        res.json(item);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /products/:id/items/:itemId  — delete an item
router.delete("/:id/items/:itemId", async (req, res) => {
    try {
        const result = await deleteProductItem(req.params.itemId);
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

// ─── Product Variants (manual) ────────────────────────────────────────────────

// POST /products/:id/variants  — add a variant to a product
router.post("/:id/variants", async (req, res) => {
    try {
        const variant = await addProductVariant(req.params.id, req.body);
        res.status(201).json(variant);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /products/:id/variants/:variantId  — update a variant
router.put("/:id/variants/:variantId", async (req, res) => {
    try {
        const variant = await updateProductVariant(req.params.variantId, req.body);
        res.json(variant);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /products/:id/variants/:variantId  — delete a variant
router.delete("/:id/variants/:variantId", async (req, res) => {
    try {
        const result = await deleteProductVariant(req.params.variantId);
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

export default router;