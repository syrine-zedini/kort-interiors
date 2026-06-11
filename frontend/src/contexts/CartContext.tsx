"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { CartItem, CartTotals } from "@/types/cart";

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
    selectedMaterial?: string
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
        setItems([]);
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
        setTotals(null);
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
      selectedMaterial?: string
    ) => {
      try {
        setError(null);
        const api = await getApi();
        const response = await api.post("/cart", {
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
