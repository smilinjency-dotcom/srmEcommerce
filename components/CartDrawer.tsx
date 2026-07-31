"use client";

import Image from "next/image";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  LogIn,
  ArrowRight,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { signInWithGoogle } from "@/lib/firebase";

export default function CartDrawer() {
  const { items, subtotal, loading, drawerOpen, closeDrawer, updateQuantity, removeFromCart } =
    useCart();
  const { user } = useAuth();

  // ── Trap focus / close on Escape ──────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") closeDrawer();
  }

  if (!drawerOpen) return null;

  // ── Not signed in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <>
        {/* Backdrop */}
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm"
          onClick={closeDrawer}
        />

        {/* Drawer */}
        <aside
          role="dialog"
          aria-label="Shopping cart"
          aria-modal="true"
          onKeyDown={handleKeyDown}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col
            border-l border-border bg-surface shadow-2xl
            animate-[slideInRight_0.25s_ease-out]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-base font-bold text-foreground">Your Cart</h2>
            <button
              id="cart-drawer-close-btn"
              type="button"
              onClick={closeDrawer}
              aria-label="Close cart"
              className="flex h-8 w-8 items-center justify-center rounded-full
                text-foreground/50 transition-colors hover:bg-secondary hover:text-primary
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {/* Sign-in prompt */}
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <ShoppingBag size={28} className="text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Sign in to view your cart</p>
              <p className="mt-1 text-sm text-foreground/50">
                Your cart is saved to your account so you never lose it.
              </p>
            </div>
            <button
              id="cart-drawer-sign-in-btn"
              type="button"
              onClick={async () => { await signInWithGoogle(); }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5
                text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25
                transition-all duration-200 hover:brightness-110 hover:-translate-y-px"
            >
              <LogIn size={15} aria-hidden="true" />
              Sign in with Google
            </button>
          </div>
        </aside>

        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to   { transform: translateX(0); }
          }
        `}</style>
      </>
    );
  }

  // ── Signed in ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
        onKeyDown={handleKeyDown}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col
          border-l border-border bg-surface shadow-2xl
          animate-[slideInRight_0.25s_ease-out]"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-bold text-foreground">
            Your Cart
            {items.length > 0 && (
              <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </h2>
          <button
            id="cart-drawer-close-btn"
            type="button"
            onClick={closeDrawer}
            aria-label="Close cart"
            className="flex h-8 w-8 items-center justify-center rounded-full
              text-foreground/50 transition-colors hover:bg-secondary hover:text-primary
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading skeleton */}
          {loading && (
            <ul className="flex flex-col gap-0 divide-y divide-border" aria-label="Loading cart">
              {[1, 2, 3].map((n) => (
                <li key={n} className="flex gap-3 px-5 py-4 animate-pulse">
                  <div className="h-16 w-16 shrink-0 rounded-xl bg-muted" />
                  <div className="flex flex-1 flex-col gap-2 pt-1">
                    <div className="h-3 w-3/4 rounded-full bg-muted" />
                    <div className="h-3 w-1/3 rounded-full bg-muted" />
                    <div className="mt-auto h-8 w-28 rounded-full bg-muted" />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Empty state */}
          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 px-8 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <ShoppingBag size={28} className="text-primary/60" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Your cart is empty</p>
                <p className="mt-1 text-sm text-foreground/50">
                  Add some products to get started.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                id="cart-drawer-browse-btn"
                className="inline-flex items-center gap-1.5 rounded-full border border-primary
                  px-5 py-2 text-sm font-semibold text-primary transition-all duration-200
                  hover:bg-primary hover:text-primary-foreground"
              >
                Browse products
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Items list */}
          {!loading && items.length > 0 && (
            <ul
              className="flex flex-col divide-y divide-border"
              aria-label="Cart items"
            >
              {items.map((item) => {
                const product = item.products;
                return (
                  <li
                    key={item.id}
                    id={`cart-item-${item.id}`}
                    className="flex gap-3 px-5 py-4"
                  >
                    {/* Product image */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {product?.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name ?? "Product"}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingBag size={20} className="text-foreground/20" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {product?.name ?? "Unknown product"}
                      </p>
                      <p className="text-sm font-bold text-primary">
                        ₹{((product?.price ?? 0) * item.quantity).toLocaleString("en-IN")}
                      </p>

                      {/* Quantity controls + remove */}
                      <div className="flex items-center gap-2">
                        {/* Decrement */}
                        <button
                          id={`cart-qty-dec-${item.id}`}
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={item.quantity <= 1}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full
                            border border-border text-foreground/60
                            transition-colors hover:border-primary hover:text-primary
                            disabled:cursor-not-allowed disabled:opacity-30
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <Minus size={12} aria-hidden="true" />
                        </button>

                        {/* Qty display */}
                        <output
                          aria-live="polite"
                          className="w-6 select-none text-center text-sm font-bold text-foreground"
                        >
                          {item.quantity}
                        </output>

                        {/* Increment */}
                        <button
                          id={`cart-qty-inc-${item.id}`}
                          type="button"
                          aria-label="Increase quantity"
                          disabled={item.quantity >= 99}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full
                            border border-border text-foreground/60
                            transition-colors hover:border-primary hover:text-primary
                            disabled:cursor-not-allowed disabled:opacity-30
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <Plus size={12} aria-hidden="true" />
                        </button>

                        {/* Remove */}
                        <button
                          id={`cart-remove-${item.id}`}
                          type="button"
                          aria-label={`Remove ${product?.name ?? "item"} from cart`}
                          onClick={() => removeFromCart(item.id)}
                          className="ml-auto flex h-7 w-7 items-center justify-center rounded-full
                            text-foreground/40 transition-colors
                            hover:bg-error/10 hover:text-error
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
                        >
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Footer: subtotal + checkout ── */}
        {!loading && items.length > 0 && (
          <div className="border-t border-border bg-surface px-5 py-5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground/60">Subtotal</span>
              <span className="text-lg font-extrabold text-foreground">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>
            <a
              href="/checkout"
              id="cart-drawer-checkout-btn"
              className="flex w-full items-center justify-center gap-2 rounded-full
                bg-primary py-3.5 text-sm font-semibold text-primary-foreground
                shadow-md shadow-primary/25 transition-all duration-200
                hover:brightness-110 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/35
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Proceed to checkout
              <ArrowRight size={15} aria-hidden="true" />
            </a>
            <p className="mt-3 text-center text-xs text-foreground/40">
              Taxes & shipping calculated at checkout
            </p>
          </div>
        )}
      </aside>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
