import axios from "axios";

export interface StockData {
  Magasin: string;
  Produit: string;
  Couleur: string;
  Taille: string;
  En_Stock: number;
  Disponible: number;
  En_Reservation: number;
  Sku: number;
  EAN: string;
}

export interface StockResponse {
  result: "ok" | "ko";
  data?: StockData[];
  error_message?: string;
}

export interface FullStockData extends StockData {
  Reliquat_Fournisseur: number;
  En_Livraison: number;
  En_Preparation: number;
  Attribue: number;
  En_BL: number;
  Reference_Fournisseur: string;
}

export interface FullStockResponse {
  result: "ok" | "ko";
  data?: FullStockData[];
  error_message?: string;
}

export const fetchProductStock = async (params: {
  Produit: string;
  Couleur?: string;
  Taille?: string;
  Magasins?: string;
}): Promise<StockData[]> => {
  try {
    const queryParams = new URLSearchParams({
      action: "stock",
      produit: params.Produit,
      ...(params.Couleur && { couleur: params.Couleur }),
      ...(params.Taille && { taille: params.Taille }),
      ...(params.Magasins && { magasins: params.Magasins }),
    });

    const response = await axios.get<StockResponse>(
      `/api/stock?${queryParams.toString()}`
    );

    if (response.data.result === "ok" && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error_message || "Failed to fetch stock");
  } catch (error: any) {
    console.error("Stock fetch error:", error);
    throw error;
  }
};

export const fetchImageStocks = async (productCodes?: string[]): Promise<FullStockData[]> => {
  try {
    if (productCodes && productCodes.length > 0) {
      const allStocks: FullStockData[] = [];

      for (const code of productCodes) {
        const response = await axios.get<FullStockResponse>(
          `/api/stock?action=stock&produit=${encodeURIComponent(code)}`
        );

        if (response.data.result === "ok" && response.data.data) {
          allStocks.push(...response.data.data);
        }
      }

      return allStocks;
    } else {
      const queryParams = new URLSearchParams({
        action: "image-stocks",
      });

      const response = await axios.get<FullStockResponse>(
        `/api/stock?${queryParams.toString()}`
      );

      if (response.data.result === "ok" && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error_message || "Failed to fetch stocks");
    }
  } catch (error: any) {
    console.error("Image stocks fetch error:", error);
    throw error;
  }
};

export const fetchFullImageStocks = async (magasins?: string): Promise<FullStockData[]> => {
  try {
    const queryParams = new URLSearchParams({
      action: "full-stocks",
      ...(magasins && { magasins }),
    });

    const response = await axios.get<FullStockResponse>(
      `/api/stock?${queryParams.toString()}`
    );

    if (response.data.result === "ok" && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error_message || "Failed to fetch full stocks");
  } catch (error: any) {
    console.error("Full image stocks fetch error:", error);
    throw error;
  }
};

export interface ClientData {
  Client: number;
  Nom: string;
  Prenom: string;
  Email?: string;
  Mobile?: string;
  Adresse?: string;
  CodePostal?: string;
  Ville?: string;
  Carte_Fidelite?: string;
}

export interface ClientResponse {
  result: "ok" | "ko";
  count?: number;
  data?: ClientData[];
  error_message?: string;
}

export const fetchClients = async (): Promise<ClientData[]> => {
  try {
    const queryParams = new URLSearchParams({
      action: "search",
    });

    const response = await axios.get<ClientResponse>(
      `/api/client?${queryParams.toString()}`
    );

    if (response.data.result === "ok" && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error_message || "Failed to fetch clients");
  } catch (error: any) {
    console.error("Clients fetch error:", error);
    throw error;
  }
};

// ─── CATALOGUE WEB ────────────────────────────────────────────────────────────

export const fetchCatalogueWeb = async (params: {
  Magasin?: string;
  Produit?: string;
  [key: string]: any;
}): Promise<any> => {
  try {
    const queryParams = new URLSearchParams(params as any);
    const response = await axios.get(`/api/catalogue-web?${queryParams.toString()}`);
    return response.data;
  } catch (error: any) {
    console.error("Catalogue web fetch error:", error);
    throw error;
  }
};

// ─── IMPORT PRODUITS & MOUVEMENTS ──────────────────────────────────────────────

