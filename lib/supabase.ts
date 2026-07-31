/**
 * lib/supabase.ts
 *
 * Supabase browser client — uses the public anon key only.
 * The service-role key must NEVER appear here or in any client-side code.
 *
 * Config is read from environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    "Missing Supabase environment variables. " +
    "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

/**
 * Singleton Supabase client for use in Client Components, Server Components,
 * and API Route Handlers.
 *
 * For Server Actions / Route Handlers that need elevated privileges,
 * create a separate server-only client with the service-role key
 * (never export it from this file).
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnon);
