"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Package,
  ShoppingBag,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormFields {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
}

type FormErrors = Partial<Record<keyof FormFields, string>>;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  if (!fields.name.trim())
    errors.name = "Full name is required.";

  if (!fields.address.trim())
    errors.address = "Street address is required.";

  if (!fields.city.trim())
    errors.city = "City is required.";

  if (!fields.postal_code.trim())
    errors.postal_code = "Postal code is required.";
  else if (!/^\d{6}$/.test(fields.postal_code.trim()))
    errors.postal_code = "Enter a valid 6-digit postal code.";

  if (!fields.phone.trim())
    errors.phone = "Phone number is required.";
  else if (!/^[6-9]\d{9}$/.test(fields.phone.trim()))
    errors.phone = "Enter a valid 10-digit Indian mobile number.";

  return errors;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FieldError({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-error">
      <AlertCircle size={12} aria-hidden="true" className="shrink-0" />
      {message}
    </p>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-foreground/70">
        {label} <span className="text-error" aria-hidden="true">*</span>
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground
          placeholder-foreground/30 outline-none transition-all duration-200
          focus:ring-2 focus:ring-primary/25
          ${error
            ? "border-error focus:border-error"
            : "border-border focus:border-primary"
          }`}
      />
      {error && (
        <span id={`${id}-error`}>
          <FieldError message={error} />
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, subtotal, loading: cartLoading } = useCart();
  const uid = useId();

  const SHIPPING_FLAT = 99;
  const isFreeShipping = subtotal >= 999;
  const shippingCost = isFreeShipping ? 0 : SHIPPING_FLAT;
  const orderTotal = subtotal + shippingCost;

  const [fields, setFields] = useState<FormFields>({
    name: "",
    address: "",
    city: "",
    postal_code: "",
    phone: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function set(key: keyof FormFields) {
    return (value: string) => {
      setFields((prev) => ({ ...prev, [key]: value }));
      // Clear inline error on change
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Focus the first error field
      const firstKey = Object.keys(validationErrors)[0] as keyof FormFields;
      document.getElementById(`${uid}-${firstKey}`)?.focus();
      return;
    }

    if (!user) {
      setServerError("You must be signed in to place an order.");
      return;
    }

    if (items.length === 0) {
      setServerError("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.uid,
          cart_items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.products?.price ?? 0,
          })),
          shipping: {
            name: fields.name.trim(),
            address: fields.address.trim(),
            city: fields.city.trim(),
            postal_code: fields.postal_code.trim(),
            phone: fields.phone.trim(),
          },
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setServerError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push(`/order-confirmation/${json.data.order_id}`);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Empty cart guard ──────────────────────────────────────────────────────
  if (!cartLoading && items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-20 text-center">
          <ShoppingBag size={56} className="text-primary/30" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-foreground">Your cart is empty</p>
            <p className="text-sm text-foreground/50">
              Add some products before checking out.
            </p>
          </div>
          <Link
            href="/products"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold
              text-primary-foreground shadow-md shadow-primary/25
              transition-all duration-200 hover:brightness-110"
          >
            Browse products
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* ── Page header ── */}
        <section
          aria-label="Checkout header"
          className="relative isolate overflow-hidden border-b border-border bg-background"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10
              bg-[radial-gradient(ellipse_70%_80%_at_50%_-20%,var(--color-secondary)_0%,transparent_70%)]"
          />
          <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 lg:px-8">
            <Link
              href="/products"
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium
                text-foreground/50 transition-colors hover:text-primary"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Back to products
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Check<span className="text-primary">out</span>
            </h1>
            <p className="mt-2 text-sm text-foreground/50">
              Review your order and enter your shipping details.
            </p>
          </div>
        </section>

        {/* ── Two-column layout ── */}
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_400px] lg:px-8">

          {/* ── LEFT: Shipping form ── */}
          <section aria-label="Shipping information">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-foreground">
                <Package size={18} className="text-primary" aria-hidden="true" />
                Shipping Details
              </h2>

              <form
                id="checkout-form"
                onSubmit={handleSubmit}
                noValidate
                className="flex flex-col gap-5"
              >
                <Field
                  id={`${uid}-name`}
                  label="Full name"
                  value={fields.name}
                  onChange={set("name")}
                  error={errors.name}
                  placeholder="Ravi Kumar"
                  autoComplete="name"
                />
                <Field
                  id={`${uid}-address`}
                  label="Street address"
                  value={fields.address}
                  onChange={set("address")}
                  error={errors.address}
                  placeholder="12, MG Road, Apartment 3B"
                  autoComplete="street-address"
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id={`${uid}-city`}
                    label="City"
                    value={fields.city}
                    onChange={set("city")}
                    error={errors.city}
                    placeholder="Chennai"
                    autoComplete="address-level2"
                  />
                  <Field
                    id={`${uid}-postal_code`}
                    label="Postal code"
                    value={fields.postal_code}
                    onChange={set("postal_code")}
                    error={errors.postal_code}
                    placeholder="600001"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    maxLength={6}
                  />
                </div>
                <Field
                  id={`${uid}-phone`}
                  label="Phone number"
                  value={fields.phone}
                  onChange={set("phone")}
                  error={errors.phone}
                  placeholder="9876543210"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={10}
                  type="tel"
                />

                {/* Server-level error */}
                {serverError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-error/20
                      bg-error/5 px-4 py-3 text-sm font-medium text-error"
                  >
                    <AlertCircle size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
                    {serverError}
                  </div>
                )}
              </form>
            </div>
          </section>

          {/* ── RIGHT: Order summary + submit ── */}
          <aside aria-label="Order summary">
            <div className="sticky top-24 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground">Order Summary</h2>

              {/* Item list */}
              <ul className="flex flex-col divide-y divide-border">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    {/* Product image */}
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.products?.image_url && (
                        <Image
                          src={item.products.image_url}
                          alt={item.products.name ?? ""}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    {/* Name + qty */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.products?.name ?? "Product"}
                      </p>
                      <p className="text-xs text-foreground/50">
                        Qty {item.quantity}
                      </p>
                    </div>
                    {/* Line total */}
                    <p className="shrink-0 text-sm font-semibold text-foreground">
                      ₹{((item.products?.price ?? 0) * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </li>
                ))}
              </ul>

              {/* Totals */}
              <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-foreground/60">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-foreground/60">
                  <span>Shipping</span>
                  <span>
                    {isFreeShipping ? (
                      <span className="font-semibold text-success">Free</span>
                    ) : (
                      `₹${shippingCost}`
                    )}
                  </span>
                </div>
                <div className="mt-1 flex justify-between border-t border-border pt-3 text-base font-extrabold text-foreground">
                  <span>Total</span>
                  <span className="text-primary">
                    ₹{orderTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Submit button */}
              <button
                form="checkout-form"
                id="checkout-submit-btn"
                type="submit"
                disabled={submitting || cartLoading}
                aria-busy={submitting}
                className="group mt-1 inline-flex w-full items-center justify-center gap-2
                  rounded-full bg-primary px-6 py-4 text-base font-semibold
                  text-primary-foreground shadow-lg shadow-primary/30
                  transition-all duration-200
                  hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-y-0 disabled:shadow-none"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} aria-hidden="true" className="animate-spin" />
                    Placing order…
                  </>
                ) : (
                  <>
                    Place Order
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-foreground/40">
                By placing your order you agree to our terms of service.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}