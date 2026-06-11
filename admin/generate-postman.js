const fs = require('fs');

const collection = {
  "info": {
    "name": "Admin Local Joolan Endpoints (Documentation Intégrée)",
    "description": "Collection complète avec les vrais exemples de payloads JSON, TSV et Query params de la documentation Joolan.",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Clients",
      "item": [
        {
          "name": "Recherche Clients (POST)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": JSON.stringify({"Search": [{"Field": "Email", "Value": "client@example.com"}]}, null, 2)},
            "url": {"raw": "{{admin_url}}/api/client?action=search", "host": ["{{admin_url}}"], "path": ["api", "client"], "query": [{"key": "action", "value": "search"}]}
          }
        },
        {
          "name": "Import Clients (POST)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": JSON.stringify([{"Nom": "DUPONT", "Prenom": "Jean", "email": "jean.dupont@example.com", "Mobile": "+33612345678", "Ville": "PARIS"}], null, 2)},
            "url": {"raw": "{{admin_url}}/api/client?action=import", "host": ["{{admin_url}}"], "path": ["api", "client"], "query": [{"key": "action", "value": "import"}]}
          }
        }
      ]
    },
    {
      "name": "2. Tickets",
      "item": [
        {
          "name": "Export Tickets (GET)",
          "request": {
            "method": "GET",
            "header": [],
            "url": {"raw": "{{admin_url}}/api/tickets?action=export&Date=2026-01-15", "host": ["{{admin_url}}"], "path": ["api", "tickets"], "query": [{"key": "action", "value": "export"}, {"key": "Date", "value": "2026-01-15"}]}
          }
        },
        {
          "name": "Ticket PDF (GET)",
          "request": {
            "method": "GET",
            "header": [],
            "url": {"raw": "{{admin_url}}/api/tickets?action=pdf&Entete=12345&format=receipt", "host": ["{{admin_url}}"], "path": ["api", "tickets"], "query": [{"key": "action", "value": "pdf"}, {"key": "Entete", "value": "12345"}, {"key": "format", "value": "receipt"}]}
          }
        },
        {
          "name": "Annulation Ticket (POST)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": ""},
            "url": {"raw": "{{admin_url}}/api/tickets?action=annulation&Entete=12345&Motif=Erreur de saisie", "host": ["{{admin_url}}"], "path": ["api", "tickets"], "query": [{"key": "action", "value": "annulation"}, {"key": "Entete", "value": "12345"}, {"key": "Motif", "value": "Erreur de saisie"}]}
          }
        },
        {
          "name": "Import Tickets (POST)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": JSON.stringify([{"Magasin": "OPERA", "Caisse": 1, "Nature": "VENTE", "Vendeur": "SERGE", "Lignes": [{"Produit": "ANGELA", "Couleur": "BLEU", "Taille": "S", "Designation": "Chemise Angela Coton", "Quantite": 1, "Prix_Vente": 175, "Taux_TVA": 0}], "Reglements": [{"Montant": 175, "ModeReg": "300", "Libelle": "CARTE BANCAIRE", "Reference": "transaction CB 1234"}]}], null, 2)},
            "url": {"raw": "{{admin_url}}/api/tickets?action=import&Magasins_Stocks='PARIS','OPERA'", "host": ["{{admin_url}}"], "path": ["api", "tickets"], "query": [{"key": "action", "value": "import"}, {"key": "Magasins_Stocks", "value": "'PARIS','OPERA'"}]}
          }
        }
      ]
    },
    {
      "name": "3. Imports (Produits & Tarifs)",
      "item": [
        {
          "name": "Import Produits (POST)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": JSON.stringify([{"Produit": "TSHIRT-001", "Designation": "T-shirt coton", "Couleur": "BLANC", "Taille": "M", "EAN": "3760123456789", "Rayon": "TEXTILE", "Famille": "HAUTS", "Marque": "MARQUE1", "Prix_Achat": 15, "Prix_Vente": 49.9}], null, 2)},
            "url": {"raw": "{{admin_url}}/api/import?action=produits&reset_tarif=1", "host": ["{{admin_url}}"], "path": ["api", "import"], "query": [{"key": "action", "value": "produits"}, {"key": "reset_tarif", "value": "1"}]}
          }
        },
        {
          "name": "Import Tarifs (POST)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": JSON.stringify([{"Tarif": "STANDARD", "Produit": "TSHIRT-001", "Couleur": "BLANC", "Taille": "M", "Prix_Vente": 49.9, "Remise_Vente": 0}], null, 2)},
            "url": {"raw": "{{admin_url}}/api/import?action=tarifs", "host": ["{{admin_url}}"], "path": ["api", "import"], "query": [{"key": "action", "value": "tarifs"}]}
          }
        },
        {
          "name": "Import Produits Associés (POST)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": JSON.stringify([{"Produit": "TSHIRT-001", "Couleur": "BLANC", "Produit_Associe": "JEAN-001", "Couleur_Associee": "BLEU"}], null, 2)},
            "url": {"raw": "{{admin_url}}/api/import?action=produits-associes", "host": ["{{admin_url}}"], "path": ["api", "import"], "query": [{"key": "action", "value": "produits-associes"}]}
          }
        }
      ]
    },
    {
      "name": "4. Mouvements (Imports)",
      "item": [
        {
          "name": "Import Réceptions (POST)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": JSON.stringify([{"Fournisseur": "FOURNISSEUR1", "Date": "2026-02-15", "Reference": "BL-001", "Nature": "Réception", "Magasin": "DEPOT", "Produit": "TSHIRT-001", "Couleur": "BLANC", "Taille": "M", "Quantite": 100, "Prix_Achat": 15}], null, 2)},
            "url": {"raw": "{{admin_url}}/api/import?action=receptions&creation_produits=1", "host": ["{{admin_url}}"], "path": ["api", "import"], "query": [{"key": "action", "value": "receptions"}, {"key": "creation_produits", "value": "1"}]}
          }
        },
        {
          "name": "Import Transferts (POST)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": JSON.stringify([{"demande": "transfert", "reception_immediate": 1, "ID": "TRF-001", "Date": "2026-02-18", "Magasin_Expediteur": "DEPOT", "Magasin_Destinataire": "PARIS01", "Lignes": [{"Produit": "TSHIRT-001", "Couleur": "BLANC", "Taille": "M", "Quantite": 10}, {"Produit": "TSHIRT-001", "Couleur": "NOIR", "Taille": "L", "Quantite": 5}]}], null, 2)},
            "url": {"raw": "{{admin_url}}/api/import?action=transferts", "host": ["{{admin_url}}"], "path": ["api", "import"], "query": [{"key": "action", "value": "transferts"}]}
          }
        },
        {
          "name": "Import BL Fournisseur (POST - Text)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "text/plain"}],
            "body": {"mode": "raw", "raw": "Date\tNumero_Bon_Livraison\tColis\tReference_Colis\tMagasin\tProduit\tCouleur\tTaille\tQuantite\n15/02/2026\tBL-001\t1\tCOL-001\tDEPOT\tTSHIRT-001\tBLANC\tM\t50\n15/02/2026\tBL-001\t1\tCOL-001\tDEPOT\tTSHIRT-001\tBLANC\tL\t30\n15/02/2026\tBL-001\t2\tCOL-002\tDEPOT\tTSHIRT-001\tNOIR\tM\t40"},
            "url": {"raw": "{{admin_url}}/api/import?action=bl-fournisseur&Fournisseur=FOURNISSEUR1&Commande=12345", "host": ["{{admin_url}}"], "path": ["api", "import"], "query": [{"key": "action", "value": "bl-fournisseur"}, {"key": "Fournisseur", "value": "FOURNISSEUR1"}, {"key": "Commande", "value": "12345"}]}
          }
        },
        {
          "name": "Import Commandes Fournisseurs (POST - Text)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "text/plain"}],
            "body": {"mode": "raw", "raw": "Fournisseur\tDate\tNumero_Commande\tMagasin\tProduit\tCouleur\tTaille\tQuantite\tPrix_Achat\tRemise_Achat\tDevise\tStatut\tDate_Livraison\nFOURNISSEUR1\t15/02/2026\tCMD-001\tPARIS\tTSHIRT-001\tBLANC\tM\t100\t15.00\t0\tEUR\tEn saisie\t01/03/2026\nFOURNISSEUR1\t15/02/2026\tCMD-001\tPARIS\tTSHIRT-001\tNOIR\tM\t50\t15.00\t5\tEUR\tEn saisie\t01/03/2026"},
            "url": {"raw": "{{admin_url}}/api/import?action=commandes-fournisseurs&creation-produits=1", "host": ["{{admin_url}}"], "path": ["api", "import"], "query": [{"key": "action", "value": "commandes-fournisseurs"}, {"key": "creation-produits", "value": "1"}]}
          }
        },
        {
          "name": "Import Image Stock (POST - Text)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "text/plain"}],
            "body": {"mode": "raw", "raw": "Magasin\tProduit\tCouleur\tTaille\tStock\nPARIS\tTSHIRT-001\tBLANC\tM\t25\nPARIS\tTSHIRT-001\tBLANC\tL\t18\nPARIS\tTSHIRT-001\tNOIR\tM\t12"},
            "url": {"raw": "{{admin_url}}/api/import?action=image-stock", "host": ["{{admin_url}}"], "path": ["api", "import"], "query": [{"key": "action", "value": "image-stock"}]}
          }
        }
      ]
    },
    {
      "name": "5. Divers",
      "item": [
        {
          "name": "Import Compteurs Passages (POST)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": JSON.stringify([{"Magasin": "PARIS", "Date": "2026-01-26", "Heure": "10:00:00", "Compteur": 1, "Entrees": 150, "Sorties": 120}], null, 2)},
            "url": {"raw": "{{admin_url}}/api/divers?action=compteurs-passages", "host": ["{{admin_url}}"], "path": ["api", "divers"], "query": [{"key": "action", "value": "compteurs-passages"}]}
          }
        },
        {
          "name": "Import Fournisseurs (POST)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": JSON.stringify([{"Fournisseur": "FOURNISSEUR1", "Contact": "Jean Dupont", "Email": "contact@fournisseur1.com", "Telephone": "+33123456789", "Ville": "LYON"}], null, 2)},
            "url": {"raw": "{{admin_url}}/api/divers?action=fournisseurs", "host": ["{{admin_url}}"], "path": ["api", "divers"], "query": [{"key": "action", "value": "fournisseurs"}]}
          }
        },
        {
          "name": "Import Min Max (POST)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": JSON.stringify([{"Profil_Stock": "STANDARD", "Produit": "TSHIRT-001", "Couleur": "BLANC", "Taille": "M", "Mini": 5, "Maxi": 20}], null, 2)},
            "url": {"raw": "{{admin_url}}/api/divers?action=min-max", "host": ["{{admin_url}}"], "path": ["api", "divers"], "query": [{"key": "action", "value": "min-max"}]}
          }
        },
        {
          "name": "Import Champs Perso (POST)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": JSON.stringify([{"Nature": "produits", "Nom": "Poids_Net", "Clef": "TSHIRT-001", "Valeur": "200g"}], null, 2)},
            "url": {"raw": "{{admin_url}}/api/divers?action=champs-perso", "host": ["{{admin_url}}"], "path": ["api", "divers"], "query": [{"key": "action", "value": "champs-perso"}]}
          }
        },
        {
          "name": "Envoyer Message (POST)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": "{}"},
            "url": {"raw": "{{admin_url}}/api/divers?action=envoyer-message&magasin-expediteur=OPERA&magasin-destinataire=PARIS&utilisateur-expediteur=ESHOP&message=Veuillez expédier le transfert 123 à PARIS svp", "host": ["{{admin_url}}"], "path": ["api", "divers"], "query": [{"key": "action", "value": "envoyer-message"}, {"key": "magasin-expediteur", "value": "OPERA"}, {"key": "magasin-destinataire", "value": "PARIS"}, {"key": "utilisateur-expediteur", "value": "ESHOP"}, {"key": "message", "value": "Veuillez expédier le transfert 123 à PARIS svp"}]}
          }
        },
        {
          "name": "Requête SQL (POST - Text)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "text/plain"}],
            "body": {"mode": "raw", "raw": "SELECT Produit, Designation FROM produits LIMIT 5"},
            "url": {"raw": "{{admin_url}}/api/divers?action=query", "host": ["{{admin_url}}"], "path": ["api", "divers"], "query": [{"key": "action", "value": "query"}]}
          }
        }
      ]
    },
    {
      "name": "6. Logistique & Négoce",
      "item": [
        {
          "name": "Logistique (GET)",
          "request": {
            "method": "GET",
            "header": [],
            "url": {"raw": "{{admin_url}}/api/logistique?action=catalogue&Magasin=PARIS", "host": ["{{admin_url}}"], "path": ["api", "logistique"], "query": [{"key": "action", "value": "catalogue"}, {"key": "Magasin", "value": "PARIS"}]}
          }
        },
        {
          "name": "Logistique (POST)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": JSON.stringify({"Entete": 12345, "Magasin": "MAGASIN1", "Caisse": 1, "date_reception": "2026-01-27", "heure_reception": "14:30:00", "accepter_difference": 1, "Produits": [{"Produit": "CHEMISE01", "Couleur": "BLEU", "Taille": "M", "Quantite": 10}]}, null, 2)},
            "url": {"raw": "{{admin_url}}/api/logistique?action=confirmation_reception_transfert", "host": ["{{admin_url}}"], "path": ["api", "logistique"], "query": [{"key": "action", "value": "confirmation_reception_transfert"}]}
          }
        },
        {
          "name": "Négoce (POST)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": JSON.stringify({"Client": 138, "Nature": "FACTURE", "Magasin": "DEPOT", "Date": "2026-01-27", "Produits": [{"Produit": "CHEMISE01", "Couleur": "BLEU", "Taille": "M", "Quantite": 10, "Prix_Vente": 45, "Remise_Vente": 10, "Commentaire": "Livraison urgente"}]}, null, 2)},
            "url": {"raw": "{{admin_url}}/api/negoce?action=creer_piece", "host": ["{{admin_url}}"], "path": ["api", "negoce"], "query": [{"key": "action", "value": "creer_piece"}]}
          }
        }
      ]
    },
    {
      "name": "7. Tax-Free & Rapports",
      "item": [
        {
          "name": "Tax Free Planet PII (GET)",
          "request": {
            "method": "GET",
            "header": [],
            "url": {"raw": "{{admin_url}}/api/taxfree?Entete=12345", "host": ["{{admin_url}}"], "path": ["api", "taxfree"], "query": [{"key": "Entete", "value": "12345"}]}
          }
        },
        {
          "name": "Génération Rapports (POST)",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": JSON.stringify({"id_rapport": "12345", "parametres": [{"name": "Date_Debut", "value": "2026-01-01"}, {"name": "Date_Fin", "value": "2026-01-31"}], "format": "pdf"}, null, 2)},
            "url": {"raw": "{{admin_url}}/api/rapports", "host": ["{{admin_url}}"], "path": ["api", "rapports"]}
          }
        }
      ]
    },
    {
      "name": "8. Stocks",
      "item": [
        {
          "name": "Stock (GET)",
          "request": {
            "method": "GET",
            "header": [],
            "url": {"raw": "{{admin_url}}/api/stock?action=stock&Produit=TSHIRT-001&Couleur=BLANC&Taille=M&Magasins=PARIS;LYON", "host": ["{{admin_url}}"], "path": ["api", "stock"], "query": [{"key": "action", "value": "stock"}, {"key": "Produit", "value": "TSHIRT-001"}, {"key": "Couleur", "value": "BLANC"}, {"key": "Taille", "value": "M"}, {"key": "Magasins", "value": "PARIS;LYON"}]}
          }
        },
        {
          "name": "Image Stocks (GET)",
          "request": {
            "method": "GET",
            "header": [],
            "url": {"raw": "{{admin_url}}/api/stock?action=image-stocks&Magasins=PARIS;LYON", "host": ["{{admin_url}}"], "path": ["api", "stock"], "query": [{"key": "action", "value": "image-stocks"}, {"key": "Magasins", "value": "PARIS;LYON"}]}
          }
        },
        {
          "name": "Image Full Stocks (GET)",
          "request": {
            "method": "GET",
            "header": [],
            "url": {"raw": "{{admin_url}}/api/stock?action=full-stocks&Magasins=PARIS;LYON", "host": ["{{admin_url}}"], "path": ["api", "stock"], "query": [{"key": "action", "value": "full-stocks"}, {"key": "Magasins", "value": "PARIS;LYON"}]}
          }
        }
      ]
    },
    {
      "name": "9. Web & Utilitaires",
      "item": [
        {
          "name": "Catalogue Web (GET)",
          "request": {
            "method": "GET",
            "header": [],
            "url": {"raw": "{{admin_url}}/api/catalogue-web?output-format=json&last-call=2026-01-01 00:00:00&Magasin=PARIS&Produit=TSHIRT-001", "host": ["{{admin_url}}"], "path": ["api", "catalogue-web"], "query": [{"key": "output-format", "value": "json"}, {"key": "last-call", "value": "2026-01-01 00:00:00"}, {"key": "Magasin", "value": "PARIS"}, {"key": "Produit", "value": "TSHIRT-001"}]}
          }
        },
        {
          "name": "EAN Existe (GET)",
          "request": {
            "method": "GET",
            "header": [],
            "url": {"raw": "{{admin_url}}/api/utilitaires?action=ean-existe&ean=3760123456789", "host": ["{{admin_url}}"], "path": ["api", "utilitaires"], "query": [{"key": "action", "value": "ean-existe"}, {"key": "ean", "value": "3760123456789"}]}
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "admin_url",
      "value": "http://localhost:3000",
      "type": "string"
    }
  ]
};

fs.writeFileSync('Admin_Local_Joolan_Endpoints.postman_collection.json', JSON.stringify(collection, null, 2), 'utf8');
console.log('Collection generated.');
