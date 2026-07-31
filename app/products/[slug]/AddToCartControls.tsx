"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";

interface AddToCartControlsProps {
  productName: string;
}

export default function AddToCartControls({ productName }: AddToCartControlsProps) {
  const [quantity, setQuantity] = useState(1);

  function decrement() {
    setQuantity((prev) => Math.max(1, prev - 1));
  }

  function increment() {
    setQuantity((prev) => Math.min(99, prev + 1));
  }

  function handleAddToCart() {
    // TODO: wire up cart context / state management
    console.log(`Add to cart: ${productName} × ${quantity}`);
  }

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
            disabled={quantity <= 1}
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
            disabled={quantity >= 99}
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

      {/* ── Add to Cart button ── */}
      <button
        id="product-detail-add-to-cart-btn"
        type="button"
        onClick={handleAddToCart}
        aria-label={`Add ${quantity} × ${productName} to cart`}
        className="group inline-flex w-full items-center justify-center gap-2.5
          rounded-full bg-primary px-8 py-4 text-base font-semibold
          text-primary-foreground shadow-lg shadow-primary/30
          transition-all duration-200
          hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-primary focus-visible:ring-offset-2
          active:translate-y-0 active:brightness-100"
      >
        <ShoppingCart
          size={18}
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:-rotate-6"
        />
        Add to Cart
      </button>
    </div>
  );
}
