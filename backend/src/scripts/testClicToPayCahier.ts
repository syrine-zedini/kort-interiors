/**
 * Script d'exécution des cas de test API (sans DB, sans OOPOS) pour le
 * Cahier des recettes ClicToPay : CTP-01, CTP-05, CTP-06, CTP-07, CTP-08.
 *
 * Utilise directement backend/src/services/clictopay.service.ts (le vrai code
 * d'intégration du site), contre l'environnement TEST (sandbox) ClicToPay.
 * CTP-02/03/04 nécessitent une saisie carte dans un vrai navigateur et ne
 * sont pas exécutés ici.
 *
 * Usage: npx ts-node src/scripts/testClicToPayCahier.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import * as clictopay from '../services/clictopay.service';

const log = (title: string, data: any) => {
  console.log(`\n=== ${title} ===`);
  console.log(JSON.stringify(data, null, 2));
};

async function main() {
  const returnUrl = 'http://localhost:6002/api/v1/clictopay/return?commandeId=test-script';
  const failUrl = 'http://localhost:6002/api/v1/clictopay/fail?commandeId=test-script';

  // --- CTP-01 : Enregistrement commande valide ---
  const orderNumber1 = `CAHIER-${Date.now()}`;
  const ctp01 = await clictopay.registerOrder({
    orderNumber: orderNumber1,
    amount: 10,
    returnUrl,
    failUrl,
    description: 'CTP-01 test cahier des recettes',
  });
  log('CTP-01 — register.do (valide)', ctp01);

  // --- CTP-05 : Vérification statut sur returnUrl (avant tout paiement réel) ---
  if (ctp01.orderId) {
    const ctp05 = await clictopay.getOrderStatus({ orderId: ctp01.orderId });
    log('CTP-05 — getOrderStatusExtended.do (avant paiement)', ctp05);
  }

  // --- CTP-06 : Paramètre "amount" manquant ---
  try {
    const ctp06 = await clictopay.registerOrder({
      orderNumber: `CAHIER-NOAMOUNT-${Date.now()}`,
      amount: undefined as any,
      returnUrl,
      failUrl,
    });
    log('CTP-06 — register.do (amount manquant)', ctp06);
  } catch (err: any) {
    log('CTP-06 — register.do (amount manquant) — exception', err?.response?.data || err.message);
  }

  // --- CTP-07 : Doublon orderNumber ---
  const dupOrderNumber = 'ORDER-DUP-TEST';
  const ctp07a = await clictopay.registerOrder({
    orderNumber: dupOrderNumber,
    amount: 10,
    returnUrl,
    failUrl,
    description: 'CTP-07 première requête',
  });
  log('CTP-07 — register.do (1ère requête)', ctp07a);

  const ctp07b = await clictopay.registerOrder({
    orderNumber: dupOrderNumber,
    amount: 10,
    returnUrl,
    failUrl,
    description: 'CTP-07 deuxième requête (doublon)',
  });
  log('CTP-07 — register.do (2ème requête, doublon)', ctp07b);

  // --- CTP-08 : orderId inexistant ---
  const ctp08 = await clictopay.getOrderStatus({ orderId: '00000000-0000-0000-0000-000000000000' });
  log('CTP-08 — getOrderStatusExtended.do (orderId inexistant)', ctp08);

  console.log('\n\n>>> Pour CTP-02/03/04, ouvrez ce formUrl dans un navigateur et payez avec les cartes de test :');
  console.log(ctp01.formUrl);
}

main().catch((err) => {
  console.error('Erreur script:', err?.response?.data || err.message);
  process.exit(1);
});
