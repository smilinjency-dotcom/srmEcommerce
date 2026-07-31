/**
 * lib/isAdmin.ts
 *
 * Pure utility — no React, no Firebase imports.
 * Safe to call from both client and server code.
 *
 * Admin emails are configured via the NEXT_PUBLIC_ADMIN_EMAILS environment
 * variable as a comma-separated list, e.g.:
 *   NEXT_PUBLIC_ADMIN_EMAILS="alice@example.com,bob@example.com"
 *
 * Comparison is case-insensitive and whitespace-tolerant.
 */

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.trim().toLowerCase());
}
