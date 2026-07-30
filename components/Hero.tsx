"use client";

import { ArrowRight, ShoppingBag, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section
      aria-label="Hero"
      className="relative isolate overflow-hidden bg-background"
    >
      {/* ── Background gradient built entirely from theme tokens ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10
          bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--color-secondary)_0%,transparent_70%)]"
      />

      {/* Decorative blob – primary at low opacity */}
      <div
        aria-hidden="true"
        className="absolute -top-40 right-0 -z-10 h-[500px] w-[500px] rounded-full
          bg-primary opacity-10 blur-3xl"
      />

      {/* Decorative blob – accent at low opacity */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-10 -z-10 h-[380px] w-[380px] rounded-full
          bg-accent opacity-10 blur-3xl"
      />

      {/* ── Content ── */}
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-28 text-center sm:px-6 sm:py-36 lg:px-8">

        {/* Eyebrow badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full border border-border
            bg-surface px-4 py-1.5 text-sm font-medium text-secondary-foreground
            shadow-sm ring-1 ring-primary/10"
        >
          <Sparkles size={14} className="text-primary" aria-hidden="true" />
          New arrivals every week
        </div>

        {/* Headline */}
        <h1
          className="max-w-3xl text-balance text-5xl font-extrabold tracking-tight
            text-foreground sm:text-6xl lg:text-7xl"
        >
          Shop smarter,{" "}
          <span className="text-primary">live better</span>.
        </h1>

        {/* Subtext */}
        <p
          className="max-w-xl text-balance text-lg leading-relaxed text-foreground/60
            sm:text-xl"
        >
          Discover a curated collection of premium products — from everyday
          essentials to hard-to-find favourites — delivered right to your door.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="/products"
            id="hero-shop-now-btn"
            className="group inline-flex items-center gap-2 rounded-full bg-primary
              px-8 py-3.5 text-base font-semibold text-primary-foreground
              shadow-lg shadow-primary/30 transition-all duration-200
              hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl
              hover:shadow-primary/40 focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <ShoppingBag size={18} aria-hidden="true" />
            Shop now
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </a>

          <a
            href="/products"
            id="hero-browse-link"
            className="inline-flex items-center gap-2 rounded-full border border-border
              bg-surface px-8 py-3.5 text-base font-semibold text-foreground
              shadow-sm transition-all duration-200 hover:border-primary/40
              hover:text-primary hover:-translate-y-0.5
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Browse categories
          </a>
        </div>

        {/* Trust strip */}
        <ul
          className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2
            text-sm font-medium text-foreground/50"
          aria-label="Trust indicators"
        >
          {[
            "Free shipping over ₹999",
            "30-day returns",
            "Secure checkout",
          ].map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
