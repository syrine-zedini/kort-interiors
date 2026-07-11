import { CartItem } from '../models/cart_item.model';
import { Commande } from '../models/commande.model';
import { CommandeItem } from '../models/commande_item.model';
import { User } from '../models/user.model';
import { calculateCartTotals } from './cart.service';
import * as joolanService from './joolan.service';

const OOPOS_MAGASIN = process.env.OOPOS_MAGASIN || 'SOUKRA';

/** Strip "oopos-" prefix → raw OOPOS product code */
function getProductCode(productId: string): string {
  return productId.startsWith('oopos-') ? productId.replace('oopos-', '') : productId;
}

/** Strip encoded piece format "__item__:{id}:{size}" → clean size string */
function cleanSize(selectedSize?: string | null): string {
  if (!selectedSize) return '';
  if (selectedSize.startsWith('__item__:')) {
    const parts = selectedSize.replace('__item__:', '').split(':');
    return parts.slice(1).join(':') || '';
  }
  return selectedSize;
}

export const placeOrder = async (
  userId: string,
  shippingAddress?: any,
  _billingAddress?: any,
  paymentMethod?: string
) => {
  if (!shippingAddress) throw new Error('Shipping address is required');

  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');
  if (!user.phoneNumber) throw new Error('Phone number is required');

  const cartItems = await CartItem.findAll({ where: { userId } });
  if (cartItems.length === 0) throw new Error('Cart is empty');

  const totals = await calculateCartTotals(userId);

  // Build OOPOS ticket per the official import-tickets.do spec
  const ticketId = `KORT-${Date.now()}`;

  const modeRegCB = process.env.OOPOS_MODEREG_CB || '300';   // CARTES
  const modeRegESP = process.env.OOPOS_MODEREG_ESP || '100'; // ESPECES

  const ooposTicket: any = {
    ID: ticketId,
    Caisse: 1,
    Nature: 'VENTE',
    Vendeur: process.env.OOPOS_VENDEUR || 'SARA',
    Lignes: cartItems.map((item) => ({
      Produit: getProductCode(item.productId),
      Couleur: item.selectedColor || '',
      Taille: cleanSize(item.selectedSize),
      Quantite: item.quantity,
      Prix_Vente: Number(item.priceAtPurchase),
      Remise_Vente: 0,
    })),
    Reglements: [
      {
        ModeReg: paymentMethod === 'on_delivery' ? modeRegESP : modeRegCB,
        Libelle: paymentMethod === 'on_delivery' ? 'PAIEMENT A LA LIVRAISON' : 'CARTE BANCAIRE',
        Montant: totals.subtotal,
      },
    ],
  };

  ooposTicket.Magasin = OOPOS_MAGASIN;

  // Send to OOPOS — wrap in try/catch to surface the real OOPOS error message
  let ooposResult: any;
  try {
    ooposResult = await joolanService.importTickets([ooposTicket], {
      Magasins_Stocks: "'SOUKRA','MARSA'",
    });
  } catch (err: any) {
    const ooposMsg =
      err?.response?.data?.error_message ??
      err?.response?.data?.message ??
      err?.message ??
      'Erreur OOPOS inconnue';
    throw new Error(`OOPOS a refusé la commande : ${ooposMsg}`);
  }

  if (ooposResult?.result === 'ko') {
    // Per the Joolan doc, per-ticket errors are in data[].Erreur
    const ticketError =
      ooposResult?.data?.[0]?.Erreur ??
      ooposResult?.error_message ??
      JSON.stringify(ooposResult?.data ?? ooposResult);
    throw new Error(`OOPOS a refusé la commande : ${ticketError}`);
  }

  // OOPOS returns the assigned ticket number in data[0].Entete
  const entete = ooposResult?.data?.[0]?.Entete ?? null;

  // Save a reference record in PostgreSQL so the orders page can display history
  const commande = await Commande.create({
    userId,
    status: 'pending',
    totalAmount: totals.subtotal,
    shippingAddress: { address: shippingAddress },
    paymentMethod: paymentMethod || 'on_delivery',
    // 'unpaid' dans tous les cas : pour le paiement en ligne (ClicToPay), le passage à
    // 'paid' se fait uniquement après vérification réelle via getOrderStatusExtended.do
    // (voir backend/src/routes/clictopay.route.ts), jamais de manière optimiste ici.
    paymentStatus: 'unpaid',
    trackingNumber: entete ? String(entete) : ticketId,
  });

  await Promise.all(cartItems.map((item) =>
    CommandeItem.create({
      commandeId: commande.id,
      productId: item.productId,
      quantity: item.quantity,
      priceAtPurchase: Number(item.priceAtPurchase),
      selectedSize: item.selectedSize ?? undefined,
      selectedColor: item.selectedColor ?? undefined,
    })
  ));

  // Clear the cart now that OOPOS has the order
  await CartItem.destroy({ where: { userId } });

  return {
    success: true,
    entete,
    id: ticketId,
    commandeId: commande.id,
    message: entete
      ? `Commande enregistrée dans OOPOS (ticket n°${entete})`
      : 'Commande enregistrée dans OOPOS',
  };
};
