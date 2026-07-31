import { NextRequest, NextResponse } from "next/server";
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

const ALLOWED_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];

// ---------------------------------------------------------------------------
// PATCH /api/admin/orders/[id]
// Body: { status: string }
// Updates the status of an order by id.
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return err("Missing order ID", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body.", 400);
  }

  const { status } = (body ?? {}) as { status?: string };
  if (!status || typeof status !== "string" || !status.trim()) {
    return err("Missing required field: status", 400);
  }

  const normalizedStatus = status.trim().toLowerCase();
  if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
    return err(
      `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(", ")}`,
      400
    );
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("orders")
      .update({ status: normalizedStatus })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/admin/orders/[id]]", error);
      if (error.code === "PGRST116") {
        return err("Order not found.", 404);
      }
      return err(`Failed to update order status: ${error.message}`, 500);
    }

    return ok(data);
  } catch (e: unknown) {
    console.error("[PATCH /api/admin/orders/[id]]", e);
    return err("Internal server error.", 500);
  }
}
