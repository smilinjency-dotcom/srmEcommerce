import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Product } from "@/app/api/products/[slug]/route";
import AddToCartControls from "./AddToCartControls";

// ---------------------------------------------------------------------------
// Data layer — single swap-point for the real Supabase call later
// ---------------------------------------------------------------------------

async function getProduct(slug: string): Promise<Product | null> {
  // Fetch from our own route handler (absolute URL required in Server Components)
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/products/${encodeURIComponent(slug)}`, {
    // Revalidate every 60 s so the page stays fresh without a full rebuild
    next: { revalidate: 60 },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`);

  const data: { product: Product } = await res.json();
  return data.product;
}

// ---------------------------------------------------------------------------
// generateMetadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} — SRMStore`,
    description: product.description,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* ── Breadcrumb ── */}
        <nav
          aria-label="Breadcrumb"
          className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8"
        >
          <ol className="flex items-center gap-2 text-sm text-foreground/50">
            <li>
              <Link
                href="/"
                className="transition-colors hover:text-primary"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/products"
                className="transition-colors hover:text-primary"
              >
                Products
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li
              className="max-w-[200px] truncate font-medium text-foreground"
              aria-current="page"
            >
              {product.name}
            </li>
          </ol>
        </nav>

        {/* ── Back link (mobile-friendly) ── */}
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <Link
            href="/products"
            id="product-detail-back-link"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/50
              transition-colors hover:text-primary"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to products
          </Link>
        </div>

        {/* ── Product detail card ── */}
        <section
          aria-label="Product detail"
          className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
        >
          <div
            className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm
              lg:grid lg:grid-cols-2 lg:gap-0"
          >
            {/* ── Left — Product image ── */}
            <div className="relative aspect-square w-full bg-muted lg:aspect-auto lg:min-h-[520px]">
              {/* Decorative gradient overlay */}
              <div
                aria-hidden="true"
                className="absolute inset-0 z-10
                  bg-[radial-gradient(ellipse_70%_60%_at_50%_110%,var(--color-secondary)_0%,transparent_70%)]
                  opacity-60"
              />
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* ── Right — Product info ── */}
            <div className="flex flex-col gap-6 p-8 lg:p-12">
              {/* Category badge */}
              <span
                className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border
                  bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-widest
                  text-secondary-foreground"
              >
                <Tag size={11} aria-hidden="true" />
                {product.category}
              </span>

              {/* Product name */}
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                {product.name}
              </h1>

              {/* Price */}
              <p className="text-4xl font-black text-primary" aria-label={`Price: ₹${product.price.toLocaleString("en-IN")}`}>
                ₹{product.price.toLocaleString("en-IN")}
              </p>

              {/* Divider */}
              <hr className="border-border" />

              {/* Description */}
              <div>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-foreground/40">
                  Description
                </h2>
                <p className="text-base leading-relaxed text-foreground/70">
                  {product.description}
                </p>
              </div>

              {/* Divider */}
              <hr className="border-border" />

              {/* Quantity selector + Add to Cart — client island */}
              <AddToCartControls productName={product.name} />

              {/* Trust strip */}
              <ul className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs font-medium text-foreground/40">
                {[
                  "Free shipping over ₹999",
                  "30-day returns",
                  "Secure checkout",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-success"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
