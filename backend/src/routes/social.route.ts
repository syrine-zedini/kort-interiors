import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = Router();

const INSTAGRAM_HANDLE = 'kort.interiors';
const SCRAPECREATORS_KEY = process.env.SCRAPECREATORS_API_KEY ?? '';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 heure

/* Post normalisé retourné au frontend */
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

let cache: CacheEntry | null = null;

/**
 * GET /api/v1/social/instagram
 * Retourne 5 posts récents via ScrapeCreators (profil public, pas de token Meta requis).
 * Utilise curl pour contourner le TLS fingerprinting du VPS.
 */
router.get('/instagram', async (_req: Request, res: Response) => {
  const apiKey = SCRAPECREATORS_KEY;

  if (!apiKey) {
    return res.status(503).json({ message: 'SCRAPECREATORS_API_KEY non configuré.' });
  }

  /* Retourner le cache si encore valide */
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return res.json({ data: cache.data, cached: true });
  }

  try {
    const url = `https://api.scrapecreators.com/v2/instagram/user/posts?handle=${INSTAGRAM_HANDLE}`;

    const { stdout } = await execAsync(
      `curl -s --max-time 15 -H "x-api-key: ${apiKey}" "${url}"`
    );

    const json = JSON.parse(stdout) as { data?: { items?: any[] }; items?: any[] };

    /* ScrapeCreators v2 retourne data.items ou items selon la version */
    const raw: any[] = json?.data?.items ?? json?.items ?? [];

    /* Prendre les 6 posts les plus récents directement dans l'ordre chronologique */
    const posts: InstagramPost[] = raw
      .filter((p: any) => p.media_type !== 2)
      .slice(0, 6)
      .map((p: any) => ({
        id: String(p.id ?? p.pk ?? ''),
        media_url: p.image_versions2?.candidates?.[0]?.url
          ?? p.display_url
          ?? p.thumbnail_url
          ?? '',
        thumbnail_url: p.image_versions2?.candidates?.[1]?.url ?? undefined,
        permalink: p.code
          ? `https://www.instagram.com/p/${p.code}/`
          : `https://www.instagram.com/${INSTAGRAM_HANDLE}/`,
        caption: p.caption?.text ?? p.edge_media_to_caption?.edges?.[0]?.node?.text ?? undefined,
        media_type: p.media_type === 8 ? 'CAROUSEL_ALBUM' : 'IMAGE',
        timestamp: p.taken_at
          ? new Date(p.taken_at * 1000).toISOString()
          : new Date().toISOString(),
      }));

    cache = { data: posts, fetchedAt: Date.now() };
    return res.json({ data: posts, cached: false });

  } catch (err: any) {
    console.error('[ScrapeCreators error]', err.message);
    if (cache) return res.json({ data: cache.data, cached: true, stale: true });
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

export default router;
