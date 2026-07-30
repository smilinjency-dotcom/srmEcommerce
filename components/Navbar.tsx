"use client";

import { useState } from "react";
import { ShoppingCart, Menu, X, Store } from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
];

const CART_COUNT = 0;

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/80 backdrop-blur-md">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* ── Left: Logo / Store Name ── */}
        <a
          href="/"
          className="flex shrink-0 items-center gap-2 text-primary transition-opacity hover:opacity-80"
          aria-label="Go to homepage"
        >
          <Store
            size={26}
            strokeWidth={2}
            className="text-primary"
            aria-hidden="true"
          />
          <span className="text-lg font-bold tracking-tight text-foreground">
            SRM<span className="text-primary">Store</span>
          </span>
        </a>

        {/* ── Center: Nav Links (desktop) ── */}
        <ul className="hidden md:flex flex-1 list-none items-center justify-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                className="relative text-sm font-medium text-foreground/70 transition-colors hover:text-primary
                           after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full
                           after:bg-primary after:transition-[width] after:duration-300 hover:after:w-full"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* ── Right: Cart + Hamburger ── */}
        <div className="ml-auto flex items-center gap-3">
          {/* Cart icon */}
          <button
            type="button"
            aria-label={`Open cart, ${CART_COUNT} items`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground/70
                       transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ShoppingCart size={22} strokeWidth={2} aria-hidden="true" />
            {CART_COUNT > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center
                           rounded-full bg-accent text-[10px] font-bold leading-none text-white"
                aria-live="polite"
              >
                {CART_COUNT > 99 ? "99+" : CART_COUNT}
              </span>
            )}
          </button>

          {/* Hamburger (mobile only) */}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/70
                       transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-primary md:hidden"
          >
            {menuOpen ? (
              <X size={22} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Menu size={22} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      <div
        id="mobile-menu"
        className={`overflow-hidden border-t border-border bg-surface transition-[max-height,opacity] duration-300 ease-in-out md:hidden
                    ${menuOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}
        aria-hidden={!menuOpen}
      >
        <ul className="flex list-none flex-col gap-1 px-4 py-3">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-foreground/80
                           transition-colors hover:bg-secondary hover:text-primary"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
