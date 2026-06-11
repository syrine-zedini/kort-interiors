import { Router, Request, Response } from 'express';
import * as joolanService from '../services/joolan.service';

const router = Router();

const handleRequest = (serviceFn: Function) => async (req: Request, res: Response): Promise<any> => {
  try {
    let data;
    if (req.method === 'GET') {
      data = await serviceFn(req.query);
    } else {
      data = await serviceFn(req.body, req.query); // Passe le body ET les paramètres d'URL (query)
    }
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: "Erreur lors de l'appel à Joolan", details: error.message });
  }
};

// ==========================================
// ROUTES JOOLAN EXPOSÉES
// Base : /api/v1/joolan/...
// ==========================================

// --- Clients ---
router.post('/clients/recherche', handleRequest(joolanService.rechercheClients));
router.post('/clients/import', handleRequest(joolanService.importClients));

// --- Tickets ---
router.get('/tickets/export', handleRequest(joolanService.exportTickets));
router.post('/tickets/annulation', handleRequest(joolanService.annulationTicket));
router.get('/tickets/pdf', handleRequest(joolanService.getTicketPdf));
router.post('/tickets/import', handleRequest(joolanService.importTickets));

// --- Produits ---
router.post('/produits/import', handleRequest(joolanService.importProduits));
router.post('/produits/tarifs', handleRequest(joolanService.importTarifs));
router.post('/produits/associes', handleRequest(joolanService.importProduitsAssocies));

// --- Mouvements ---
router.post('/mouvements/receptions', handleRequest(joolanService.importReceptions));
router.post('/mouvements/transferts', handleRequest(joolanService.importTransferts));
router.post('/mouvements/bl-fournisseur', handleRequest(joolanService.importBlFournisseur));
router.post('/mouvements/commandes-fournisseurs', handleRequest(joolanService.importCommandesFournisseurs));
router.post('/mouvements/image-stock', handleRequest(joolanService.importImageStock));

// --- Divers ---
router.post('/divers/compteurs-passages', handleRequest(joolanService.importCompteursPassages));
router.post('/divers/fournisseurs', handleRequest(joolanService.importFournisseurs));
router.post('/divers/min-max', handleRequest(joolanService.importMinMax));
router.post('/divers/champs-perso', handleRequest(joolanService.importChampsPerso));
router.post('/divers/envoyer-message', handleRequest(joolanService.envoyerMessage));
router.post('/divers/query', handleRequest(joolanService.runQuery));

// --- Logistique & Négoce ---
router.get('/logistique', handleRequest(joolanService.getLogistique));
router.post('/logistique', handleRequest(joolanService.postLogistique));
router.post('/negoce', handleRequest(joolanService.postNegoce));

// --- Tax-Free & Rapports ---
router.get('/planet-pii', handleRequest(joolanService.getPlanetPii));
router.post('/generation-rapports', handleRequest(joolanService.generationRapports));

// --- Stocks ---
router.get('/stock', handleRequest(joolanService.getStock));
router.get('/stock/image', handleRequest(joolanService.getImageStocks));
router.get('/stock/image-full', handleRequest(joolanService.getImageFullStocks));

// --- Catalogue Web ---
router.get('/catalogue-web', handleRequest(joolanService.getCatalogueWeb));

// --- Utilitaires ---
router.get('/ean-existe', handleRequest(joolanService.eanExiste));

export default router;
