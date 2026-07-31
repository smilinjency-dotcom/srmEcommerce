import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
// GET /api/admin/orders
// Returns all orders joined with their order_items and product details.
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          order_id,
          product_id,
          quantity,
          price,
          products (
            name,
            image_url,
            slug
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/orders]", error);
      return err("Failed to fetch orders.", 500);
    }

    return ok(data);
  } catch (e: unknown) {
    console.error("[GET /api/admin/orders]", e);
    return err("Internal server error.", 500);
  }
}
