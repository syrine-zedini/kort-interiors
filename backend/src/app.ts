import express, { Request, Response, NextFunction } from 'express';
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
import clictopayRoutes from "./routes/clictopay.route"
import blogRoutes from "./routes/blog.route"
import heroSlidesRoutes from "./routes/heroSlides.route"
import promotionsRoutes from "./routes/promotions.route"
import stylesRoutes from "./routes/styles.route"
import joolanRoutes from "./routes/joolan.route"
import dbViewerRoutes from "./routes/db-viewer.route"
import settingsRoutes from "./routes/settings.route"
import ooposTicketStatusRoutes from "./routes/oopos-ticket-status.route"
import { loadSiteSettings } from "./config/siteSettings"
import cors from 'cors';
import path from 'path';
import axios from 'axios';
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { getProductById } from "./services/product.service";
import { getCategoryById } from "./services/categories.service";

loadSiteSettings();

const app = express();
const version = process.env.API_VERSION || 'v1'
app.use(express.json());

// Warn if ALLOWED_ORIGINS is missing in production environment
if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
  console.warn("⚠️ WARNING: ALLOWED_ORIGINS is not defined in production. Using localhost defaults.");
}

app.use(cors({
  origin: (origin, callback) => {
    const originsEnv = process.env.ALLOWED_ORIGINS;
    const allowed = (originsEnv || 'http://localhost:3005,http://localhost:3000')
      .split(',').map(o => o.trim());
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

// Proxy OOPOS product photos — tries several URL patterns so the frontend
// never needs to know about OOPOS auth or internal file naming.
app.get("/oopos-photo/:sku/:n", async (req: Request, res: Response) => {
  const sku = String(req.params.sku);
  const n   = String(req.params.n);
  const domain  = process.env.OOPOS_DOMAIN   || 'caisse.oopos.fr';
  const enseigne = process.env.OOPOS_ENSEIGNE || '';
  const apiKey  = process.env.OOPOS_API_KEY   || '';

  const candidates = [
    `https://${domain}/public/image/${enseigne}/${sku}-${n}.jpg`,
    `https://${domain}/public/image/${enseigne}/${sku}.jpg`,
    `https://${domain}/api/v2/produit-photo.do?enseigne=${encodeURIComponent(enseigne)}&api-key=${encodeURIComponent(apiKey)}&Sku=${encodeURIComponent(sku)}&Photo=${n}`,
  ];

  for (const url of candidates) {
    try {
      const img = await axios.get(url, { responseType: 'arraybuffer', timeout: 8000 });
      if (img.status === 200 && img.data?.byteLength > 0) {
        const ct = img.headers['content-type'] || 'image/jpeg';
        res.setHeader('Content-Type', ct);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(Buffer.from(img.data));
      }
    } catch {
      // try next candidate
    }
  }

  res.status(404).send('Photo not found');
});

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
app.use(`/api/${version}/clictopay`, clictopayRoutes)
app.use(`/api/${version}/blogs`, blogRoutes)
app.use(`/api/${version}/hero-slides`, heroSlidesRoutes)
app.use(`/api/${version}/promotions`, promotionsRoutes)
app.use(`/api/${version}/styles`, stylesRoutes)
app.use(`/api/${version}/joolan`, joolanRoutes)
app.use(`/api/${version}/db-viewer`, dbViewerRoutes)
app.use(`/api/${version}/settings`, settingsRoutes)
app.use(`/api/${version}/oopos-ticket-statuses`, ooposTicketStatusRoutes)

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

// Global Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error Handler]:', err);

  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Internal Server Error'
    : err.message || 'An unexpected error occurred';

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

export default app;
