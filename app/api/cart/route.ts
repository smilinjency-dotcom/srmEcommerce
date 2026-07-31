import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { CartItem } from "@/types/supabase";

// ---------------------------------------------------------------------------
// Response shape helpers
// ---------------------------------------------------------------------------

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// ---------------------------------------------------------------------------
// GET /api/cart?user_id=<uid>
// Returns all cart_items rows for the given user, joined with basic product
// info (name, price, image_url, slug) so the client doesn't need a
// second round-trip.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const user_id = request.nextUrl.searchParams.get("user_id")?.trim();

  if (!user_id) {
    return err("Missing required query param: user_id", 400);
  }

  const { data, error } = await supabase
    .from("cart_items")
    .select(`
      id,
      user_id,
      product_id,
      quantity,
      created_at,
      products (
        name,
        price,
        image_url,
        slug
      )
    `)
    .eq("user_id", user_id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[GET /api/cart]", error);
    return err("Failed to fetch cart items.", 500);
  }

  return ok(data);
}

// ---------------------------------------------------------------------------
// POST /api/cart
// Body: { user_id, product_id, quantity }
// Upserts the row — if the (user_id, product_id) pair already exists the
// quantity is replaced with the new value (client manages accumulation).
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body.", 400);
  }

  const { user_id, product_id, quantity } =
    (body ?? {}) as Partial<CartItem>;

  if (!user_id)    return err("Missing required field: user_id", 400);
  if (!product_id) return err("Missing required field: product_id", 400);
  if (
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    return err("quantity must be a positive integer.", 400);
  }

  // Supabase upsert: on conflict (user_id, product_id) the row is updated.
  // We use the generic (untyped) query path to side-step a known limitation
  // in hand-written Database types where Update = Partial<Insert> triggers
  // a "never" resolution inside the client's overloaded upsert signature.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  const { data, error } = await client
    .from("cart_items")
    .upsert(
      { user_id, product_id, quantity },
      { onConflict: "user_id,product_id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) {
    console.error("[POST /api/cart]", error);
    return err("Failed to add item to cart.", 500);
  }

  return ok(data as CartItem, 201);
}

// ---------------------------------------------------------------------------
// PATCH /api/cart
// Body: { id, quantity }
// Updates the quantity of a single cart_items row identified by its PK.
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body.", 400);
  }

  const { id, quantity } = (body ?? {}) as { id?: string; quantity?: number };

  if (!id) return err("Missing required field: id", 400);
  if (
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    return err("quantity must be a positive integer.", 400);
  }

  // Same workaround: cast to any for the write path only.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  const { data, error } = await client
    .from("cart_items")
    .update({ quantity })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    // PGRST116 → .single() found no rows
    if (error.code === "PGRST116") {
      return err("Cart item not found.", 404);
    }
    console.error("[PATCH /api/cart]", error);
    return err("Failed to update cart item.", 500);
  }

  return ok(data as CartItem);
}

// ---------------------------------------------------------------------------
// DELETE /api/cart
// Body: { id }
// Removes a single cart_items row by its PK.
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body.", 400);
  }

  const { id } = (body ?? {}) as { id?: string };

  if (!id) return err("Missing required field: id", 400);

  const { error, count } = await supabase
    .from("cart_items")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    console.error("[DELETE /api/cart]", error);
    return err("Failed to delete cart item.", 500);
  }

  if (count === 0) {
    return err("Cart item not found.", 404);
  }

  return ok({ id, deleted: true });
}
