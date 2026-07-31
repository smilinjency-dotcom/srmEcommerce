-- =============================================================================
-- Migration: 001_initial_schema.sql
--
-- Run this in the Supabase SQL Editor (or via Supabase CLI migrations).
-- Order: extensions → tables → indexes → RLS → policies → seed data
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gives us gen_random_uuid()


-- ---------------------------------------------------------------------------
-- 1. products
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  price       NUMERIC     NOT NULL CHECK (price >= 0),
  image_url   TEXT        NOT NULL DEFAULT '',
  category    TEXT        NOT NULL DEFAULT '',
  stock       INT         NOT NULL DEFAULT 0 CHECK (stock >= 0),
  slug        TEXT        NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Full-text + category search index
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_slug     ON products (slug);


-- ---------------------------------------------------------------------------
-- 2. cart_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,          -- Firebase UID (string)
  product_id  UUID        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  quantity    INT         NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)               -- one row per product per user
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items (user_id);


-- ---------------------------------------------------------------------------
-- 3. orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              TEXT        NOT NULL,
  status               TEXT        NOT NULL DEFAULT 'pending',
  total_amount         NUMERIC     NOT NULL CHECK (total_amount >= 0),
  shipping_name        TEXT        NOT NULL DEFAULT '',
  shipping_address     TEXT        NOT NULL DEFAULT '',
  shipping_city        TEXT        NOT NULL DEFAULT '',
  shipping_postal_code TEXT        NOT NULL DEFAULT '',
  shipping_phone       TEXT        NOT NULL DEFAULT '',
  razorpay_order_id    TEXT,
  razorpay_payment_id  TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);


-- ---------------------------------------------------------------------------
-- 4. order_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID    NOT NULL REFERENCES orders   (id) ON DELETE CASCADE,
  product_id  UUID    NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  quantity    INT     NOT NULL CHECK (quantity > 0),
  price       NUMERIC NOT NULL CHECK (price >= 0)   -- snapshot at time of purchase
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);


-- =============================================================================
-- 5. Row Level Security
-- =============================================================================

-- ── products: publicly readable, no direct client writes ────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (true);


-- ── cart_items: each user sees and modifies only their own rows ──────────────
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_items_select_own"
  ON cart_items FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
         OR user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "cart_items_insert_own"
  ON cart_items FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
              OR user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "cart_items_update_own"
  ON cart_items FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
         OR user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "cart_items_delete_own"
  ON cart_items FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
         OR user_id = current_setting('request.jwt.claims', true)::json->>'user_id');


-- ── orders: each user sees and creates only their own orders ─────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
         OR user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "orders_insert_own"
  ON orders FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
              OR user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

-- order_items: readable if the parent order belongs to the user
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select_own"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (
          orders.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
          OR
          orders.user_id = current_setting('request.jwt.claims', true)::json->>'user_id'
        )
    )
  );

CREATE POLICY "order_items_insert_own"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (
          orders.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
          OR
          orders.user_id = current_setting('request.jwt.claims', true)::json->>'user_id'
        )
    )
  );


-- =============================================================================
-- 6. Seed data — 8 realistic products
-- =============================================================================

INSERT INTO products (name, description, price, image_url, category, stock, slug) VALUES

( 'AuraSound Pro Wireless Headphones',
  'Premium over-ear headphones with 40-hour battery life, active noise cancellation, and Hi-Res Audio certification. Foldable design with memory-foam ear cushions.',
  8999,
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
  'Electronics', 42,
  'aurasound-pro-wireless-headphones' ),

( 'LunaGlow Skincare Set',
  'A curated 4-piece routine featuring vitamin C serum, hyaluronic acid moisturiser, gentle exfoliating toner, and SPF 50 sunscreen. Dermatologist-tested and cruelty-free.',
  3499,
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80',
  'Beauty', 120,
  'lunaglow-skincare-set' ),

( 'UrbanHike Trail Running Shoes',
  'Lightweight trail runners with Vibram® outsole, recycled mesh upper, and responsive foam midsole. Available in sizes UK 6–12.',
  5499,
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
  'Footwear', 65,
  'urbanhike-trail-running-shoes' ),

( 'Zenith Smart Watch Series 5',
  'Health-focused smartwatch with ECG monitoring, SpO₂ sensor, sleep tracking, and a stunning 1.4" AMOLED always-on display. IP68 water-resistant.',
  12999,
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
  'Electronics', 30,
  'zenith-smart-watch-series-5' ),

( 'Minimal Oak Desk Organiser',
  'Solid oak and brushed brass desk organiser with compartments for pens, cables, cards, and a wireless charging pad embedded in the base.',
  2799,
  'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80',
  'Home & Office', 88,
  'minimal-oak-desk-organiser' ),

( 'PeakFit Resistance Band Set',
  'Set of 5 latex-free resistance bands (5 kg – 40 kg) with mesh carry bag, door anchor, and ankle straps. Ideal for home workouts and physiotherapy.',
  1299,
  'https://images.unsplash.com/photo-1598971639058-fab3c3109a03?w=600&q=80',
  'Sports & Fitness', 200,
  'peakfit-resistance-band-set' ),

( 'Nomad Canvas Backpack 26L',
  'Water-resistant waxed canvas backpack with 15" laptop sleeve, hidden back-panel pocket, and YKK® zippers. Built to last a decade of daily commutes.',
  4199,
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
  'Bags & Accessories', 55,
  'nomad-canvas-backpack-26l' ),

( 'BaristaPlus Espresso Machine',
  '15-bar pump espresso maker with built-in conical burr grinder, PID temperature control, and a professional steam wand for silky microfoam milk.',
  18500,
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
  'Kitchen', 18,
  'baristaplus-espresso-machine' )

ON CONFLICT (slug) DO NOTHING;