export const importProduits = async (produits: any[], resetTarif?: boolean): Promise<any> => {
  try {
    const queryParams = new URLSearchParams({ action: "produits" });
    if (resetTarif) queryParams.append("reset_tarif", "1");
    
    const response = await axios.post(`/api/import?${queryParams.toString()}`, produits);
    return response.data;
  } catch (error: any) {
    console.error("Import produits error:", error);
    throw error;
  }
};

export const importTarifs = async (tarifs: any[]): Promise<any> => {
  try {
    const response = await axios.post(`/api/import?action=tarifs`, tarifs);
    return response.data;
  } catch (error: any) {
    console.error("Import tarifs error:", error);
    throw error;
  }
};

export const importProduitsAssocies = async (associes: any[]): Promise<any> => {
  try {
    const response = await axios.post(`/api/import?action=produits-associes`, associes);
    return response.data;
  } catch (error: any) {
    console.error("Import produits associes error:", error);
    throw error;
  }
};

export const importReceptions = async (receptions: any[], creationProduits?: boolean): Promise<any> => {
  try {
    const queryParams = new URLSearchParams({ action: "receptions" });
    if (creationProduits) queryParams.append("creation_produits", "1");
    
    const response = await axios.post(`/api/import?${queryParams.toString()}`, receptions);
    return response.data;
  } catch (error: any) {
    console.error("Import receptions error:", error);
    throw error;
  }
};

export const importTransferts = async (transferts: any[]): Promise<any> => {
  try {
    const response = await axios.post(`/api/import?action=transferts`, transferts);
    return response.data;
  } catch (error: any) {
    console.error("Import transferts error:", error);
    throw error;
  }
};

export const importBlFournisseur = async (bonsLivraison: any[]): Promise<any> => {
  try {
    const response = await axios.post(`/api/import?action=bl-fournisseur`, bonsLivraison);
    return response.data;
  } catch (error: any) {
    console.error("Import BL fournisseur error:", error);
    throw error;
  }
};

export const importCommandesFournisseurs = async (commandes: any[]): Promise<any> => {
  try {
    const response = await axios.post(`/api/import?action=commandes-fournisseurs`, commandes);
    return response.data;
  } catch (error: any) {
    console.error("Import commandes fournisseurs error:", error);
    throw error;
  }
};

export const importImageStock = async (imagesStock: any[]): Promise<any> => {
  try {
    const response = await axios.post(`/api/import?action=image-stock`, imagesStock);
    return response.data;
  } catch (error: any) {
    console.error("Import image stock error:", error);
    throw error;
  }
};

export const associerReceptionsCommandes = async (associations: any[]): Promise<any> => {
  try {
    const response = await axios.post(`/api/import?action=associer-receptions-commandes`, associations);
    return response.data;
  } catch (error: any) {
    console.error("Associer receptions commandes error:", error);
    throw error;
  }
};



export const importClients = async (clients: any[]): Promise<any> => {
  try {
    const response = await axios.post(`/api/client?action=import`, clients);
    return response.data;
  } catch (error: any) {
    console.error("Import clients error:", error);
    throw error;
  }
};

// ─── TICKETS & COMMANDES ───────────────────────────────────────────────────────

export const exportTickets = async (date: string): Promise<any> => {
  try {
    const response = await axios.get(`/api/tickets?action=export&Date=${date}`);
    return response.data;
  } catch (error: any) {
    console.error("Export tickets error:", error);
    throw error;
  }
};

export const annulerTicket = async (entete: string, motif: string): Promise<any> => {
  try {
    const response = await axios.post(`/api/tickets?action=annulation&Entete=${encodeURIComponent(entete)}&Motif=${encodeURIComponent(motif)}`);
    return response.data;
  } catch (error: any) {
    console.error("Annulation ticket error:", error);
    throw error;
  }
};

export const importTickets = async (tickets: any[], magasinsStocks?: string): Promise<any> => {
  try {
    const queryParams = new URLSearchParams({ action: "import" });
    if (magasinsStocks) queryParams.append("Magasins_Stocks", magasinsStocks);
    
    const response = await axios.post(`/api/tickets?${queryParams.toString()}`, tickets);
    return response.data;
  } catch (error: any) {
    console.error("Import tickets error:", error);
    throw error;
  }
};

