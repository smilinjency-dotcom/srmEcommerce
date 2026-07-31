/**
 * lib/supabaseAdmin.ts
 *
 * Server-only Supabase client that uses the SERVICE ROLE key.
 * The service role key bypasses Row Level Security (RLS), which is
 * intentional for API Route Handlers that have already validated
 * the caller's identity at the application layer.
 *
 * ⚠️  NEVER import this file from any "use client" component or
 *     any file reachable by the browser bundle.
 * ⚠️  NEVER prefix SUPABASE_SERVICE_ROLE_KEY with NEXT_PUBLIC_.
 *
 * How to get the service_role key:
 *   Supabase Dashboard → your project → Settings → API
 *   → "Project API keys" → copy the "service_role" (secret) key
 *   → paste it as SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { supabase } from "@/lib/supabase";

const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// Detect when the key has not been filled in yet
const isPlaceholder =
  !serviceRoleKey ||
  serviceRoleKey.startsWith("REPLACE_WITH") ||
  serviceRoleKey.length < 20;

/**
 * Admin client — bypasses RLS.
 * Use ONLY inside Next.js API Route Handlers (app/api/**).
 *
 * Will be `null` when SUPABASE_SERVICE_ROLE_KEY has not been configured.
 */
export const supabaseAdmin: SupabaseClient<Database> | null = isPlaceholder
  ? null
  : createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

/**
 * Convenience helper: returns the admin client if available,
 * otherwise falls back to the public anon client.
 */
export function getAdminClient(): SupabaseClient<Database> {
  if (!supabaseAdmin) {
    return supabase;
  }
  return supabaseAdmin;
}
