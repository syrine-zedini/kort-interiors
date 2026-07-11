import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OOPOS_DOMAIN = process.env.OOPOS_DOMAIN || 'caisse.oopos.fr';
const BASE_URL = `https://${OOPOS_DOMAIN}/api/v2`;
const ENSEIGNE = process.env.OOPOS_ENSEIGNE;
const API_KEY = process.env.OOPOS_API_KEY;
const OOPOS_MAGASIN = process.env.OOPOS_MAGASIN || '';

if (!ENSEIGNE || !API_KEY) {
  console.warn("⚠️ Attention : Les variables OOPOS_ENSEIGNE ou OOPOS_API_KEY sont manquantes dans le fichier .env");
}
if (OOPOS_MAGASIN) {
  console.log(`✅ Filtre magasin actif : OOPOS_MAGASIN="${OOPOS_MAGASIN}"`);
} else {
  console.warn("⚠️ OOPOS_MAGASIN non défini dans .env - tous les produits de l'enseigne seront retournés (sans filtre magasin)");
}

const joolanClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

joolanClient.interceptors.request.use((config) => {
  config.params = config.params || {};
  config.params['enseigne'] = ENSEIGNE;
  config.params['api-key'] = API_KEY;
  return config;
}, (error) => Promise.reject(error));

const genericGet = async (path: string, params: any = {}) => {
  try {
    const response = await joolanClient.get(path, { params });
    return response.data;
  } catch (error: any) {
    console.error(`Erreur GET ${path}:`, error.message);
    throw error;
  }
};

const genericPost = async (path: string, data: any = {}, params: any = {}) => {
  try {
    const response = await joolanClient.post(path, data, { params });
    return response.data;
  } catch (error: any) {
    console.error(`Erreur POST ${path}:`, error.message);
    if (error?.response?.data) {
      console.error(`OOPOS response body:`, JSON.stringify(error.response.data));
    }
    throw error;
  }
};

// ==========================================
// TOUTES LES ROUTES JOOLAN INTEGREES
// ==========================================

// --- Clients ---
export const rechercheClients = (data: any, params: any) => genericPost('/recherche-clients.do', data, params);
export const importClients = (data: any, params: any) => genericPost('/import-clients.do', data, params);

// --- Tickets ---
export const exportTickets = (params: any) => genericGet('/export-tickets.do', params);
export const annulationTicket = (data: any, params: any) => genericPost('/annulation-ticket.do', data, params);
export const getTicketPdf = (params: any) => genericGet('/ticket-pdf.do', params);
export const importTickets = (data: any, params: any) => genericPost('/import-tickets.do', data, params);

// --- Produits ---
export const importProduits = (data: any, params: any) => genericPost('/import-produits.do', data, params);
export const importTarifs = (data: any, params: any) => genericPost('/import-tarifs.do', data, params);
export const importProduitsAssocies = (data: any, params: any) => genericPost('/import-produits-associes.do', data, params);

// --- Mouvements ---
export const importReceptions = (data: any, params: any) => genericPost('/import-receptions.do', data, params);
export const importTransferts = (data: any, params: any) => genericPost('/import-transferts.do', data, params);
export const importBlFournisseur = (data: any, params: any) => genericPost('/import-bl-fournisseur.do', data, params);
export const importCommandesFournisseurs = (data: any, params: any) => genericPost('/import-commandes-fournisseurs.do', data, params);
export const importImageStock = (data: any, params: any) => genericPost('/import-image-stock.do', data, params);

// --- Divers ---
export const importCompteursPassages = (data: any, params: any) => genericPost('/import-compteurs-passages.do', data, params);
export const importFournisseurs = (data: any, params: any) => genericPost('/import-fournisseurs.do', data, params);
export const importMinMax = (data: any, params: any) => genericPost('/import-min-max.do', data, params);
export const importChampsPerso = (data: any, params: any) => genericPost('/import-champs-perso.do', data, params);
export const envoyerMessage = (data: any, params: any) => genericPost('/envoyer-message.do', data, params);
export const runQuery = (data: any, params: any) => genericPost('/query.do', data, params);

// --- Logistique & Négoce ---
export const getLogistique = (params: any) => genericGet('/logistique.do', params);
export const postLogistique = (data: any, params: any) => genericPost('/logistique.do', data, params);
export const postNegoce = (data: any, params: any) => genericPost('/negoce.do', data, params);

