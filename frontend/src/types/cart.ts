import { Product } from './product';

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedMaterial?: string;
  displaySize?: string;
  pieceId?: string;
  pieceName?: string;
  pieceImage?: string;
  colorName?: string;
  product?: Product;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  grandTotal: number;
  itemCount: number;
  items: CartItem[];
}

export interface AddToCartPayload {
  productId: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedMaterial?: string;
  selectedItemId?: string;
}

export interface UpdateCartItemPayload {
  quantity: number;
}
