import axios from 'axios';
import https from 'https';
import tls from 'tls';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.CLICTOPAY_API_URL || 'https://test.clictopay.com/payment/rest/';
const USERNAME = process.env.CLICTOPAY_USERNAME;
const PASSWORD = process.env.CLICTOPAY_PASSWORD;

if (!USERNAME || !PASSWORD) {
  console.warn("⚠️ Attention : CLICTOPAY_USERNAME ou CLICTOPAY_PASSWORD manquant dans le fichier .env");
}

// Le serveur ClicToPay ne renvoie pas le certificat intermédiaire Sectigo dans la
// poignée de main TLS (chaîne incomplète). Les navigateurs/curl le tolèrent car l'OS
// reconstruit la chaîne automatiquement, mais Node (OpenSSL pur) le rejette avec
// "unable to verify the first certificate". On complète donc explicitement la chaîne
// avec l'intermédiaire officiel Sectigo, en plus des CA racines standard de Node —
// la vérification TLS reste pleinement active, on ne fait que fournir le maillon manquant.
const intermediateCertPath = path.join(__dirname, '../certs/sectigo-public-server-auth-ca-dv-r36.pem');
const httpsAgent = new https.Agent({
  ca: [...tls.rootCertificates, fs.readFileSync(intermediateCertPath, 'utf8')],
});

const clictopayClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  httpsAgent,
});

const buildBody = (data: Record<string, any>): string => {
  const params = new URLSearchParams();
  params.set('userName', USERNAME || '');
  params.set('password', PASSWORD || '');
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.set(key, String(value));
  });
  return params.toString();
};

/**
 * register.do — Enregistre une commande auprès de ClicToPay et retourne
 * un orderId (UUID ClicToPay) + formUrl (page de paiement hébergée à afficher au client).
 * amount est exprimé en TND, converti ici en millimes (unité minimale attendue par l'API).
 */
export const registerOrder = async (params: {
  orderNumber: string;
  amount: number;
  currency?: string;
  returnUrl: string;
  failUrl?: string;
  description?: string;
  language?: string;
  pageView?: 'DESKTOP' | 'MOBILE';
}) => {
  const body = buildBody({
    orderNumber: params.orderNumber,
    amount: Math.round(params.amount * 1000),
    currency: params.currency || '788',
    returnUrl: params.returnUrl,
    failUrl: params.failUrl || params.returnUrl,
    description: params.description,
    language: params.language || 'fr',
    pageView: params.pageView,
  });

  try {
    const response = await clictopayClient.post('register.do', body);
    return response.data;
  } catch (error: any) {
    console.error('Erreur ClicToPay register.do:', error.message);
    throw error;
  }
};

/**
 * getOrderStatusExtended.do — Consulte le statut réel d'une commande.
 * Obligatoire après chaque redirection returnUrl/failUrl avant de confirmer un paiement :
 * orderStatus === 2 est le seul indicateur fiable de paiement accepté.
 */
export const getOrderStatus = async (params: {
  orderId?: string;
  orderNumber?: string;
  language?: string;
}) => {
  const body = buildBody({
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    language: params.language || 'fr',
  });

  try {
    const response = await clictopayClient.post('getOrderStatusExtended.do', body);
    return response.data;
  } catch (error: any) {
    console.error('Erreur ClicToPay getOrderStatusExtended.do:', error.message);
    throw error;
  }
};
