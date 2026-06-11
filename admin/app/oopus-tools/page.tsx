"use client";

import { useState, type ReactNode } from "react";
import {
  associerReceptionsCommandes,
  creerFactureNegoce,
  envoyerMessage,
  executerQuery,
  fetchFullImageStocks,
  fetchPlanetPiiTaxFree,
  genererRapport,
  importBlFournisseur,
  importChampsPerso,
  importClients,
  importCommandesFournisseurs,
  importCompteursPassages,
  importFournisseurs,
  importImageStock,
  importMinMaxStock,
  importReceptions,
  importTransferts,
} from "@/lib/ooposts-api";
import { Database, FileText, Globe, PackageOpen, Send, Settings, Terminal, Truck, Users } from "lucide-react";
import { toast } from "sonner";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ApiResultPanel from "@/components/ui/ApiResultPanel";

type TabType = "stocks" | "clients" | "fournisseurs" | "logistique" | "messages" | "negoce" | "taxfree" | "rapports" | "sql";

type ToolTab = {
  id: TabType;
  label: string;
  icon: ReactNode;
};

const today = () => new Date().toISOString().split("T")[0];

export default function OopusToolsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("stocks");
  const [apiResult, setApiResult] = useState<any>(null);
  const [apiError, setApiError] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);

  const [sqlQuery, setSqlQuery] = useState("");
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlLoading, setSqlLoading] = useState(false);

  const [rapportType, setRapportType] = useState("Ventes");
  const [rapportParams, setRapportParams] = useState("");
  const [messageDestinataire, setMessageDestinataire] = useState("MAGASIN_TEST");
  const [messageSujet, setMessageSujet] = useState("Message test depuis admin");
  const [messageTexte, setMessageTexte] = useState("Bonjour, ceci est un test d'envoi de message OOPOS.");

  const tabs: ToolTab[] = [
    { id: "stocks", label: "Stocks avancés", icon: <PackageOpen size={16} /> },
    { id: "clients", label: "Clients", icon: <Users size={16} /> },
    { id: "fournisseurs", label: "Fournisseurs", icon: <Truck size={16} /> },
    { id: "logistique", label: "Imports logistiques", icon: <Settings size={16} /> },
    { id: "messages", label: "Messages", icon: <Send size={16} /> },
    { id: "negoce", label: "Négoce B2B", icon: <Globe size={16} /> },
    { id: "taxfree", label: "Tax-Free", icon: <FileText size={16} /> },
    { id: "rapports", label: "Rapports", icon: <Database size={16} /> },
    { id: "sql", label: "Requêtes SQL", icon: <Terminal size={16} /> },
  ];

  const runToolAction = async (label: string, fn: () => Promise<any>, payloadPreview?: any) => {
    setApiLoading(true);
    setApiError(null);
    setApiResult(null);
    try {
      const response = await fn();
      setApiResult({ action: label, payload: payloadPreview, response });
      toast.success(`${label} exécuté`);
    } catch (e: any) {
      setApiError(e);
      toast.error(e.message || `Erreur ${label}`);
    } finally {
      setApiLoading(false);
    }
  };

  const sampleClient = [{
    Client: "CLIENT_TEST",
    Nom: "Client",
    Prenom: "Test",
    Email: "client.test@example.com",
    Mobile: "00000000",
    Ville: "Tunis",
  }];

  const sampleCompteurPassage = [{
    Magasin: "MAGASIN_TEST",
    Date: today(),
    Heure: "12:00",
    Entrees: 1,
    Sorties: 0,
  }];

  const sampleChampsPerso = [{
    Type: "client",
    Code: "CLIENT_TEST",
    Champ: "Origine",
    Valeur: "Admin test",
  }];

  const sampleReception = [{
    Fournisseur: "FOURNISSEUR_TEST",
    Date: today(),
    Reference: "REC-TEST-001",
    Nature: "Réception",
    Magasin: "DEPOT",
    Produit: "DUMMY",
    Couleur: "",
    Taille: "",
    Quantite: 1,
    Prix_Achat: 0,
  }];

  const sampleTransfert = [{
    demande: "transfert",
    reception_immediate: 1,
    ID: "TRF-TEST-001",
    Date: today(),
    Magasin_Expediteur: "DEPOT",
    Magasin_Destinataire: "MAGASIN_TEST",
    Lignes: [{ Produit: "DUMMY", Couleur: "", Taille: "", Quantite: 1 }],
  }];

  const sampleBlFournisseur = [{
    Fournisseur: "FOURNISSEUR_TEST",
    Numero_BL: "BL-TEST-001",
    Date: today(),
    Magasin: "DEPOT",
    Lignes: [{ Produit: "DUMMY", Couleur: "", Taille: "", Quantite: 1, Prix_Achat: 0 }],
  }];

  const sampleCommandeFournisseur = [{
    Fournisseur: "FOURNISSEUR_TEST",
    Numero_Commande: "CMD-FOUR-TEST-001",
    Date: today(),
    Magasin: "DEPOT",
    Lignes: [{ Produit: "DUMMY", Couleur: "", Taille: "", Quantite: 1, Prix_Achat: 0 }],
  }];

  const sampleImageStock = [{
    Magasin: "DEPOT",
    Produit: "DUMMY",
    Couleur: "",
    Taille: "",
    Quantite: 1,
    EAN: "0000000000000",
  }];

  const sampleAssociationReceptionCommande = [{
    Reception: "REC-TEST-001",
    Commande_Fournisseur: "CMD-FOUR-TEST-001",
    Fournisseur: "FOURNISSEUR_TEST",
  }];

  const sampleMinMax = [{ Code_Article: "DUMMY", Stock_Min: 5, Stock_Max: 20 }];
  const sampleFournisseur = [{ Fournisseur: "FOURNISSEUR_TEST", Nom: "Fournisseur Test", Email: "fournisseur.test@example.com" }];

  const handleGenererRapport = async () => {
    let parsedParams: any = [];
    try {
      if (rapportParams) {
        const parsed = JSON.parse(rapportParams);
        parsedParams = Array.isArray(parsed)
          ? parsed
          : Object.keys(parsed).map((key) => ({ name: key, value: parsed[key] }));
      }
    } catch (e: any) {
      setApiError(new Error("Paramètres rapport invalides : JSON attendu."));
      toast.error("Paramètres rapport invalides");
      return;
    }

    const payload = { id_rapport: rapportType, parametres: parsedParams, format: "pdf" };
    await runToolAction("generation-rapports", () => genererRapport(payload), payload);
  };

  const handleExecuterQuery = async () => {
    if (!sqlQuery.trim()) return;
    setSqlLoading(true);
    setApiLoading(true);
    setApiError(null);
    try {
      const res = await executerQuery(sqlQuery);
      const result = res.data || res;
      setSqlResult(result);
      setApiResult({ action: "query", payload: sqlQuery, response: result });
      toast.success("Requête exécutée");
    } catch (e: any) {
      setApiError(e);
      toast.error(e.message || "Erreur SQL");
    } finally {
      setSqlLoading(false);
      setApiLoading(false);
    }
  };

  const actionButton = (label: string, onClick: () => void, tone = "amber") => (
    <Button onClick={onClick} disabled={apiLoading} className={`bg-${tone}-600 hover:bg-${tone}-700`}>
      {apiLoading ? "Appel en cours..." : label}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Utilitaires OOPOS / Joolan</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Boutons de test et d'administration pour tous les endpoints Joolan intégrés. Chaque action affiche la réponse réelle retournée par l'API.
        </p>
      </div>

      <div className="flex flex-wrap border-b border-gray-200 gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === tab.id ? "border-amber-500 text-amber-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 min-h-[360px]">
        {activeTab === "stocks" && (
          <div className="space-y-4 max-w-3xl">
            <h3 className="text-lg font-semibold text-gray-900">Stocks avancés</h3>
            <p className="text-sm text-gray-500">Endpoints couverts : image-full-stocks, import-image-stock et import-min-max.</p>
            <div className="flex flex-wrap gap-3">
              {actionButton("Afficher stock complet", () => runToolAction("image-full-stocks", () => fetchFullImageStocks()))}
              {actionButton("Importer image stock", () => runToolAction("import-image-stock", () => importImageStock(sampleImageStock), sampleImageStock))}
              {actionButton("Importer min/max", () => runToolAction("import-min-max", () => importMinMaxStock(sampleMinMax), sampleMinMax))}
            </div>
          </div>
        )}

        {activeTab === "clients" && (
          <div className="space-y-4 max-w-3xl">
            <h3 className="text-lg font-semibold text-gray-900">Imports clients et compteurs</h3>
            <p className="text-sm text-gray-500">Endpoints couverts : import-clients, import-compteurs-passages et import-champs-perso.</p>
            <div className="flex flex-wrap gap-3">
              {actionButton("Importer client test", () => runToolAction("import-clients", () => importClients(sampleClient), sampleClient))}
              {actionButton("Importer compteur passages", () => runToolAction("import-compteurs-passages", () => importCompteursPassages(sampleCompteurPassage), sampleCompteurPassage))}
              {actionButton("Importer champ perso", () => runToolAction("import-champs-perso", () => importChampsPerso(sampleChampsPerso), sampleChampsPerso))}
            </div>
          </div>
        )}

        {activeTab === "fournisseurs" && (
          <div className="space-y-4 max-w-3xl">
            <h3 className="text-lg font-semibold text-gray-900">Fournisseurs</h3>
            <p className="text-sm text-gray-500">Endpoint couvert : import-fournisseurs.</p>
            {actionButton("Importer fournisseur test", () => runToolAction("import-fournisseurs", () => importFournisseurs(sampleFournisseur), sampleFournisseur))}
          </div>
        )}

        {activeTab === "logistique" && (
          <div className="space-y-4 max-w-4xl">
            <h3 className="text-lg font-semibold text-gray-900">Imports logistiques et fournisseurs</h3>
            <p className="text-sm text-gray-500">
              Endpoints couverts : import-receptions, import-transferts, import-bl-fournisseur, import-commandes-fournisseurs et associer-receptions-commandes.
            </p>
            <div className="flex flex-wrap gap-3">
              {actionButton("Importer réception", () => runToolAction("import-receptions", () => importReceptions(sampleReception), sampleReception))}
              {actionButton("Importer transfert", () => runToolAction("import-transferts", () => importTransferts(sampleTransfert), sampleTransfert))}
              {actionButton("Importer BL fournisseur", () => runToolAction("import-bl-fournisseur", () => importBlFournisseur(sampleBlFournisseur), sampleBlFournisseur))}
              {actionButton("Importer commande fournisseur", () => runToolAction("import-commandes-fournisseurs", () => importCommandesFournisseurs(sampleCommandeFournisseur), sampleCommandeFournisseur))}
              {actionButton("Associer réception/commande", () => runToolAction("associer-receptions-commandes", () => associerReceptionsCommandes(sampleAssociationReceptionCommande), sampleAssociationReceptionCommande))}
            </div>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold text-gray-900">Envoyer un message inter-magasins</h3>
            <p className="text-sm text-gray-500">Endpoint couvert : envoyer-message.</p>
            <Input label="Destinataire" value={messageDestinataire} onChange={(e) => setMessageDestinataire(e.target.value)} />
            <Input label="Sujet" value={messageSujet} onChange={(e) => setMessageSujet(e.target.value)} />
            <textarea
              value={messageTexte}
              onChange={(e) => setMessageTexte(e.target.value)}
              className="w-full h-24 p-4 border border-gray-200 rounded-xl text-sm"
              placeholder="Message"
            />
            {actionButton("Envoyer message", () => {
              const payload = { Destinataire: messageDestinataire, Sujet: messageSujet, Message: messageTexte };
              return runToolAction("envoyer-message", () => envoyerMessage(payload), payload);
            })}
          </div>
        )}

        {activeTab === "negoce" && (
          <div className="space-y-4 max-w-md">
            <h3 className="text-lg font-semibold text-gray-900">Négoce B2B</h3>
            <p className="text-sm text-gray-500">Endpoint couvert : negoce.do.</p>
            {actionButton("Simuler création facture", () => runToolAction("negoce-creer-piece", () => creerFactureNegoce({ Client: "Test", Montant: 100 }), { Client: "Test", Montant: 100 }))}
          </div>
        )}

        {activeTab === "taxfree" && (
          <div className="space-y-4 max-w-md">
            <h3 className="text-lg font-semibold text-gray-900">Tax-Free Planet</h3>
            <p className="text-sm text-gray-500">Endpoint couvert : planet-pii.</p>
            {actionButton("Vérifier service", () => runToolAction("planet-pii-taxfree", () => fetchPlanetPiiTaxFree("123"), { Entete: "123" }))}
          </div>
        )}

        {activeTab === "rapports" && (
          <div className="space-y-4 max-w-md">
            <h3 className="text-lg font-semibold text-gray-900">Générateur de rapports</h3>
            <p className="text-sm text-gray-500">Endpoint couvert : generation-rapports.</p>
            <Input label="Type de rapport" value={rapportType} onChange={(e) => setRapportType(e.target.value)} />
            <Input label="Paramètres JSON optionnels" value={rapportParams} onChange={(e) => setRapportParams(e.target.value)} />
            <Button onClick={handleGenererRapport} disabled={apiLoading}>Générer</Button>
          </div>
        )}

        {activeTab === "sql" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Terminal SQL</h3>
            <p className="text-sm text-gray-500">Endpoint couvert : query.</p>
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="w-full h-32 p-4 border border-gray-200 rounded-xl font-mono text-sm"
              placeholder="SELECT TOP 10 * FROM Article"
            />
            <Button onClick={handleExecuterQuery} disabled={sqlLoading}>{sqlLoading ? "Exécution..." : "Exécuter la requête"}</Button>
            {sqlResult && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2 text-sm text-gray-700">Résultat brut :</h4>
                <pre className="bg-gray-50 p-4 rounded-xl text-xs overflow-auto max-h-64 border border-gray-100">
                  {JSON.stringify(sqlResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      <ApiResultPanel
        title="Résultat réel API OOPOS"
        description="Chaque bouton de cette page affiche ici la réponse réelle retournée par Joolan/OOPOS. Les payloads de test sont inclus dans le panneau pour faciliter le diagnostic."
        data={apiResult}
        error={apiError}
        loading={apiLoading}
      />
    </div>
  );
}