// --- Tax-Free & Rapports ---
export const getPlanetPii = (params: any) => genericGet('/planet-pii.do', params);
export const generationRapports = (data: any, params: any) => genericPost('/generation-rapports.do', data, params);

// --- Stocks ---
export const getStock = (params: any) => genericGet('/stock.do', params);
export const getImageStocks = (params: any) => genericGet('/image-stocks.do', params);
export const getImageFullStocks = (params: any) => genericGet('/image-full-stocks.do', params);

// --- Catalogue Web ---
// Cache to avoid exceeding OOPOS hourly API rate limit.
// All calls to catalogue-web.do share the same cached response for 20 minutes.
// After a rate-limit error, retries are blocked for 5 minutes (backoff).
let _catalogueCache: { data: any; ts: number } | null = null;
const CATALOGUE_TTL = 20 * 60 * 1000; // 20 minutes

let _catalogueBackoffUntil = 0;
const CATALOGUE_BACKOFF = 5 * 60 * 1000; // 5 minutes backoff after rate limit

export const getCatalogueWeb = async (params: any) => {
  // Fresh cache — return immediately
  if (_catalogueCache && Date.now() - _catalogueCache.ts < CATALOGUE_TTL) {
    return _catalogueCache.data;
  }
  // Backoff active — OOPOS returned rate limit recently, don't retry yet
  if (Date.now() < _catalogueBackoffUntil) {
    if (_catalogueCache) return _catalogueCache.data;
    return [];
  }
  const finalParams = { ...params };
  if (OOPOS_MAGASIN) {
    finalParams['Magasin'] = OOPOS_MAGASIN;
  }
  try {
    const data = await genericGet('/catalogue-web.do', finalParams);
    if (Array.isArray(data) && data.length > 0) {
      _catalogueCache = { data, ts: Date.now() };
      return data;
    }
    // OOPOS returned error (rate limit, 503, etc.)
    console.warn(`[OOPOS] catalogue-web.do error: ${JSON.stringify(data)?.substring(0, 200)}`);
    _catalogueBackoffUntil = Date.now() + CATALOGUE_BACKOFF;
    if (_catalogueCache) {
      console.warn(`[OOPOS] Using stale cache (${Math.round((Date.now() - _catalogueCache.ts) / 1000)}s old)`);
      return _catalogueCache.data;
    }
    return [];
  } catch (err) {
    _catalogueBackoffUntil = Date.now() + CATALOGUE_BACKOFF;
    if (_catalogueCache) return _catalogueCache.data;
    throw err;
  }
};

export const clearCatalogueCache = () => { _catalogueCache = null; };

/**
 * Récupère la liste de tous les magasins distincts présents dans
 * le catalogue OOPOS. Utile pour diagnostiquer quel nom de magasin
 * utiliser dans OOPOS_MAGASIN.
 */
export const getMagasinsDisponibles = async (): Promise<string[]> => {
  const data = await genericGet('/catalogue-web.do', { 'output-format': 'json' });
  const products = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  const magasins = new Set<string>();
  for (const p of products) {
    const m = p.Magasin || p.magasin;
    if (m) magasins.add(m);
  }
  return Array.from(magasins).sort();
};

// --- Utilitaires ---
export const eanExiste = (params: any) => genericGet('/ean-existe.do', params);

// --- Photos POS (caisse) ---
const _photoCache = new Map<string, { urls: string[]; ts: number }>();
const PHOTO_TTL = 60 * 60 * 1000; // 1h

// Circuit breaker: stop calling query.do when OOPOS is down (503 / socket hang up)
let _queryCircuitOpen = false;
let _queryCircuitOpenedAt = 0;
const QUERY_CIRCUIT_TTL = 10 * 60 * 1000; // 10 minutes

function isQueryAvailable(): boolean {
    if (!_queryCircuitOpen) return true;
    if (Date.now() - _queryCircuitOpenedAt > QUERY_CIRCUIT_TTL) {
        _queryCircuitOpen = false;
        return true;
    }
    return false;
}

function tripQueryCircuit() {
    if (!_queryCircuitOpen) {
        _queryCircuitOpen = true;
        _queryCircuitOpenedAt = Date.now();
    }
}

