"use client";

/**
 * app/admin/layout.tsx
 *
 * Route guard & layout wrapper for every page under /admin.
 * Renders the Admin Navigation Bar and children only when the signed-in
 * Firebase user's email is in the NEXT_PUBLIC_ADMIN_EMAILS allow-list.
 * All other visitors (signed-out or non-admin) see a "Not authorized" screen.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldOff,
  Home,
  Store,
  LayoutDashboard,
  Package,
  ShoppingBag,
  ArrowLeft,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isAdmin } from "@/lib/isAdmin";

const ADMIN_NAV_LINKS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Loading: Firebase is resolving initial auth state ───────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <span
            aria-label="Checking authorization…"
            className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
          />
          <p className="text-sm font-medium text-foreground/60">
            Verifying admin access…
          </p>
        </div>
      </div>
    );
  }

  // ── Not signed in, or not an admin ────────────────────────────────────────
  if (!user || !isAdmin(user.email)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-error/10">
          <ShieldOff size={36} className="text-error" aria-hidden="true" />
        </div>

        {/* Heading */}
        <div className="max-w-sm">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Not authorized
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            {user
              ? `${user.email} does not have admin access.`
              : "You must be signed in with an admin account to view this page."}
          </p>
        </div>

        {/* Back link */}
        <Link
          id="admin-unauthorized-home-link"
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-border
            bg-surface px-5 py-2.5 text-sm font-semibold text-foreground/80
            shadow-sm transition-all duration-200
            hover:border-primary/50 hover:text-primary hover:-translate-y-px
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Home size={15} aria-hidden="true" />
          Back to homepage
        </Link>
      </div>
    );
  }

  // ── Authorized admin ─────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Admin Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Branding */}
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-85"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
                <Store size={20} aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="text-base font-extrabold tracking-tight text-foreground">
                    SRM<span className="text-primary">Store</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                    <ShieldCheck size={10} aria-hidden="true" />
                    Admin
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Center: Nav links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {ADMIN_NAV_LINKS.map(({ label, href, icon: Icon }) => {
              const isActive =
                href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-foreground/70 hover:bg-secondary hover:text-primary"
                  }`}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Storefront Link & User Info */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-foreground/70 transition-all hover:border-primary/50 hover:text-primary"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              View Storefront
            </Link>
            <span className="text-xs text-foreground/50 max-w-[150px] truncate" title={user.email || ""}>
              {user.email}
            </span>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/"
              aria-label="View Storefront"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/70"
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle admin menu"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/70 hover:bg-secondary"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <nav className="border-t border-border bg-surface px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {ADMIN_NAV_LINKS.map(({ label, href, icon: Icon }) => {
                const isActive =
                  href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/70 hover:bg-secondary hover:text-primary"
                    }`}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
              <div className="mt-2 border-t border-border pt-2 text-xs text-foreground/50 px-3.5">
                Signed in as: <span className="font-semibold text-foreground">{user.email}</span>
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* ── Main Admin Content ── */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* ── Admin Footer ── */}
      <footer className="border-t border-border bg-surface/50 py-4 text-center text-xs text-foreground/40">
        <div className="mx-auto max-w-7xl px-4">
          SRMStore Admin Control Panel &bull; Signed in as {user.email}
        </div>
      </footer>
    </div>
  );
}