export const fetchTicketPdf = async (entete: string, format: "receipt" | "A4" = "receipt"): Promise<any> => {
  try {
    const response = await axios.get(`/api/tickets?action=pdf&Entete=${entete}&Format=${format}`);
    return response.data;
  } catch (error: any) {
    console.error("Fetch ticket pdf error:", error);
    throw error;
  }
};

// ─── DIVERS ───────────────────────────────────────────────────────────────────

export const importFournisseurs = async (fournisseurs: any[]): Promise<any> => {
  try {
    const response = await axios.post(`/api/divers?action=import-fournisseurs`, fournisseurs);
    return response.data;
  } catch (error: any) {
    console.error("Import fournisseurs error:", error);
    throw error;
  }
};

export const importMinMaxStock = async (minMax: any[]): Promise<any> => {
  try {
    const response = await axios.post(`/api/divers?action=import-min-max`, minMax);
    return response.data;
  } catch (error: any) {
    console.error("Import min max error:", error);
    throw error;
  }
};

export const importCompteursPassages = async (compteurs: any[]): Promise<any> => {
  try {
    const response = await axios.post(`/api/divers?action=import-compteurs-passages`, compteurs);
    return response.data;
  } catch (error: any) {
    console.error("Import compteurs passages error:", error);
    throw error;
  }
};

export const importChampsPerso = async (champsPerso: any[]): Promise<any> => {
  try {
    const response = await axios.post(`/api/divers?action=import-champs-perso`, champsPerso);
    return response.data;
  } catch (error: any) {
    console.error("Import champs perso error:", error);
    throw error;
  }
};

export const envoyerMessage = async (message: any): Promise<any> => {
  try {
    const response = await axios.post(`/api/divers?action=envoyer-message`, message);
    return response.data;
  } catch (error: any) {
    console.error("Envoyer message error:", error);
    throw error;
  }
};

export const executerQuery = async (query: string): Promise<any> => {

  try {
    const response = await axios.post(`/api/divers?action=query`, query, {
      headers: { "Content-Type": "text/plain" }
    });
    return response.data;
  } catch (error: any) {
    console.error("Execute query error:", error);
    throw error;
  }
};

// ─── LOGISTIQUE ───────────────────────────────────────────────────────────────

export const fetchLogistiqueCatalogue = async (tarif: string, lastChange?: string): Promise<any> => {
  try {
    const queryParams = new URLSearchParams({ action: "catalogue", tarif: tarif });
    if (lastChange) queryParams.append("last_change", lastChange);
    
    const response = await axios.get(`/api/logistique?${queryParams.toString()}`);
    return response.data;
  } catch (error: any) {
    console.error("Fetch logistique catalogue error:", error);
    throw error;
  }
};

export const confirmationReceptionTransfert = async (transfert: any): Promise<any> => {
  try {
    const response = await axios.post(`/api/logistique?action=confirmation_reception_transfert`, transfert);
    return response.data;
  } catch (error: any) {
    console.error("Confirmation reception transfert error:", error);
    throw error;
  }
};

// ─── NEGOCE B2B ───────────────────────────────────────────────────────────────

export const creerFactureNegoce = async (facture: any): Promise<any> => {
  try {
    const response = await axios.post(`/api/negoce?action=creer_piece`, facture);
    return response.data;
  } catch (error: any) {
    console.error("Creer facture negoce error:", error);
    throw error;
  }
};

// ─── TAX-FREE ─────────────────────────────────────────────────────────────────

export const fetchPlanetPiiTaxFree = async (entete: string): Promise<any> => {
  try {
    const response = await axios.get(`/api/taxfree?action=planet-pii&Entete=${entete}`);
    return response.data;
  } catch (error: any) {
    console.error("Fetch tax-free error:", error);
    throw error;
  }
};

// ─── RAPPORTS ─────────────────────────────────────────────────────────────────

export const genererRapport = async (rapportData: { id_rapport: string; parametres: any[]; format: string }): Promise<any> => {
  try {
    const response = await axios.post(`/api/rapports?action=generation-rapports`, rapportData);
    return response.data;
  } catch (error: any) {
    console.error("Generer rapport error:", error);
    throw error;
  }
};

