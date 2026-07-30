import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductCard, { ProductCardProps } from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { ArrowRight } from "lucide-react";

// ── Placeholder products ──────────────────────────────────────────────────────
// Using picsum.photos for deterministic placeholder images (requires
// next.config.ts remotePatterns entry for picsum.photos).
const FEATURED_PRODUCTS: ProductCardProps[] = [
  {
    image: "https://picsum.photos/seed/sneaker/600/600",
    name: "Aero Runner Sneakers",
    price: 3499,
    slug: "aero-runner-sneakers",
  },
  {
    image: "https://picsum.photos/seed/watch/600/600",
    name: "Chronos Smart Watch",
    price: 8999,
    slug: "chronos-smart-watch",
  },
  {
    image: "https://picsum.photos/seed/bag/600/600",
    name: "Urban Canvas Backpack",
    price: 1999,
    slug: "urban-canvas-backpack",
  },
  {
    image: "https://picsum.photos/seed/headphones/600/600",
    name: "SoundBlast Pro Headphones",
    price: 5499,
    slug: "soundblast-pro-headphones",
  },
  {
    image: "https://picsum.photos/seed/tshirt/600/600",
    name: "Essential Cotton Tee",
    price: 699,
    slug: "essential-cotton-tee",
  },
  {
    image: "https://picsum.photos/seed/sunglasses/600/600",
    name: "Horizon UV Sunglasses",
    price: 1299,
    slug: "horizon-uv-sunglasses",
  },
  {
    image: "https://picsum.photos/seed/lamp/600/600",
    name: "Luminary Desk Lamp",
    price: 2199,
    slug: "luminary-desk-lamp",
  },
  {
    image: "https://picsum.photos/seed/perfume/600/600",
    name: "Velvet Noir Perfume",
    price: 4299,
    slug: "velvet-noir-perfume",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Top navigation ── */}
      <Navbar />

      {/* ── Main content ── */}
      <main className="flex-1">
        {/* Hero section */}
        <Hero />

        {/* ── Featured Products ── */}
        <section
          id="featured-products"
          aria-labelledby="featured-heading"
          className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        >
          {/* Section header */}
          <div className="mb-12 flex flex-col items-center gap-3 text-center">
            {/* Eyebrow */}
            <span
              className="inline-block rounded-full bg-secondary px-4 py-1 text-xs font-semibold
                uppercase tracking-widest text-secondary-foreground"
            >
              Hand-picked for you
            </span>

            <h2
              id="featured-heading"
              className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
            >
              Featured <span className="text-primary">Products</span>
            </h2>

            <p className="max-w-md text-base text-foreground/60">
              Our editors' top picks — quality you can feel, prices you'll love.
            </p>
          </div>

          {/* Responsive product grid: 1 col → 2 → 3 → 4 */}
          <ul
            className="grid list-none grid-cols-1 gap-6
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-4"
            aria-label="Featured products list"
          >
            {FEATURED_PRODUCTS.map((product) => (
              <li key={product.slug}>
                <ProductCard {...product} />
              </li>
            ))}
          </ul>

          {/* View all CTA */}
          <div className="mt-14 flex justify-center">
            <a
              href="/products"
              id="featured-view-all-btn"
              className="group inline-flex items-center gap-2 rounded-full border border-primary
                px-8 py-3 text-sm font-semibold text-primary
                transition-all duration-200
                hover:bg-primary hover:text-primary-foreground hover:-translate-y-0.5
                hover:shadow-lg hover:shadow-primary/25
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              View all products
              <ArrowRight
                size={16}
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </a>
          </div>
        </section>

        {/* ── Value proposition strip ── */}
        <section
          aria-label="Why shop with us"
          className="border-t border-border bg-muted/50"
        >
          <ul
            className="mx-auto grid max-w-7xl list-none grid-cols-1 gap-0
              divide-y divide-border px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0
              sm:px-6 lg:px-8"
            aria-label="Store benefits"
          >
            {[
              {
                icon: "🚚",
                title: "Free Shipping",
                body: "On all orders above ₹999",
              },
              {
                icon: "🔄",
                title: "30-Day Returns",
                body: "Hassle-free, no questions asked",
              },
              {
                icon: "🔒",
                title: "Secure Checkout",
                body: "256-bit SSL encrypted payments",
              },
            ].map(({ icon, title, body }) => (
              <li
                key={title}
                className="flex flex-col items-center gap-2 px-6 py-10 text-center"
              >
                <span className="text-3xl" aria-hidden="true">
                  {icon}
                </span>
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-foreground/60">{body}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
