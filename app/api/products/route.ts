import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
// Re-export the canonical Product row type from types/supabase.ts so that
// consumers (e.g. app/products/page.tsx) can import it from one place.
export type { Product } from "@/types/supabase";
import type { Product } from "@/types/supabase";

// ---------------------------------------------------------------------------
// Data layer
// ---------------------------------------------------------------------------
// ⚠️  SINGLE SWAP POINT — all Supabase interaction lives here.
//     The route handler below never touches the client directly.
//
// Filters are pushed down to the database so only matching rows are
// transferred over the wire (no in-process array filtering).
// ---------------------------------------------------------------------------

async function fetchProducts(search: string, category: string): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select("id, name, description, price, image_url, category, slug, stock, created_at")
    .order("created_at", { ascending: false });

  // Full-text-style name search — case-insensitive substring via ilike
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  // Exact category match — ilike keeps it case-insensitive on the DB side
  if (category) {
    query = query.ilike("category", category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Product[];
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search   = searchParams.get("search")?.trim()   ?? "";
    const category = searchParams.get("category")?.trim() ?? "";

    const products = await fetchProducts(search, category);

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json(
      { error: "Failed to fetch products." },
      { status: 500 }
    );
  }
}
