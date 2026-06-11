import { Router, Request, Response } from 'express';
import { Commande } from '../models/commande.model';

const router = Router();

// POST /api/v1/payment/callback — Handle payment provider webhooks
router.post('/callback', async (req: Request, res: Response) => {
  try {
    const { commandeId, status, transactionId, provider } = req.body;

    // Validate required fields
    if (!commandeId || !status) {
      return res.status(400).json({ message: 'Missing required fields: commandeId, status' });
    }

    // Validate status
    const validStatuses = ['paid', 'failed', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    // Find the commande
    const commande = await Commande.findByPk(commandeId);
    if (!commande) {
      return res.status(404).json({ message: 'Commande not found' });
    }

    // Update payment status
    await commande.update({ paymentStatus: status });

    // If payment is successful, update order status to processing
    if (status === 'paid') {
      await commande.update({ status: 'processing' });
    }

    // Determine redirect URL based on payment status
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3005';
    let redirectUrl = '';

    if (status === 'paid') {
      redirectUrl = `${frontendBaseUrl}/payment-success?commandeId=${commandeId}`;
    } else if (status === 'failed' || status === 'refunded') {
      const reason = status === 'refunded' ? 'refunded' : 'declined';
      redirectUrl = `${frontendBaseUrl}/cart/payment-failed?commandeId=${commandeId}&reason=${reason}`;
    }

    // Return callback response with redirect information
    res.json({
      success: status === 'paid',
      message: `Payment ${status} for commande ${commandeId}`,
      redirectUrl,
      paymentStatus: status,
      commandeStatus: commande.status,
    });
  } catch (err: any) {
    console.error('Payment callback error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
});

// GET /api/v1/payment/verify/:commandeId — Verify payment status (client-side)
router.get('/verify/:commandeId', async (req: Request, res: Response) => {
  try {
    const { commandeId } = req.params;

    if (!commandeId || Array.isArray(commandeId)) {
      return res.status(400).json({ message: 'Missing commandeId' });
    }

    const commande = await Commande.findByPk(commandeId);
    if (!commande) {
      return res.status(404).json({ message: 'Commande not found' });
    }

    const isPaid = commande.paymentStatus === 'paid';

    res.json({
      success: isPaid,
      paymentStatus: commande.paymentStatus,
      commandeStatus: commande.status,
      commandeId: commande.id,
      totalAmount: commande.totalAmount,
      isPaid,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
});

export default router;
