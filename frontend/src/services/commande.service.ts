import api from '@/libs/axios';

export interface CommandeItem {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  product?: {
    id: string;
    name: string;
    images?: string | string[];
  };
}

export interface Commande {
  id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus: string;
  createdAt: string;
  items?: CommandeItem[];
}

export const getMyOrders = async (): Promise<Commande[]> => {
  const response = await api.get('/commandes/me');
  return response.data;
};