export function buildCdnUrl(hash: string): string {
    if (!hash || hash.length < 8) return '';
    if (hash.startsWith('http')) return hash;
    // hash may already include extension (e.g. "abc123.jpg") or be a bare MD5
    const name = /\.\w{2,4}$/.test(hash) ? hash : `${hash}.jpg`;
    return `https://${OOPOS_DOMAIN}/smart/cdn/${name}`;
}

export const getProductPosPhotos = async (productCode: string, _sku?: string | number): Promise<string[]> => {
    const cacheKey = productCode;
    const cached = _photoCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < PHOTO_TTL) return cached.urls;

    // 1. Local DB override
    try {
        const { OoposProductPhoto } = await import('../models/oopos_product_photos.model');
        const row = await OoposProductPhoto.findByPk(productCode);
        if (row?.photo_urls?.length) {
            _photoCache.set(cacheKey, { urls: row.photo_urls, ts: Date.now() });
            return row.photo_urls;
        }
    } catch {}

    // If OOPOS query.do is known to be down, skip and cache empty result
    if (!isQueryAvailable()) {
        _photoCache.set(cacheKey, { urls: [], ts: Date.now() });
        return [];
    }

    const esc = productCode.replace(/'/g, "''");

    // Helper: extract non-empty photo hashes from a row
    const extractPhotos = (row: any): string[] =>
        ['Photo1','Photo2','Photo3','Photo4','Photo5','Photo6','Photo7','Photo8']
            .map(k => row[k])
            .filter((v: any) => v && String(v).length > 8)
            .map((h: any) => buildCdnUrl(String(h)));

    const safeQuery = async (sql: string): Promise<any> => {
        try {
            return await runQuery(sql, {});
        } catch (err: any) {
            if (err?.response?.status === 503 || err?.code === 'ECONNRESET' || err?.message?.includes('socket hang up')) {
                tripQueryCircuit();
            }
            return null;
        }
    };

    // 2. catalogue_show
    const res1 = await safeQuery(`SELECT Photo1 FROM catalogue_show WHERE Produit = '${esc}' LIMIT 1`);
    if (res1?.result === 'ok' && Array.isArray(res1?.data) && res1.data.length && res1.data[0].Photo1) {
        const url = buildCdnUrl(String(res1.data[0].Photo1));
        if (url) {
            _photoCache.set(cacheKey, { urls: [url], ts: Date.now() });
            return [url];
        }
    }
    if (!isQueryAvailable()) {
        _photoCache.set(cacheKey, { urls: [], ts: Date.now() });
        return [];
    }

    // 3. produits_couleurs — Photo1-Photo8 per product+color
    const res2 = await safeQuery(
        `SELECT Photo1, Photo2, Photo3, Photo4, Photo5, Photo6, Photo7, Photo8 FROM produits_couleurs WHERE Produit = '${esc}' LIMIT 8`
    );
    if (res2?.result === 'ok' && Array.isArray(res2?.data)) {
        const urls: string[] = [...new Set<string>(res2.data.flatMap(extractPhotos))];
        if (urls.length) {
            _photoCache.set(cacheKey, { urls, ts: Date.now() });
            return urls;
        }
    }
    if (!isQueryAvailable()) {
        _photoCache.set(cacheKey, { urls: [], ts: Date.now() });
        return [];
    }

    // 4. web_catalogues
    const wc = await safeQuery(`SELECT * FROM web_catalogues WHERE Produit = '${esc}' LIMIT 1`);
    if (wc?.result === 'ok' && Array.isArray(wc?.data) && wc.data.length) {
        const urls = extractPhotos(wc.data[0]);
        if (urls.length) {
            _photoCache.set(cacheKey, { urls, ts: Date.now() });
            return urls;
        }
    }

    // Cache the empty result — prevents hammering OOPOS on every request
    _photoCache.set(cacheKey, { urls: [], ts: Date.now() });
    return [];
};

export const setProductPosPhotos = async (productCode: string, photoUrls: string[]): Promise<void> => {
    const { OoposProductPhoto } = await import('../models/oopos_product_photos.model');
    await OoposProductPhoto.upsert({ product_code: productCode, photo_urls: photoUrls });
    _photoCache.set(productCode, { urls: photoUrls, ts: Date.now() });
};
