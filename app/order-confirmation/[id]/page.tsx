import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Package,
  Phone,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import type { Order, OrderItem } from "@/types/supabase";

// ---------------------------------------------------------------------------
// Data layer — single swap-point
// ---------------------------------------------------------------------------

interface OrderWithItems extends Order {
  order_items: (OrderItem & {
    products: {
      name: string;
      image_url: string;
      slug: string;
    } | null;
  })[];
}

async function fetchOrder(id: string): Promise<OrderWithItems | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        product_id,
        quantity,
        price,
        products (
          name,
          image_url,
          slug
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // no row found
    throw new Error(error.message);
  }

  return data as unknown as OrderWithItems;
}

// ---------------------------------------------------------------------------
// generateMetadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title: `Order confirmed — ${id.slice(0, 8).toUpperCase()} | SRMStore`,
    description: "Your order has been placed successfully.",
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let order: OrderWithItems | null = null;
  try {
    order = await fetchOrder(id);
  } catch {
    // Let Next.js show the 500 boundary rather than notFound
    throw new Error("Failed to load order.");
  }

  if (!order) notFound();

  const shortId = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero banner ── */}
        <section
          aria-label="Order confirmed"
          className="relative isolate overflow-hidden border-b border-border bg-background"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10
              bg-[radial-gradient(ellipse_70%_80%_at_50%_-20%,var(--color-secondary)_0%,transparent_70%)]"
          />
          <div
            aria-hidden="true"
            className="absolute -top-20 right-0 -z-10 h-64 w-64 rounded-full
              bg-success opacity-10 blur-3xl"
          />

          <div className="mx-auto flex max-w-7xl flex-col items-center gap-5
            px-4 pb-14 pt-16 text-center sm:px-6 lg:px-8">
            {/* Check icon */}
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

            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Order <span className="text-primary">confirmed!</span>
              </h1>
              <p className="text-base text-foreground/60">
                Thank you for your purchase. We&apos;re preparing your items.
              </p>
            </div>

            {/* Order ID pill */}
            <div
              className="inline-flex items-center gap-2 rounded-full border border-border
                bg-surface px-5 py-2 text-sm font-semibold text-foreground shadow-sm"
            >
              <Package size={14} className="text-primary" aria-hidden="true" />
              Order #{shortId}
            </div>
          </div>
        </section>

        {/* ── Detail grid ── */}
        <div className="mx-auto grid max-w-4xl gap-6 px-4 py-10 sm:px-6 lg:px-8
          lg:grid-cols-[1fr_320px]">

          {/* ── LEFT: Items ── */}
          <section aria-label="Items ordered">
            <div className="rounded-2xl border border-border bg-surface shadow-sm">
              <header className="border-b border-border px-6 py-4">
                <h2 className="text-base font-bold text-foreground">
                  Items ordered
                </h2>
              </header>

              <ul className="divide-y divide-border">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 px-6 py-4">
                    {/* Image */}
                    <div
                      className="relative h-16 w-16 shrink-0 overflow-hidden
                        rounded-xl bg-muted"
                    >
                      {item.products?.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.products.image_url}
                          alt={item.products.name ?? ""}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.products?.name ?? "Product"}
                      </p>
                      <p className="text-xs text-foreground/50">
                        Qty {item.quantity} &times; ₹{item.price.toLocaleString("en-IN")}
                      </p>
                    </div>

                    {/* Line total */}
                    <p className="shrink-0 text-sm font-bold text-foreground">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </li>
                ))}
              </ul>

              {/* Totals */}
              <footer className="flex flex-col gap-2 border-t border-border px-6 py-4 text-sm">
                <div className="flex justify-between text-foreground/60">
                  <span>Items total</span>
                  <span>₹{order.total_amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3 text-base font-extrabold text-foreground">
                  <span>Order total</span>
                  <span className="text-primary">
                    ₹{order.total_amount.toLocaleString("en-IN")}
                  </span>
                </div>
              </footer>
            </div>
          </section>

          {/* ── RIGHT: Shipping + status ── */}
          <aside aria-label="Shipping and order status">
            <div className="flex flex-col gap-4">

              {/* Shipping card */}
              <div className="rounded-2xl border border-border bg-surface shadow-sm">
                <header className="border-b border-border px-5 py-4">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <MapPin size={14} className="text-primary" aria-hidden="true" />
                    Shipping to
                  </h2>
                </header>
                <div className="flex flex-col gap-1 px-5 py-4 text-sm text-foreground/70">
                  <p className="font-semibold text-foreground">
                    {order.shipping_name}
                  </p>
                  <p>{order.shipping_address}</p>
                  <p>
                    {order.shipping_city} — {order.shipping_postal_code}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-foreground/50">
                    <Phone size={12} aria-hidden="true" />
                    {order.shipping_phone}
                  </p>
                </div>
              </div>

              {/* Status card */}
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold text-foreground">
                  Order status
                </h2>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full bg-success"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium capitalize text-foreground/70">
                    {order.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-foreground/40">
                  Placed on{" "}
                  {new Date(order.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* CTA */}
              <Link
                href="/products"
                id="order-confirmation-continue-btn"
                className="group inline-flex w-full items-center justify-center gap-2
                  rounded-full bg-primary px-6 py-3.5 text-sm font-semibold
                  text-primary-foreground shadow-md shadow-primary/25
                  transition-all duration-200
                  hover:brightness-110 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/35
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Continue shopping
                <ArrowRight
                  size={15}
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
