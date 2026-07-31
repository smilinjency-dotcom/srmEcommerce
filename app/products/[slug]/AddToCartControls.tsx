"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart, LogIn, CheckCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { signInWithGoogle } from "@/lib/firebase";

interface AddToCartControlsProps {
  productId: string;
  productName: string;
}

export default function AddToCartControls({
  productId,
  productName,
}: AddToCartControlsProps) {
  const { user } = useAuth();
  const { addToCart, openDrawer } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [status, setStatus]     = useState<"idle" | "adding" | "added">("idle");

  function decrement() {
    setQuantity((prev) => Math.max(1, prev - 1));
  }

  function increment() {
    setQuantity((prev) => Math.min(99, prev + 1));
  }

  async function handleAddToCart() {
    // Not signed in — trigger Google sign-in first
    if (!user) {
      await signInWithGoogle();
      return;
    }

    setStatus("adding");
    await addToCart(productId, quantity);
    setStatus("added");
    openDrawer();

    // Reset label after 2 s
    setTimeout(() => setStatus("idle"), 2000);
  }

  const isAdding = status === "adding";
  const isAdded  = status === "added";

  return (
    <div className="flex flex-col gap-4">
      {/* ── Quantity selector ── */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-foreground/60">Quantity</span>

        <div
          className="flex items-center gap-0 overflow-hidden rounded-full border border-border
            bg-background shadow-sm"
          role="group"
          aria-label="Quantity selector"
        >
          <button
            id="product-detail-qty-decrement"
            type="button"
            onClick={decrement}
            disabled={quantity <= 1 || isAdding}
            aria-label="Decrease quantity"
            className="flex h-10 w-10 items-center justify-center text-foreground/60
              transition-colors hover:bg-secondary hover:text-primary
              disabled:cursor-not-allowed disabled:opacity-30
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-inset"
          >
            <Minus size={15} aria-hidden="true" />
          </button>

          <output
            id="product-detail-qty-display"
            aria-live="polite"
            aria-atomic="true"
            className="w-10 select-none text-center text-base font-bold text-foreground"
          >
            {quantity}
          </output>

          <button
            id="product-detail-qty-increment"
            type="button"
            onClick={increment}
            disabled={quantity >= 99 || isAdding}
            aria-label="Increase quantity"
            className="flex h-10 w-10 items-center justify-center text-foreground/60
              transition-colors hover:bg-secondary hover:text-primary
              disabled:cursor-not-allowed disabled:opacity-30
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-inset"
          >
            <Plus size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Sign-in nudge (shown only when not signed in) ── */}
      {!user && (
        <p className="flex items-center gap-1.5 text-xs text-foreground/50">
          <LogIn size={12} aria-hidden="true" />
          You&apos;ll be asked to sign in before adding to cart.
        </p>
      )}

      {/* ── Add to Cart button ── */}
      <button
        id="product-detail-add-to-cart-btn"
        type="button"
        onClick={handleAddToCart}
        disabled={isAdding}
        aria-label={
          !user
            ? "Sign in to add to cart"
            : `Add ${quantity} × ${productName} to cart`
        }
        className={`group inline-flex w-full items-center justify-center gap-2.5
          rounded-full px-8 py-4 text-base font-semibold
          shadow-lg transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-primary focus-visible:ring-offset-2
          active:translate-y-0 active:brightness-100
          disabled:cursor-wait
          ${
            isAdded
              ? "bg-success text-white shadow-success/30 hover:brightness-110"
              : "bg-primary text-primary-foreground shadow-primary/30 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40"
          }`}
      >
        {isAdded ? (
          <>
            <CheckCircle size={18} aria-hidden="true" className="shrink-0" />
            Added to cart!
          </>
        ) : isAdding ? (
          <>
            {/* Spinner */}
            <svg
              aria-hidden="true"
              className="h-5 w-5 animate-spin shrink-0"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
              />
            </svg>
            Adding…
          </>
        ) : (
          <>
            <ShoppingCart
              size={18}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:-rotate-6 shrink-0"
            />
            {user ? "Add to Cart" : "Sign in to Add"}
          </>
        )}
      </button>
    </div>
  );
}
