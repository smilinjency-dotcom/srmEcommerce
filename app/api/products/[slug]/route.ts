import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types/supabase";

// ---------------------------------------------------------------------------
// Data layer
// ---------------------------------------------------------------------------
// ⚠️  SINGLE SWAP POINT — all Supabase interaction lives here.
//     The route handler below never touches the client directly.
// ---------------------------------------------------------------------------

async function findBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  // PostgREST returns error code PGRST116 when .single() finds no rows —
  // treat that as "not found" rather than a server error.
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as Product;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
// Next.js 15+: dynamic route params are a Promise and must be awaited.
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await findBySlug(slug);

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
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
