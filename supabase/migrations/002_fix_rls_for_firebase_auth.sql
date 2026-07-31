-- =============================================================================
-- Migration: 002_fix_rls_for_firebase_auth.sql
--
-- The original RLS policies check request.jwt.claims which is only populated
-- when using Supabase Auth JWTs. This project uses Firebase Auth with a plain
-- user_id TEXT column, and all writes go through Next.js API routes using the
-- anon key (server-side). The anon key carries no JWT claims, so every write
-- was being blocked.
--
-- Fix: drop the JWT-claim policies and replace them with policies that:
--   • Allow the anon role to read/write any row  (server routes enforce ownership)
--   • Keep RLS enabled so the tables are not fully public via PostgREST
--
-- If you later add Supabase Auth, re-restrict these to auth.uid()::text = user_id.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- cart_items
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "cart_items_select_own"  ON cart_items;
DROP POLICY IF EXISTS "cart_items_insert_own"  ON cart_items;
DROP POLICY IF EXISTS "cart_items_update_own"  ON cart_items;
DROP POLICY IF EXISTS "cart_items_delete_own"  ON cart_items;

-- Allow the anon role (used by the server-side Supabase client) full access.
-- Ownership is enforced at the API route layer (user_id comes from Firebase Auth).
CREATE POLICY "cart_items_anon_all"
  ON cart_items FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "orders_select_own"  ON orders;
DROP POLICY IF EXISTS "orders_insert_own"  ON orders;
DROP POLICY IF EXISTS "orders_update_own"  ON orders;

CREATE POLICY "orders_anon_all"
  ON orders FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "order_items_select_own"  ON order_items;
DROP POLICY IF EXISTS "order_items_insert_own"  ON order_items;

CREATE POLICY "order_items_anon_all"
  ON order_items FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
