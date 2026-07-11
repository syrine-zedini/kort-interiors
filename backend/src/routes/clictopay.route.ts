import { Router, Request, Response } from 'express';
import { Commande } from '../models/commande.model';
import * as clictopayService from '../services/clictopay.service';

const router = Router();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:6002';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3005';
const API_VERSION = process.env.API_VERSION || 'v1';

// POST /api/v1/clictopay/init — Enregistre le paiement ClicToPay pour une commande existante
// et renvoie formUrl (page de paiement hébergée) vers laquelle le frontend doit rediriger le client.
router.post('/init', async (req: Request, res: Response) => {
  try {
    const { commandeId } = req.body;
    if (!commandeId) {
      return res.status(400).json({ message: 'commandeId manquant' });
    }

    const commande = await Commande.findByPk(commandeId);
    if (!commande) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }

    const returnUrl = `${BACKEND_URL}/api/${API_VERSION}/clictopay/return?commandeId=${commande.id}`;
    const failUrl = `${BACKEND_URL}/api/${API_VERSION}/clictopay/fail?commandeId=${commande.id}`;

    const result = await clictopayService.registerOrder({
      orderNumber: commande.id,
      amount: Number(commande.totalAmount),
      returnUrl,
      failUrl,
      description: `Commande KORT ${commande.id}`,
    });

    if (result.errorCode && Number(result.errorCode) !== 0) {
      return res.status(400).json({ message: result.errorMessage || 'Erreur ClicToPay' });
    }

    await commande.update({ clictopayOrderId: result.orderId });

    res.json({ formUrl: result.formUrl, orderId: result.orderId });
  } catch (err: any) {
    console.error('ClicToPay init error:', err.message);
    res.status(500).json({ message: err.message || 'Erreur interne' });
  }
});

// GET /api/v1/clictopay/return — Redirection ClicToPay après un paiement (potentiellement) réussi
router.get('/return', (req: Request, res: Response) => handleClicToPayRedirect(req, res));

// GET /api/v1/clictopay/fail — Redirection ClicToPay après un paiement refusé/annulé
router.get('/fail', (req: Request, res: Response) => handleClicToPayRedirect(req, res));

// Règle critique ClicToPay : ne jamais valider un paiement sur la seule base de la redirection.
// On revérifie toujours le statut réel via getOrderStatusExtended.do avant de mettre à jour la commande.
async function handleClicToPayRedirect(req: Request, res: Response) {
  const commandeId = String(req.query.commandeId || '');
  if (!commandeId) {
    return res.redirect(`${FRONTEND_URL}/cart/payment-failed?reason=missing_commande`);
  }

  try {
    const commande = await Commande.findByPk(commandeId);
    if (!commande) {
      return res.redirect(`${FRONTEND_URL}/cart/payment-failed?reason=not_found`);
    }
    if (!commande.clictopayOrderId) {
      return res.redirect(`${FRONTEND_URL}/cart/payment-failed?commandeId=${commande.id}&reason=no_order`);
    }

    const status = await clictopayService.getOrderStatus({ orderId: commande.clictopayOrderId });

    if (Number(status.orderStatus) === 2) {
      await commande.update({ paymentStatus: 'paid', status: 'processing' });
      return res.redirect(`${FRONTEND_URL}/cart/payment-success?commandeId=${commande.id}`);
    }

    await commande.update({ paymentStatus: 'failed' });
    return res.redirect(`${FRONTEND_URL}/cart/payment-failed?commandeId=${commande.id}&reason=declined`);
  } catch (err: any) {
    console.error('ClicToPay callback error:', err.message);
    return res.redirect(`${FRONTEND_URL}/cart/payment-failed?reason=error`);
  }
}

export default router;
