"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  ShoppingCart,
  Menu,
  X,
  Store,
  LogIn,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { signInWithGoogle, signOutUser } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
];

const CART_COUNT = 0;

export default function Navbar() {
  const [menuOpen, setMenuOpen]           = useState(false);
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [signingIn, setSigningIn]         = useState(false);
  const dropdownRef                       = useRef<HTMLDivElement>(null);

  const { user, loading } = useAuth();

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // ── Auth actions ──────────────────────────────────────────────────────────
  async function handleSignIn() {
    try {
      setSigningIn(true);
      await signInWithGoogle();
    } catch {
      // User closed popup — no-op
    } finally {
      setSigningIn(false);
    }
  }

  async function handleSignOut() {
    setDropdownOpen(false);
    await signOutUser();
  }

  // ── Auth UI: sign-in button or user avatar ────────────────────────────────
  function AuthSection() {
    // While Firebase is resolving initial state show a muted placeholder
    if (loading) {
      return (
        <div
          aria-label="Loading auth state"
          className="h-9 w-9 animate-pulse rounded-full bg-muted"
        />
      );
    }

    // Signed out → "Sign in" button
    if (!user) {
      return (
        <button
          id="navbar-sign-in-btn"
          type="button"
          onClick={handleSignIn}
          disabled={signingIn}
          aria-label="Sign in with Google"
          className="inline-flex items-center gap-2 rounded-full border border-border
            bg-surface px-4 py-2 text-sm font-semibold text-foreground/80
            shadow-sm transition-all duration-200
            hover:border-primary/50 hover:text-primary hover:-translate-y-px
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
            disabled:cursor-wait disabled:opacity-60"
        >
          <LogIn size={15} aria-hidden="true" className="shrink-0" />
          <span className="hidden sm:inline">
            {signingIn ? "Signing in…" : "Sign in"}
          </span>
        </button>
      );
    }

    // Signed in → avatar + dropdown
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          id="navbar-user-menu-btn"
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          aria-label={`User menu for ${user.displayName ?? "user"}`}
          className="flex items-center gap-2 rounded-full border border-border
            bg-surface p-1 pr-3 shadow-sm transition-all duration-200
            hover:border-primary/40 hover:shadow-md
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {/* Avatar */}
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.displayName ?? "User avatar"}
              width={30}
              height={30}
              className="rounded-full object-cover ring-2 ring-primary/20"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-[30px] w-[30px] items-center justify-center
                rounded-full bg-secondary text-secondary-foreground"
            >
              <UserIcon size={16} />
            </span>
          )}
          {/* Display name (desktop only) */}
          <span className="hidden max-w-[120px] truncate text-sm font-medium text-foreground sm:block">
            {user.displayName?.split(" ")[0] ?? "Account"}
          </span>
        </button>

        {/* ── Dropdown ── */}
        {dropdownOpen && (
          <div
            role="menu"
            aria-label="User menu"
            className="absolute right-0 z-50 mt-2 w-56 origin-top-right animate-[fadeSlideDown_0.15s_ease-out]
              rounded-2xl border border-border bg-surface p-1.5 shadow-xl shadow-foreground/10
              ring-1 ring-border"
          >
            {/* User info header */}
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt=""
                  width={36}
                  height={36}
                  className="rounded-full object-cover"
                  aria-hidden="true"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center
                    rounded-full bg-secondary text-secondary-foreground"
                >
                  <UserIcon size={18} />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user.displayName ?? "User"}
                </p>
                <p className="truncate text-xs text-foreground/50">{user.email}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="my-1 h-px bg-border" role="separator" />

            {/* Sign out */}
            <button
              id="navbar-sign-out-btn"
              role="menuitem"
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5
                text-sm font-medium text-foreground/70
                transition-colors duration-150
                hover:bg-secondary hover:text-accent
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <LogOut size={15} aria-hidden="true" className="shrink-0" />
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
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

        {/* ── Right: Auth + Cart + Hamburger ── */}
        <div className="ml-auto flex items-center gap-3">

          {/* Auth section */}
          <AuthSection />

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
                    ${menuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}
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

          {/* Auth action in mobile menu */}
          {!loading && (
            <li className="mt-1 border-t border-border pt-2">
              {user ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2
                    text-sm font-medium text-foreground/70
                    transition-colors hover:bg-secondary hover:text-accent"
                >
                  <LogOut size={15} aria-hidden="true" />
                  Sign out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={signingIn}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2
                    text-sm font-medium text-foreground/70
                    transition-colors hover:bg-secondary hover:text-primary
                    disabled:opacity-60"
                >
                  <LogIn size={15} aria-hidden="true" />
                  {signingIn ? "Signing in…" : "Sign in with Google"}
                </button>
              )}
            </li>
          )}
        </ul>
      </div>

      {/* ── Keyframe for dropdown animation ── */}
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </header>
  );
}
