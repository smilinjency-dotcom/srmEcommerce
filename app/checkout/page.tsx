"use client";

// ---------------------------------------------------------------------------
// Razorpay global type — the script appends `window.Razorpay` at runtime.
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

import { useState, useId, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Package,
  RefreshCw,
  ShoppingBag,
  XCircle,
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

/**
 * payment-cancelled — popup dismissed or Razorpay-level failure; order is
 *                      still 'pending'; user can reopen the same popup.
 * verify-failed     — popup completed but our server-side signature check
 *                      rejected it; show error + Try Again.
 * verifying         — POST /api/verify-razorpay-payment in flight.
 * success           — verify returned ok; showing success UI before redirect.
 */
type PaymentState =
  | { type: "idle" }
  | { type: "verifying" }
  | { type: "success" }
  | { type: "payment-cancelled"; orderId: string; message: string }
  | { type: "verify-failed"; message: string };

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  if (!fields.name.trim()) {
    errors.name = "Full name is required.";
  } else if (/\d/.test(fields.name)) {
    errors.name = "Full name cannot contain numbers.";
  } else if (!/^[a-zA-Z\s.'-]+$/.test(fields.name.trim())) {
    errors.name = "Full name can only contain letters and spaces.";
  }

  if (!fields.address.trim()) {
    errors.address = "Street address is required.";
  }

  if (!fields.city.trim()) {
    errors.city = "City is required.";
  } else if (/\d/.test(fields.city)) {
    errors.city = "City name cannot contain numbers.";
  } else if (!/^[a-zA-Z\s.'-]+$/.test(fields.city.trim())) {
    errors.city = "City can only contain letters and spaces.";
  }

  if (!fields.postal_code.trim()) {
    errors.postal_code = "Postal code is required.";
  } else if (/\D/.test(fields.postal_code.trim())) {
    errors.postal_code = "Postal code must contain numbers/integers only.";
  } else if (!/^\d{6}$/.test(fields.postal_code.trim())) {
    errors.postal_code = "Postal code must be a 6-digit integer.";
  }

  if (!fields.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (/\D/.test(fields.phone.trim())) {
    errors.phone = "Phone number must contain numbers only (no symbols or letters).";
  } else if (fields.phone.trim().length !== 10) {
    errors.phone = "Phone number must be exactly 10 digits.";
  } else if (!/^[6-9]\d{9}$/.test(fields.phone.trim())) {
    errors.phone = "Enter a valid 10-digit mobile number starting with 6-9.";
  }

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
  const [loadingRazorpay, setLoadingRazorpay] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>({ type: "idle" });

  // Persisted Razorpay popup config so we can reopen the *same* order on retry
  const rzpConfigRef = useRef<Record<string, unknown> | null>(null);

  function set(key: keyof FormFields, sanitize?: (val: string) => string) {
    return (value: string) => {
      const cleanValue = sanitize ? sanitize(value) : value;
      setFields((prev) => ({ ...prev, [key]: cleanValue }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };
  }

  /** Dynamically inject the Razorpay checkout.js script once. */
  function loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) { resolve(); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload  = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay script."));
      document.body.appendChild(script);
    });
  }

  /**
   * Opens (or re-opens) the Razorpay popup using the config stored in
   * rzpConfigRef. Returns a Promise that:
   *   - resolves when verify succeeds and router.push() has been called
   *   - rejects with a typed reason so the caller can set paymentState
   */
  const openRazorpayPopup = useCallback(
    (config: Record<string, unknown>): Promise<void> =>
      new Promise((resolve, reject) => {
        const rzp = new window.Razorpay(config);
        rzp.open();
        // resolve / reject are called from within handler / ondismiss
        void resolve; // suppress unused var — they're called via the config closures
        void reject;
      }),
    []
  );

  /**
   * Build the Razorpay options object. The `handler` and `modal.ondismiss`
   * callbacks close over `supabaseOrderId` and the `resolve`/`reject` of the
   * enclosing Promise, so we build this fresh each time `openPopup` is called.
   */
  function buildRzpOptions(
    supabaseOrderId: string,
    razorpayOrderId: string,
    amount: number,
    currency: string,
    resolve: () => void,
    reject: (err: Error & { kind?: string }) => void
  ): Record<string, unknown> {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!keyId) throw new Error("NEXT_PUBLIC_RAZORPAY_KEY_ID is not set.");

    return {
      key: keyId,
      order_id: razorpayOrderId,
      amount,
      currency,
      name: "SRMStore",
      description: `Order #${supabaseOrderId.slice(0, 8).toUpperCase()}`,
      prefill: {
        name: fields.name.trim(),
        contact: fields.phone.trim(),
        ...(user?.email ? { email: user.email } : {}),
      },
      theme: { color: "#6C63FF" }, // --color-primary from design system

      // ── Payment success ────────────────────────────────────────────────────
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        setPaymentState({ type: "verifying" });
        try {
          const verifyRes = await fetch("/api/verify-razorpay-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            }),
          });
          const verifyJson = await verifyRes.json();

          if (!verifyRes.ok || !verifyJson.success) {
            // Verification rejected — signature mismatch or server error
            const verifyErr = Object.assign(
              new Error(verifyJson.error ?? "Payment verification failed."),
              { kind: "verify-failed" }
            );
            reject(verifyErr);
            return;
          }

          // All good — show success flash then navigate
          setPaymentState({ type: "success" });
          setTimeout(() => {
            router.push(`/order-confirmation/${verifyJson.data.order_id}`);
          }, 800); // brief moment to let the success UI render
          resolve();
        } catch (err) {
          const verifyErr = Object.assign(
            err instanceof Error ? err : new Error("Verification error."),
            { kind: "verify-failed" }
          );
          reject(verifyErr);
        }
      },

      // ── Popup dismissed / payment declined ────────────────────────────────
      modal: {
        ondismiss: async () => {
          // Confirm the order is still 'pending' before telling the user to retry
          try {
            const statusRes = await fetch(`/api/order-status/${supabaseOrderId}`);
            const statusJson = await statusRes.json();
            const status: string = statusJson?.data?.status ?? "pending";

            if (status === "paid") {
              // Edge case: payment completed but handler didn't fire yet
              setPaymentState({ type: "success" });
              setTimeout(() => router.push(`/order-confirmation/${supabaseOrderId}`), 800);
              resolve();
            } else {
              // Order still pending — let user retry the popup
              const dismissErr = Object.assign(
                new Error("Payment was not completed. You can try again."),
                { kind: "payment-cancelled" }
              );
              reject(dismissErr);
            }
          } catch {
            // Couldn't confirm status — default to showing retry
            const dismissErr = Object.assign(
              new Error("Payment was not completed. You can try again."),
              { kind: "payment-cancelled" }
            );
            reject(dismissErr);
          }
        },
      },
    };
  }

  /**
   * Opens a Razorpay popup for the given IDs and handles success / failure.
   * Returns false if an error was surfaced (caller should not continue).
   */
  async function openPaymentPopup(
    supabaseOrderId: string,
    razorpayOrderId: string,
    amount: number,
    currency: string
  ): Promise<boolean> {
    setLoadingRazorpay(true);
    await loadRazorpayScript();
    setLoadingRazorpay(false);

    setPaymentState({ type: "idle" });

    return new Promise<boolean>((outerResolve) => {
      const options = buildRzpOptions(
        supabaseOrderId,
        razorpayOrderId,
        amount,
        currency,
        () => outerResolve(true),
        (err: Error & { kind?: string }) => {
          if (err.kind === "payment-cancelled") {
            setPaymentState({
              type: "payment-cancelled",
              orderId: supabaseOrderId,
              message: err.message,
            });
          } else {
            // verify-failed or unknown
            setPaymentState({ type: "verify-failed", message: err.message });
          }
          outerResolve(false);
        }
      );
      rzpConfigRef.current = options;
      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  }

  /** Reopens the Razorpay popup for the pending order (retry path). */
  async function handleRetryPayment(supabaseOrderId: string) {
    if (!rzpConfigRef.current) return;
    setServerError(null);
    setPaymentState({ type: "idle" });

    // Fetch a fresh Razorpay order ID (the old one might be stale)
    setSubmitting(true);
    try {
      const rzpOrderRes = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: supabaseOrderId }),
      });
      const rzpOrderJson = await rzpOrderRes.json();
      if (!rzpOrderRes.ok || !rzpOrderJson.success) {
        setPaymentState({
          type: "verify-failed",
          message: rzpOrderJson.error ?? "Failed to reopen payment.",
        });
        return;
      }
      const { razorpay_order_id, amount, currency } = rzpOrderJson.data as {
        razorpay_order_id: string;
        amount: number;
        currency: string;
      };
      await openPaymentPopup(supabaseOrderId, razorpay_order_id, amount, currency);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Main submit ────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setPaymentState({ type: "idle" });

    // Validation
    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstKey = Object.keys(validationErrors)[0] as keyof FormFields;
      document.getElementById(`${uid}-${firstKey}`)?.focus();
      return;
    }

    if (!user) { setServerError("You must be signed in to place an order."); return; }
    if (items.length === 0) { setServerError("Your cart is empty."); return; }

    setSubmitting(true);
    try {
      // Step 1 — Create Supabase order
      const orderRes = await fetch("/api/orders", {
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
      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.success) {
        setServerError(orderJson.error ?? "Failed to create order. Please try again.");
        return;
      }
      const supabaseOrderId: string = orderJson.data.order_id;

      // Step 2 — Create Razorpay order
      const rzpOrderRes = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: supabaseOrderId }),
      });
      const rzpOrderJson = await rzpOrderRes.json();
      if (!rzpOrderRes.ok || !rzpOrderJson.success) {
        setServerError(rzpOrderJson.error ?? "Failed to initialise payment. Please try again.");
        return;
      }
      const { razorpay_order_id, amount, currency } = rzpOrderJson.data as {
        razorpay_order_id: string;
        amount: number;
        currency: string;
      };

      // Steps 3-5 — open popup, verify, redirect
      setSubmitting(false); // spinner now driven by loadingRazorpay / paymentState
      await openPaymentPopup(supabaseOrderId, razorpay_order_id, amount, currency);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setServerError(msg);
    } finally {
      setSubmitting(false);
      setLoadingRazorpay(false);
    }
  }

  // ── Empty cart guard ───────────────────────────────────────────────────────
  if (!cartLoading && items.length === 0 && paymentState.type === "idle") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-20 text-center">
          <ShoppingBag size={56} className="text-primary/30" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-foreground">Your cart is empty</p>
            <p className="text-sm text-foreground/50">Add some products before checking out.</p>
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

  // ── Payment state overlays ─────────────────────────────────────────────────

  // Verifying in flight
  if (paymentState.type === "verifying") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-5 px-4 text-center">
          <Loader2
            size={48}
            className="animate-spin text-primary"
            aria-hidden="true"
          />
          <p className="text-lg font-semibold text-foreground">Verifying payment…</p>
          <p className="text-sm text-foreground/50">
            Please wait while we confirm your payment with Razorpay.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  // Payment verified — brief success flash before router.push fires
  if (paymentState.type === "success") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-5 px-4 text-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full
              bg-success/10 ring-4 ring-success/20"
          >
            <CheckCircle2
              size={40}
              className="text-success"
              aria-hidden="true"
              strokeWidth={1.75}
            />
          </div>
          <p className="text-xl font-bold text-foreground">Payment successful!</p>
          <p className="text-sm text-foreground/50">
            Redirecting you to your order confirmation…
          </p>
          <Loader2 size={18} className="animate-spin text-primary" aria-hidden="true" />
        </main>
        <Footer />
      </div>
    );
  }

  // Popup dismissed — order still pending, show retry UI
  if (paymentState.type === "payment-cancelled") {
    const { orderId, message } = paymentState;
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full
              bg-muted ring-4 ring-border"
          >
            <XCircle
              size={40}
              className="text-foreground/40"
              aria-hidden="true"
              strokeWidth={1.75}
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xl font-bold text-foreground">Payment not completed</p>
            <p className="max-w-sm text-sm text-foreground/60">{message}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              id="checkout-retry-payment-btn"
              type="button"
              onClick={() => handleRetryPayment(orderId)}
              disabled={submitting || loadingRazorpay}
              aria-busy={submitting || loadingRazorpay}
              className="group inline-flex items-center gap-2 rounded-full bg-primary
                px-7 py-3.5 text-sm font-semibold text-primary-foreground
                shadow-lg shadow-primary/30 transition-all duration-200
                hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting || loadingRazorpay ? (
                <>
                  <Loader2 size={16} aria-hidden="true" className="animate-spin" />
                  Opening payment…
                </>
              ) : (
                <>
                  <RefreshCw size={15} aria-hidden="true" />
                  Retry payment
                </>
              )}
            </button>

            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 rounded-full border border-border
                bg-surface px-6 py-3.5 text-sm font-semibold text-foreground
                transition-all duration-200 hover:border-primary/40 hover:text-primary"
            >
              Back to products
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Verify-failed — signature mismatch or server error
  if (paymentState.type === "verify-failed") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full
              bg-error/10 ring-4 ring-error/20"
          >
            <XCircle
              size={40}
              className="text-error"
              aria-hidden="true"
              strokeWidth={1.75}
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xl font-bold text-foreground">Payment verification failed</p>
            <p className="max-w-sm text-sm text-foreground/60">{paymentState.message}</p>
          </div>

          <div
            role="alert"
            className="flex max-w-sm items-start gap-2 rounded-xl border border-error/20
              bg-error/5 px-4 py-3 text-left text-sm font-medium text-error"
          >
            <AlertCircle size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
            If your account was charged, please contact support — your order
            will not be lost.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              id="checkout-try-again-btn"
              type="button"
              onClick={() => {
                setPaymentState({ type: "idle" });
                setServerError(null);
              }}
              className="group inline-flex items-center gap-2 rounded-full bg-primary
                px-7 py-3.5 text-sm font-semibold text-primary-foreground
                shadow-lg shadow-primary/30 transition-all duration-200
                hover:brightness-110 hover:-translate-y-0.5
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <ArrowRight size={15} aria-hidden="true" />
              Try again
            </button>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 rounded-full border border-border
                bg-surface px-6 py-3.5 text-sm font-semibold text-foreground
                transition-all duration-200 hover:border-primary/40 hover:text-primary"
            >
              Back to products
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Normal checkout form ───────────────────────────────────────────────────
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
                  onChange={set("name", (val) => val.replace(/[0-9]/g, ""))}
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
                    onChange={set("city", (val) => val.replace(/[0-9]/g, ""))}
                    error={errors.city}
                    placeholder="Chennai"
                    autoComplete="address-level2"
                  />
                  <Field
                    id={`${uid}-postal_code`}
                    label="Postal code"
                    value={fields.postal_code}
                    onChange={set("postal_code", (val) => val.replace(/\D/g, ""))}
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
                  onChange={set("phone", (val) => val.replace(/\D/g, ""))}
                  error={errors.phone}
                  placeholder="9876543210"
                  autoComplete="tel"
                  inputMode="numeric"
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
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.products?.name ?? "Product"}
                      </p>
                      <p className="text-xs text-foreground/50">Qty {item.quantity}</p>
                    </div>
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
                  <span className="text-primary">₹{orderTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Submit / payment button */}
              <button
                form="checkout-form"
                id="checkout-submit-btn"
                type="submit"
                disabled={submitting || cartLoading || loadingRazorpay}
                aria-busy={submitting || loadingRazorpay}
                className="group mt-1 inline-flex w-full items-center justify-center gap-2
                  rounded-full bg-primary px-6 py-4 text-base font-semibold
                  text-primary-foreground shadow-lg shadow-primary/30
                  transition-all duration-200
                  hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-y-0 disabled:shadow-none"
              >
                {loadingRazorpay ? (
                  <>
                    <Loader2 size={18} aria-hidden="true" className="animate-spin" />
                    Opening payment…
                  </>
                ) : submitting ? (
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