"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import { CartItem, CartTotals } from "@/types/cart";
import { useAuth } from "@/contexts/AuthContext";

// Snapshot passed by the caller (product page) so a guest item can be
// displayed immediately without an extra round-trip to the server.
export interface GuestCartSnapshot {
  unitPrice: number;
  productName?: string;
  productImages?: string[];
  pieceName?: string;
  pieceImage?: string;
  colorName?: string;
  displaySize?: string;
}

export const GUEST_CART_KEY = "kort_guest_cart";

const readGuestCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeGuestCart = (items: CartItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode, quota) — guest cart just won't persist.
  }
};

const computeGuestTotals = (items: CartItem[]): CartTotals => {
  const subtotal = items.reduce((sum, i) => sum + Number(i.priceAtPurchase) * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const shipping = subtotal > 0 && subtotal < 100 ? 10 : 0;
  const grandTotal = Math.round((subtotal + shipping) * 100) / 100;
  return { subtotal, shipping, grandTotal, itemCount, items };
};

interface CartContextType {
  items: CartItem[];
  totals: CartTotals | null;
  isLoading: boolean;
  error: string | null;
  addToCart: (
    productId: string,
    quantity: number,
    selectedSize?: string,
    selectedColor?: string,
    selectedItemId?: string,
    selectedMaterial?: string,
    guestSnapshot?: GuestCartSnapshot
  ) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  fetchTotals: () => Promise<void>;
  placeOrder: (shippingAddress?: any, billingAddress?: any, paymentMethod?: string) => Promise<any>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const wasAuthenticatedRef = useRef(isAuthenticated);
  const [items, setItems] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState<CartTotals | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isProduction =
    process.env.NEXT_PUBLIC_IS_PRODUCTION === "true" ||
    process.env.NODE_ENV === "production";

  const hasToken = () => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("token"));
  };

  // Dynamically import axios when needed
  const getApi = useCallback(async () => {
    const { default: api } = await import("@/libs/axios");
    return api;
  }, []);

  // Fetch cart items
  const fetchCart = useCallback(async () => {
    try {
      if (!hasToken()) {
        setItems(readGuestCart());
        setError(null);
        return;
      }
      setIsLoading(true);
      setError(null);
      const api = await getApi();
      const response = await api.get<CartItem[]>("/cart");
      setItems(response.data);
    } catch (err: any) {
      // Handle 401 Unauthorized - user needs to re-authenticate
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setItems([]);
        const message = "Session expired. Please log in again.";
        setError(message);
        return;
      }
      const message = err?.response?.data?.message || "Failed to fetch cart";
      setError(message);
      if (!isProduction) {
        console.error("❌ Error fetching cart:", err);
        console.error("❌ Error details:", {
          status: err?.response?.status,
          statusText: err?.response?.statusText,
          data: err?.response?.data,
          headers: err?.config?.headers,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [getApi, isProduction]);

  // Fetch cart totals
  const fetchTotals = useCallback(async () => {
    try {
      if (!hasToken()) {
        setTotals(computeGuestTotals(readGuestCart()));
        return;
      }
      const api = await getApi();
      const response = await api.get<CartTotals>("/cart/totals");
      setTotals(response.data);
    } catch (err: any) {
      // Handle 401 Unauthorized
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTotals(null);
        return;
      }
      if (!isProduction) {
        console.error("Error fetching totals:", err);
      }
    }
  }, [getApi, isProduction]);

  // Add to cart
  const addToCart = useCallback(
    async (
      productId: string,
      quantity: number,
      selectedSize?: string,
      selectedColor?: string,
      selectedItemId?: string,
      selectedMaterial?: string,
      guestSnapshot?: GuestCartSnapshot
    ) => {
      try {
        setError(null);

        // Guest (not logged in yet): keep the item locally so nothing is lost
        // before the user eventually logs in at checkout time.
        if (!hasToken()) {
          const guestItems = readGuestCart();
          const matchIndex = guestItems.findIndex(
            (i) =>
              i.productId === productId &&
              (i.selectedSize ?? "") === (selectedSize ?? "") &&
              (i.selectedColor ?? "") === (selectedColor ?? "") &&
              (i.selectedMaterial ?? "") === (selectedMaterial ?? "") &&
              ((i as any).selectedItemId ?? "") === (selectedItemId ?? "")
          );

          if (matchIndex >= 0) {
            guestItems[matchIndex] = {
              ...guestItems[matchIndex],
              quantity: guestItems[matchIndex].quantity + quantity,
            };
          } else {
            guestItems.push({
              id: `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              userId: "guest",
              productId,
              quantity,
              priceAtPurchase: guestSnapshot?.unitPrice ?? 0,
              selectedSize,
              selectedColor,
              selectedMaterial,
              selectedItemId,
              displaySize: guestSnapshot?.displaySize ?? selectedSize,
              pieceName: guestSnapshot?.pieceName,
              pieceImage: guestSnapshot?.pieceImage,
              colorName: guestSnapshot?.colorName,
              product: {
                id: productId,
                name: guestSnapshot?.productName,
                images: guestSnapshot?.productImages,
              } as any,
            } as CartItem);
          }

          writeGuestCart(guestItems);
          setItems(guestItems);
          setTotals(computeGuestTotals(guestItems));
          return;
        }

        const api = await getApi();
        await api.post("/cart", {
          productId,
          quantity,
          selectedSize,
          selectedColor,
          selectedItemId,
          selectedMaterial,
        });
        await fetchCart();
        await fetchTotals();
      } catch (err: any) {
        const message = err?.response?.data?.message || "Failed to add item to cart";
        setError(message);
        if (!isProduction) {
          console.error("❌ Error adding to cart:", message);
          console.error("❌ Full error:", err);
        }
        throw err;
      }
    },
    [getApi, fetchCart, fetchTotals, isProduction]
  );

  // Update quantity
  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      try {
        setError(null);
        if (!hasToken()) {
          const guestItems = readGuestCart()
            .map((i) => (i.id === cartItemId ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0);
          writeGuestCart(guestItems);
          setItems(guestItems);
          setTotals(computeGuestTotals(guestItems));
          return;
        }
        const api = await getApi();
        await api.patch(`/cart/${cartItemId}`, { quantity });
        await fetchCart();
        await fetchTotals();
      } catch (err: any) {
        const message = err?.response?.data?.message || "Failed to update quantity";
        setError(message);
        throw err;
      }
    },
    [getApi, fetchCart, fetchTotals]
  );

  // Remove from cart
  const removeFromCart = useCallback(
    async (cartItemId: string) => {
      try {
        setError(null);
        if (!hasToken()) {
          const guestItems = readGuestCart().filter((i) => i.id !== cartItemId);
          writeGuestCart(guestItems);
          setItems(guestItems);
          setTotals(computeGuestTotals(guestItems));
          return;
        }
        const api = await getApi();
        await api.delete(`/cart/${cartItemId}`);
        await fetchCart();
        await fetchTotals();
      } catch (err: any) {
        const message = err?.response?.data?.message || "Failed to remove item";
        setError(message);
        throw err;
      }
    },
    [getApi, fetchCart, fetchTotals]
  );

  // Clear cart
  const clearCart = useCallback(async () => {
    try {
      setError(null);
      if (!hasToken()) {
        writeGuestCart([]);
        setItems([]);
        setTotals(null);
        return;
      }
      const api = await getApi();
      await api.delete("/cart");
      setItems([]);
      setTotals(null);
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to clear cart";
      setError(message);
      throw err;
    }
  }, [getApi]);

  // Place order
  const placeOrder = useCallback(
    async (shippingAddress?: any, billingAddress?: any, paymentMethod?: string) => {
      try {
        setError(null);
        const api = await getApi();
        const response = await api.post("/commandes", {
          shippingAddress,
          billingAddress,
          paymentMethod,
        });
        await fetchCart();
        await fetchTotals();
        return response.data;
      } catch (err: any) {
        const message = err?.response?.data?.message || "Failed to place order";
        setError(message);
        throw err;
      }
    },
    [getApi, fetchCart, fetchTotals]
  );

  // Fetch cart data on provider mount
  useEffect(() => {
    const initializeCart = async () => {
      await fetchCart();
      await fetchTotals();
    };
    initializeCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Merge the guest (localStorage) cart into the server cart right after login,
  // so items added before authenticating are never lost.
  const mergeGuestCart = useCallback(async () => {
    const guestItems = readGuestCart();
    if (guestItems.length === 0) return;
    try {
      const api = await getApi();
      for (const item of guestItems) {
        try {
          await api.post("/cart", {
            productId: item.productId,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
            selectedItemId: (item as any).selectedItemId,
            selectedMaterial: item.selectedMaterial,
          });
        } catch (err) {
          if (!isProduction) console.error("❌ Failed to merge guest cart item:", err);
        }
      }
    } finally {
      writeGuestCart([]);
    }
  }, [getApi, isProduction]);

  useEffect(() => {
    if (!wasAuthenticatedRef.current && isAuthenticated) {
      mergeGuestCart().then(() => {
        fetchCart();
        fetchTotals();
      });
    }
    wasAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated, mergeGuestCart, fetchCart, fetchTotals]);

  const value: CartContextType = {
    items,
    totals,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCart,
    fetchTotals,
    placeOrder,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
