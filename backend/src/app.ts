import express, { Request } from 'express';
import authRoutes from './routes/auth.route';
import categoriesRoutes from './routes/categories.route';
import fileRoutes from "./routes/file.routes"
import productRoutes from "./routes/products.route"
import socialRoutes from "./routes/social.route"
import colorRoutes from "./routes/colors.route"
import usersRoutes from "./routes/users.route"
import cartRoutes from "./routes/cart.route"
import commandeRoutes from "./routes/commande.route"
import paymentRoutes from "./routes/payment.route"
import blogRoutes from "./routes/blog.route"
import heroSlidesRoutes from "./routes/heroSlides.route"
import promotionsRoutes from "./routes/promotions.route"
import stylesRoutes from "./routes/styles.route"
import joolanRoutes from "./routes/joolan.route"
import cors from 'cors';
import path from 'path';
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { getProductById } from "./services/product.service";
import { getCategoryById } from "./services/categories.service";

const app = express();
const version = process.env.API_VERSION || 'v1'
app.use(express.json());
app.use(cors()); // <-- This allows all origins *

app.use(
  "/public",
  express.static(path.join(__dirname, "public"), {
    etag: true,
    lastModified: true,
    setHeaders: (res) => {
      // Force browser revalidation so image updates from admin are reflected quickly.
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    },
  })
);
// Routes
app.use(`/api/${version}/auth`, authRoutes);
app.use(`/api/${version}/categories`, categoriesRoutes);
app.use(`/api/${version}/files`, fileRoutes)
app.use(`/api/${version}/products`, productRoutes)
app.use(`/api/${version}/social`, socialRoutes)
app.use(`/api/${version}/colors`, colorRoutes)
app.use(`/api/${version}/users`, usersRoutes)
app.use(`/api/${version}/cart`, cartRoutes)
app.use(`/api/${version}/commandes`, commandeRoutes)
app.use(`/api/${version}/payment`, paymentRoutes)
app.use(`/api/${version}/blogs`, blogRoutes)
app.use(`/api/${version}/hero-slides`, heroSlidesRoutes)
app.use(`/api/${version}/promotions`, promotionsRoutes)
app.use(`/api/${version}/styles`, stylesRoutes)
app.use(`/api/${version}/joolan`, joolanRoutes)

// Backward-compatible mounts (non-versioned)
app.use("/products", productRoutes);
app.use("/blogs", blogRoutes);
app.use("/blog", blogRoutes); // Also mount at /blog for public access
app.use("/promotions", promotionsRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Public slugs at site root (ONLY at root level, not in /api paths)
// This must come AFTER all API routes
app.get("/:slug([a-z0-9]+(?:-[a-z0-9]+)*)", async (req: Request<{ slug: string }>, res, next) => {
  try {
    const product = await getProductById(req.params.slug);
    return res.json(product);
  } catch {
    try {
      const category = await getCategoryById(req.params.slug);
      return res.json(category);
    } catch {
      return next();
    }
  }
});

export default app;
