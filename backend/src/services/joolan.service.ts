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
// Filtrage par magasin : si OOPOS_MAGASIN est défini dans .env, il est
// automatiquement passé à catalogue-web.do pour reproduire exactement
// le même filtrage que l'interface caisse OOPOS.
export const getCatalogueWeb = async (params: any) => {
  const finalParams = { ...params };
  if (OOPOS_MAGASIN) {
    finalParams['Magasin'] = OOPOS_MAGASIN;
  }
  console.log(`[getCatalogueWeb] params:`, JSON.stringify(finalParams));
  const data = await genericGet('/catalogue-web.do', finalParams);
  return data;
};

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
