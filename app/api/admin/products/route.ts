import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types/supabase";

// ---------------------------------------------------------------------------
// Response shape helpers
// ---------------------------------------------------------------------------

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/** Helper to generate a clean URL slug from a product name */
function generateSlug(name: string): string {
  const clean = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean || `product-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// GET /api/admin/products
// Returns all products sorted by created_at descending.
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/products]", error);
      return err("Failed to fetch products.", 500);
    }

    return ok(data as Product[]);
  } catch (e: unknown) {
    console.error("[GET /api/admin/products]", e);
    return err("Internal server error.", 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/products
// Body: { name, description, price, image_url, category, stock, slug }
// Inserts a new product into Supabase.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body.", 400);
  }

  const { name, description, price, image_url, category, stock, slug } =
    (body ?? {}) as Partial<Product>;

  if (!name?.trim()) return err("Missing required field: name", 400);
  if (price === undefined || typeof price !== "number" || price < 0) {
    return err("Price must be a non-negative number.", 400);
  }
  if (!category?.trim()) return err("Missing required field: category", 400);

  const finalSlug = slug?.trim() ? slug.trim() : generateSlug(name);
  const finalStock = typeof stock === "number" && stock >= 0 ? Math.floor(stock) : 0;

  const payload = {
    name: name.trim(),
    description: (description ?? "").trim(),
    price,
    image_url: (image_url ?? "").trim(),
    category: category.trim(),
    stock: finalStock,
    slug: finalSlug,
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("products")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[POST /api/admin/products]", error);
      if (error.code === "23505") {
        return err("A product with this slug already exists.", 409);
      }
      return err(`Failed to create product: ${error.message}`, 500);
    }

    return ok(data as Product, 201);
  } catch (e: unknown) {
    console.error("[POST /api/admin/products]", e);
    return err("Internal server error.", 500);
  }
}
