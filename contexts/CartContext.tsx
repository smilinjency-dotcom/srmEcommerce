"use client";

/**
 * contexts/CartContext.tsx
 *
 * Manages cart state for the currently signed-in Firebase user.
 * All persistence goes through /api/cart (never directly to Supabase).
 *
 * Exposed via useCart():
 *   items        — CartItem rows joined with product snapshot fields
 *   itemCount    — total number of distinct items in the cart
 *   subtotal     — computed ₹ total (price × quantity for every item)
 *   loading      — true while the initial fetch is in flight
 *   drawerOpen   — whether the cart drawer is visible
 *   openDrawer() / closeDrawer()
 *   addToCart(productId, quantity)
 *   updateQuantity(itemId, quantity)
 *   removeFromCart(itemId)
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape returned by GET /api/cart (cart_items joined with products) */
export interface CartItemWithProduct {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  products: {
    name: string;
    price: number;
    image_url: string;
    slug: string;
  } | null;
}

interface CartContextValue {
  items: CartItemWithProduct[];
  itemCount: number;
  subtotal: number;
  loading: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CartContext = createContext<CartContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [items, setItems]           = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading]       = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Keep a ref so async callbacks always see the latest uid
  const uidRef = useRef<string | null>(null);
  uidRef.current = user?.uid ?? null;

  // ── Fetch cart from API ────────────────────────────────────────────────
  const fetchCart = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cart?user_id=${encodeURIComponent(uid)}`);
      if (!res.ok) throw new Error("Failed to load cart");
      const json = await res.json();
      setItems((json.data as CartItemWithProduct[]) ?? []);
    } catch (e) {
      console.error("[CartContext] fetchCart:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch whenever the signed-in user changes
  useEffect(() => {
    if (user?.uid) {
      fetchCart(user.uid);
    } else {
      setItems([]);
    }
  }, [user?.uid, fetchCart]);

  // ── Computed values ────────────────────────────────────────────────────
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal  = items.reduce(
    (sum, i) => sum + (i.products?.price ?? 0) * i.quantity,
    0
  );

  // ── addToCart ──────────────────────────────────────────────────────────
  const addToCart = useCallback(
    async (productId: string, quantity: number) => {
      const uid = uidRef.current;
      if (!uid) return;

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid, product_id: productId, quantity }),
      });
      if (!res.ok) {
        console.error("[CartContext] addToCart failed", await res.json());
        return;
      }
      // Re-fetch to get the joined product fields
      await fetchCart(uid);
    },
    [fetchCart]
  );

  // ── updateQuantity ─────────────────────────────────────────────────────
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      const uid = uidRef.current;
      if (!uid) return;

      // Optimistic update
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
      );

      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, quantity }),
      });
      if (!res.ok) {
        console.error("[CartContext] updateQuantity failed");
        await fetchCart(uid); // rollback
      }
    },
    [fetchCart]
  );

  // ── removeFromCart ─────────────────────────────────────────────────────
  const removeFromCart = useCallback(
    async (itemId: string) => {
      const uid = uidRef.current;
      if (!uid) return;

      // Optimistic update
      setItems((prev) => prev.filter((i) => i.id !== itemId));

      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId }),
      });
      if (!res.ok) {
        console.error("[CartContext] removeFromCart failed");
        await fetchCart(uid); // rollback
      }
    },
    [fetchCart]
  );

  const openDrawer  = useCallback(() => setDrawerOpen(true),  []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        loading,
        drawerOpen,
        openDrawer,
        closeDrawer,
        addToCart,
        updateQuantity,
        removeFromCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
