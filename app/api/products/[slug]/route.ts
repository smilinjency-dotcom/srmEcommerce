import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in INR (paise-free integer, e.g. 1299 = ₹1 299)
  image_url: string;
  category: string;
  slug: string;
}

// ---------------------------------------------------------------------------
// Data layer
// ---------------------------------------------------------------------------
// ⚠️  SWAP POINT: replace the body of `fetchProductBySlug` with a Supabase
// query when you're ready.  The route handler below never touches raw data.
//
//   async function fetchProductBySlug(slug: string): Promise<Product | null> {
//     const { data, error } = await supabase
//       .from("products")
//       .select("*")
//       .eq("slug", slug)
//       .single();
//     if (error) throw error;
//     return data as Product | null;
//   }
// ---------------------------------------------------------------------------

async function fetchProductBySlug(slug: string): Promise<Product | null> {
  // TODO: replace with a real Supabase query (see swap point above)
  return IN_MEMORY_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await fetchProductBySlug(slug);

    if (!product) {
      return NextResponse.json(
        { error: `Product with slug "${slug}" not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/products/[slug]]", error);
    return NextResponse.json(
      { error: "Failed to fetch product." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// In-memory seed data — local copy of the same 8 products in
// app/api/products/route.ts.  Do not import from there; this copy keeps the
// route self-contained and is the only thing that changes when Supabase is
// wired up.
// ---------------------------------------------------------------------------

const IN_MEMORY_PRODUCTS: Product[] = [
  {
    id: "prod_001",
    name: "AuraSound Pro Wireless Headphones",
    description:
      "Premium over-ear headphones with 40-hour battery life, active noise cancellation, and Hi-Res Audio certification. Foldable design with memory-foam ear cushions.",
    price: 8999,
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    category: "Electronics",
    slug: "aurasound-pro-wireless-headphones",
  },
  {
    id: "prod_002",
    name: "LunaGlow Skincare Set",
    description:
      "A curated 4-piece routine featuring vitamin C serum, hyaluronic acid moisturiser, gentle exfoliating toner, and SPF 50 sunscreen. Dermatologist-tested and cruelty-free.",
    price: 3499,
    image_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
    category: "Beauty",
    slug: "lunaglow-skincare-set",
  },
  {
    id: "prod_003",
    name: "UrbanHike Trail Running Shoes",
    description:
      "Lightweight trail runners with Vibram® outsole, recycled mesh upper, and responsive foam midsole. Available in sizes UK 6–12.",
    price: 5499,
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    category: "Footwear",
    slug: "urbanhike-trail-running-shoes",
  },
  {
    id: "prod_004",
    name: "Zenith Smart Watch Series 5",
    description:
      "Health-focused smartwatch with ECG monitoring, SpO₂ sensor, sleep tracking, and a stunning 1.4\" AMOLED always-on display. IP68 water-resistant.",
    price: 12999,
    image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    category: "Electronics",
    slug: "zenith-smart-watch-series-5",
  },
  {
    id: "prod_005",
    name: "Minimal Oak Desk Organiser",
    description:
      "Solid oak and brushed brass desk organiser with compartments for pens, cables, cards, and a wireless charging pad embedded in the base.",
    price: 2799,
    image_url: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80",
    category: "Home & Office",
    slug: "minimal-oak-desk-organiser",
  },
  {
    id: "prod_006",
    name: "PeakFit Resistance Band Set",
    description:
      "Set of 5 latex-free resistance bands (5 kg – 40 kg) with mesh carry bag, door anchor, and ankle straps. Ideal for home workouts and physiotherapy.",
    price: 1299,
    image_url: "https://images.unsplash.com/photo-1598971639058-fab3c3109a03?w=600&q=80",
    category: "Sports & Fitness",
    slug: "peakfit-resistance-band-set",
  },
  {
    id: "prod_007",
    name: "Nomad Canvas Backpack 26L",
    description:
      "Water-resistant waxed canvas backpack with 15\" laptop sleeve, hidden back-panel pocket, and YKK® zippers. Built to last a decade of daily commutes.",
    price: 4199,
    image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
    category: "Bags & Accessories",
    slug: "nomad-canvas-backpack-26l",
  },
  {
    id: "prod_008",
    name: "BaristaPlus Espresso Machine",
    description:
      "15-bar pump espresso maker with built-in conical burr grinder, PID temperature control, and a professional steam wand for silky microfoam milk.",
    price: 18500,
    image_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
    category: "Kitchen",
    slug: "baristaplus-espresso-machine",
  },
];
