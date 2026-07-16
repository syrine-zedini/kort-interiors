import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { adminAuth } from '../middleware/adminAuth';

const execAsync = promisify(exec);
const router = Router();

const INSTAGRAM_HANDLE = 'kort.interiors';
const SCRAPECREATORS_KEY = process.env.SCRAPECREATORS_API_KEY ?? '';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:6002';
const PUBLIC_DIR = path.join(__dirname, '../public');
// Cache fichier : survive aux redémarrages du serveur
const CACHE_FILE = path.join(process.cwd(), 'data', 'instagram_cache.json');
// Rafraîchissement automatique toutes les 7 jours (1 crédit / semaine = ~25 mois gratuits)
// Les images, elles, sont téléchargées et hébergées localement (voir downloadImage) car les
// URLs signées du CDN Instagram expirent au bout de ~4-5 jours, avant ce délai.
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface InstagramPost {
  id: string;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  timestamp: string;
}

interface CacheEntry {
  data: InstagramPost[];
  fetchedAt: number;
}

function readCache(): CacheEntry | null {
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch { return null; }
}

function writeCache(entry: CacheEntry) {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(entry));
  } catch {}
}

// Supprime du disque les images locales d'un ancien cache avant de les remplacer.
function deleteLocalImages(posts: InstagramPost[]) {
  for (const p of posts) {
    for (const url of [p.media_url, p.thumbnail_url]) {
      if (url && url.startsWith(`${BACKEND_URL}/public/`)) {
        const filePath = path.join(PUBLIC_DIR, path.basename(url));
        fs.unlink(filePath, () => {});
      }
    }
  }
}

// Télécharge une image distante et la sert depuis notre propre domaine : les URLs signées
// du CDN Instagram expirent avant le TTL du cache, ce qui cassait l'affichage.
async function downloadImage(url: string): Promise<string> {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
  const contentType = String(res.headers['content-type'] || 'image/jpeg');
  const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg';
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  const filename = uuidv4() + ext;
  fs.writeFileSync(path.join(PUBLIC_DIR, filename), Buffer.from(res.data));
  return `${BACKEND_URL}/public/${filename}`;
}

async function fetchFromScrapeCreators(): Promise<InstagramPost[]> {
  const url = `https://api.scrapecreators.com/v2/instagram/user/posts?handle=${INSTAGRAM_HANDLE}`;
  const { stdout } = await execAsync(
    `curl -s --max-time 15 -H "x-api-key: ${SCRAPECREATORS_KEY}" "${url}"`
  );
  const json = JSON.parse(stdout) as any;

  if (json?.success === false) throw new Error(json.message);

  const raw: any[] =
    Array.isArray(json?.collector)   ? json.collector :
    Array.isArray(json?.data?.items) ? json.data.items :
    Array.isArray(json?.items)       ? json.items :
    Array.isArray(json?.data)        ? json.data :
    [];

  const filtered = raw.filter((p: any) => p.media_type !== 2).slice(0, 6);

  return Promise.all(
    filtered.map(async (p: any) => {
      const code = p.code ?? p.shortcode ?? null;
      const remoteUrl = p.image_versions2?.candidates?.[0]?.url ?? p.display_url ?? p.thumbnail_url ?? '';
      let media_url = remoteUrl;
      try {
        if (remoteUrl) media_url = await downloadImage(remoteUrl);
      } catch (err: any) {
        console.error('[ScrapeCreators] image download failed', err.message);
      }
      return {
        id: String(p.id ?? p.pk ?? ''),
        media_url,
        permalink: code ? `https://www.instagram.com/p/${code}/` : `https://www.instagram.com/${INSTAGRAM_HANDLE}/`,
        caption: p.caption?.text ?? p.caption ?? undefined,
        media_type: p.media_type === 8 ? 'CAROUSEL_ALBUM' : 'IMAGE',
        timestamp: p.taken_at ? new Date(p.taken_at * 1000).toISOString() : new Date().toISOString(),
      };
    })
  );
}

/* ── Public: frontend ─────────────────────────────────────── */

router.get('/instagram', async (_req: Request, res: Response) => {
  const cached = readCache();

  // Retourner le cache s'il est encore valide
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return res.json({ data: cached.data, cached: true });
  }

  // Pas de clé → retourner le cache périmé ou vide
  if (!SCRAPECREATORS_KEY) {
    return res.json({ data: cached?.data ?? [] });
  }

  try {
    const posts = await fetchFromScrapeCreators();
    if (posts.length > 0) {
      if (cached) deleteLocalImages(cached.data);
      const entry = { data: posts, fetchedAt: Date.now() };
      writeCache(entry);
      return res.json({ data: posts, cached: false });
    }
    return res.json({ data: cached?.data ?? [] });
  } catch (err: any) {
    console.error('[ScrapeCreators]', err.message);
    // Retourner le cache périmé plutôt que rien
    return res.json({ data: cached?.data ?? [] });
  }
});

/* ── Admin: forcer un rafraîchissement manuel ─────────────── */

router.post('/instagram/refresh', adminAuth, async (_req: Request, res: Response) => {
  if (!SCRAPECREATORS_KEY) return res.status(503).json({ message: 'SCRAPECREATORS_API_KEY manquant' });
  try {
    const posts = await fetchFromScrapeCreators();
    const cached = readCache();
    if (cached) deleteLocalImages(cached.data);
    const entry = { data: posts, fetchedAt: Date.now() };
    writeCache(entry);
    return res.json({ message: `${posts.length} posts récupérés`, data: posts });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
