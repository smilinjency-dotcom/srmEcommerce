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

// ---------------------------------------------------------------------------
// PATCH /api/admin/products/[id]
// Body: Partial<Product>
// Updates an existing product by id.
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return err("Missing product ID", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body.", 400);
  }

  const updates = (body ?? {}) as Partial<Product>;
  const payload: Record<string, unknown> = {};

  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.description !== undefined) payload.description = updates.description.trim();
  if (updates.price !== undefined) {
    if (typeof updates.price !== "number" || updates.price < 0) {
      return err("Price must be a non-negative number.", 400);
    }
    payload.price = updates.price;
  }
  if (updates.image_url !== undefined) payload.image_url = updates.image_url.trim();
  if (updates.category !== undefined) payload.category = updates.category.trim();
  if (updates.stock !== undefined) {
    if (typeof updates.stock !== "number" || updates.stock < 0) {
      return err("Stock must be a non-negative integer.", 400);
    }
    payload.stock = Math.floor(updates.stock);
  }
  if (updates.slug !== undefined) payload.slug = updates.slug.trim();

  if (Object.keys(payload).length === 0) {
    return err("No valid fields provided for update.", 400);
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("products")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/admin/products/[id]]", error);
      if (error.code === "PGRST116") {
        return err("Product not found.", 404);
      }
      if (error.code === "23505") {
        return err("A product with this slug already exists.", 409);
      }
      return err(`Failed to update product: ${error.message}`, 500);
    }

    return ok(data as Product);
  } catch (e: unknown) {
    console.error("[PATCH /api/admin/products/[id]]", e);
    return err("Internal server error.", 500);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/products/[id]
// Deletes a product by id.
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return err("Missing product ID", 400);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error, count } = await (supabase as any)
      .from("products")
      .delete({ count: "exact" })
      .eq("id", id);

    if (error) {
      console.error("[DELETE /api/admin/products/[id]]", error);
      return err(`Failed to delete product: ${error.message}`, 500);
    }

    if (count === 0) {
      return err("Product not found.", 404);
    }

    return ok({ id, deleted: true });
  } catch (e: unknown) {
    console.error("[DELETE /api/admin/products/[id]]", e);
    return err("Internal server error.", 500);
  }
}
