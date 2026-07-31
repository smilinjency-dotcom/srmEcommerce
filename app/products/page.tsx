"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X, PackageSearch } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types/supabase";

// ── Category list (must match categories in the API seed data) ──────────────
const CATEGORIES = [
  "All",
  "Electronics",
  "Beauty",
  "Footwear",
  "Home & Office",
  "Sports & Fitness",
  "Bags & Accessories",
  "Kitchen",
];

// ── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm animate-pulse"
      aria-hidden="true"
    >
      <div className="aspect-square w-full bg-muted" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-4 w-3/4 rounded-full bg-muted" />
        <div className="h-4 w-1/2 rounded-full bg-muted" />
        <div className="mt-auto h-10 rounded-full bg-muted" />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Sync state from URL ──────────────────────────────────────────────────
  const [inputValue, setInputValue] = useState(
    searchParams.get("search") ?? ""
  );
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") ?? "All"
  );

  // ── Data state ───────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input so we don't fire on every keystroke
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Build URL + push to router ───────────────────────────────────────────
  const updateURL = useCallback(
    (search: string, category: string) => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category && category !== "All") params.set("category", category);
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [pathname, router]
  );

  // ── Fetch products from the API ──────────────────────────────────────────
  const fetchProducts = useCallback(async (search: string, category: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category && category !== "All") params.set("category", category);
      const res = await fetch(`/api/products${params.toString() ? `?${params}` : ""}`);
      if (!res.ok) throw new Error("Failed to load products.");
      const data: { products: Product[] } = await res.json();
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── React to URL param changes (initial load + back/forward nav) ─────────
  useEffect(() => {
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "All";
    setInputValue(search);
    setActiveCategory(category);
    fetchProducts(search, category);
  }, [searchParams, fetchProducts]);

  // ── Handle search input with debounce ────────────────────────────────────
  function handleSearchChange(value: string) {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateURL(value, activeCategory);
    }, 400);
  }

  // ── Handle category change (immediate) ───────────────────────────────────
  function handleCategoryChange(category: string) {
    setActiveCategory(category);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    updateURL(inputValue, category);
  }

  // ── Clear all filters ────────────────────────────────────────────────────
  function clearFilters() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setInputValue("");
    setActiveCategory("All");
    updateURL("", "All");
  }

  const hasActiveFilter = inputValue.trim() !== "" || activeCategory !== "All";

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* ── Page header ── */}
        <section
          aria-label="Products page header"
          className="relative isolate overflow-hidden border-b border-border bg-background"
        >
          {/* Subtle gradient backdrop */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10
              bg-[radial-gradient(ellipse_70%_80%_at_50%_-20%,var(--color-secondary)_0%,transparent_70%)]"
          />
          <div
            aria-hidden="true"
            className="absolute -top-24 right-0 -z-10 h-72 w-72 rounded-full bg-primary opacity-[0.07] blur-3xl"
          />

          <div className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8">
            {/* Eyebrow */}
            <span
              className="mb-3 inline-block rounded-full bg-secondary px-4 py-1
                text-xs font-semibold uppercase tracking-widest text-secondary-foreground"
            >
              All Products
            </span>

            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Browse the <span className="text-primary">Collection</span>
            </h1>

            <p className="mt-3 max-w-xl text-base leading-relaxed text-foreground/60">
              Explore every product in our store. Use search and filters to find
              exactly what you're looking for.
            </p>
          </div>
        </section>

        {/* ── Filter bar ── */}
        <section
          aria-label="Search and filter"
          className="sticky top-0 z-20 border-b border-border bg-surface/90 shadow-sm backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">

            {/* Search input */}
            <div className="relative flex-1">
              <label htmlFor="product-search" className="sr-only">
                Search products
              </label>
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40"
              />
              <input
                id="product-search"
                type="search"
                role="searchbox"
                placeholder="Search products…"
                value={inputValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-4
                  text-sm text-foreground placeholder-foreground/40
                  outline-none ring-0
                  transition-all duration-200
                  focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Category dropdown */}
            <div className="relative flex items-center gap-2">
              <label htmlFor="category-select" className="sr-only">
                Filter by category
              </label>
              <SlidersHorizontal
                size={15}
                aria-hidden="true"
                className="shrink-0 text-foreground/40"
              />
              <select
                id="category-select"
                value={activeCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="appearance-none rounded-full border border-border bg-background
                  py-2.5 pl-4 pr-9 text-sm text-foreground
                  outline-none ring-0
                  transition-all duration-200
                  focus:border-primary focus:ring-2 focus:ring-primary/20
                  cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {/* Custom chevron */}
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M2 4l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Clear button — visible when any filter is active */}
            {hasActiveFilter && (
              <button
                id="clear-filters-btn"
                onClick={clearFilters}
                aria-label="Clear all filters"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border
                  bg-background px-4 py-2.5 text-sm font-medium text-foreground/60
                  transition-all duration-200 hover:border-accent hover:text-accent"
              >
                <X size={13} aria-hidden="true" />
                Clear
              </button>
            )}
          </div>
        </section>

        {/* ── Product grid ── */}
        <section
          id="products-grid-section"
          aria-label="Products grid"
          aria-live="polite"
          aria-busy={loading}
          className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
        >
          {/* Results count */}
          {!loading && !error && (
            <p className="mb-8 text-sm text-foreground/50">
              {products.length === 0
                ? "No products found"
                : `${products.length} product${products.length !== 1 ? "s" : ""} found`}
              {hasActiveFilter && (
                <span className="ml-1">
                  for{" "}
                  {inputValue && (
                    <strong className="font-semibold text-foreground/70">
                      "{inputValue}"
                    </strong>
                  )}
                  {inputValue && activeCategory !== "All" && " in "}
                  {activeCategory !== "All" && (
                    <strong className="font-semibold text-foreground/70">
                      {activeCategory}
                    </strong>
                  )}
                </span>
              )}
            </p>
          )}

          {/* Error state */}
          {error && (
            <div
              role="alert"
              className="flex flex-col items-center gap-4 rounded-2xl border border-error/20
                bg-error/5 px-6 py-16 text-center"
            >
              <PackageSearch size={48} className="text-error/40" aria-hidden="true" />
              <p className="text-base font-semibold text-error">{error}</p>
              <button
                onClick={() => fetchProducts(inputValue, activeCategory)}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold
                  text-primary-foreground shadow-md shadow-primary/25
                  transition-all duration-200 hover:brightness-110"
              >
                Try again
              </button>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && !error && (
            <ul
              className="grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              aria-label="Loading products"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <li key={i}>
                  <SkeletonCard />
                </li>
              ))}
            </ul>
          )}

          {/* Empty state */}
          {!loading && !error && products.length === 0 && (
            <div
              className="flex flex-col items-center gap-5 rounded-2xl border border-border
                bg-surface px-6 py-20 text-center"
            >
              <PackageSearch
                size={56}
                aria-hidden="true"
                className="text-primary/30"
              />
              <div className="flex flex-col gap-1">
                <p className="text-lg font-semibold text-foreground">
                  No products found
                </p>
                <p className="text-sm text-foreground/50">
                  Try adjusting your search or clearing the category filter.
                </p>
              </div>
              <button
                onClick={clearFilters}
                id="empty-state-clear-btn"
                className="rounded-full border border-primary px-6 py-2.5 text-sm font-semibold
                  text-primary transition-all duration-200
                  hover:bg-primary hover:text-primary-foreground"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Products */}
          {!loading && !error && products.length > 0 && (
            <ul
              className="grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              aria-label="Products list"
            >
              {products.map((product) => (
                <li key={product.id}>
                  <ProductCard
                    image={product.image_url}
                    name={product.name}
                    price={product.price}
                    slug={product.slug}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
