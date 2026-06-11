import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OOPOS_DOMAIN = process.env.OOPOS_DOMAIN || 'caisse.oopos.fr';
const BASE_URL = `https://${OOPOS_DOMAIN}/api/v2`;
const ENSEIGNE = process.env.OOPOS_ENSEIGNE;
const API_KEY = process.env.OOPOS_API_KEY;

if (!ENSEIGNE || !API_KEY) {
  console.warn("⚠️ Attention : Les variables OOPOS_ENSEIGNE ou OOPOS_API_KEY sont manquantes dans le fichier .env");
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
export const getCatalogueWeb = (params: any) => genericGet('/catalogue-web.do', params);

// --- Utilitaires ---
export const eanExiste = (params: any) => genericGet('/ean-existe.do', params);
