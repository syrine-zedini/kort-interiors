import { useEffect, useState } from "react";
import { useCart as useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { CartItem } from "@/types/cart";

// Re-export the main useCart hook
export const useCart = useCartContext;

/**
 * Hook for managing individual cart item interactions
 * This is a convenience hook that wraps common cart operations
 */
export const useCartItem = (cartItemId: string) => {
  const { updateQuantity, removeFromCart } = useCartContext();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleUpdateQuantity = async (quantity: number) => {
    try {
      setIsUpdating(true);
      await updateQuantity(cartItemId, quantity);
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    try {
      setIsRemoving(true);
      await removeFromCart(cartItemId);
    } catch (error) {
      console.error("Error removing item:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  const incrementQuantity = async (currentQuantity: number) => {
    return handleUpdateQuantity(currentQuantity + 1);
  };

  const decrementQuantity = async (currentQuantity: number) => {
    if (currentQuantity > 1) {
      return handleUpdateQuantity(currentQuantity - 1);
    } else {
      return handleRemove();
    }
  };

  return {
    updateQuantity: handleUpdateQuantity,
    removeFromCart: handleRemove,
    incrementQuantity,
    decrementQuantity,
    isUpdating,
    isRemoving,
  };
};

/**
 * Hook for adding items to cart
 * Allows both authenticated and guest users to add items
 */
export const useAddToCart = () => {
  const { addToCart } = useCartContext();
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleAddToCart = async (
    productId: string,
    quantity: number,
    selectedSize?: string,
    selectedColor?: string,
    selectedItemId?: string,
    selectedMaterial?: string
  ) => {
    try {
      setIsAdding(true);
      setAddError(null);
      await addToCart(productId, quantity, selectedSize, selectedColor, selectedItemId, selectedMaterial);
      return true;
    } catch (error: any) {
      const message = error?.response?.data?.message || "Impossible d'ajouter l'article au panier";
      setAddError(message);
      throw error;
    } finally {
      setIsAdding(false);
    }
  };

  return {
    addToCart: handleAddToCart,
    isAdding,
    error: addError,
    clearError: () => setAddError(null),
  };
};

/**
 * Hook for accessing cart totals with automatic refresh
 */
export const useCartTotals = () => {
  const { totals, fetchTotals, isLoading } = useCartContext();

  useEffect(() => {
    if (!totals) {
      fetchTotals();
    }
  }, [totals, fetchTotals]);

  return {
    totals,
    isLoading,
    refetch: fetchTotals,
  };
};

/**
 * Hook for finding specific cart items
 */
export const useCartItemByProduct = (productId: string): CartItem | undefined => {
  const { items } = useCartContext();
  return items.find((item) => item.productId === productId);
};

/**
 * Hook to check if product is in cart
 */
export const useIsInCart = (productId: string): boolean => {
  const item = useCartItemByProduct(productId);
  return !!item;
};

/**
 * Hook to get quantity of product in cart
 */
export const useCartQuantity = (productId: string): number => {
  const item = useCartItemByProduct(productId);
  return item?.quantity || 0;
};
