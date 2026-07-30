import { Store } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-muted">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-8 sm:px-6 lg:px-8">
        {/* Store name */}
        <a
          href="/"
          className="flex items-center gap-2 text-primary transition-opacity hover:opacity-80"
          aria-label="Go to homepage"
        >
          <Store size={22} strokeWidth={2} aria-hidden="true" />
          <span className="text-lg font-bold tracking-tight text-foreground">
            SRM<span className="text-primary">Store</span>
          </span>
        </a>

        {/* Copyright */}
        <p className="text-sm text-foreground/60">
          &copy; {year} SRMStore. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
