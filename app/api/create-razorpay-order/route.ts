import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabaseAdmin";
import razorpay from "@/lib/razorpay";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// ---------------------------------------------------------------------------
// POST /api/create-razorpay-order
//
// Body:    { order_id: string }   ← our Supabase order UUID
// Returns: { razorpay_order_id: string, amount: number, currency: string }
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const supabase = getAdminClient();
  // ── 1. Parse body ─────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body.", 400);
  }

  const { order_id } = (body ?? {}) as { order_id?: string };

  if (!order_id || typeof order_id !== "string") {
    return err("Missing required field: order_id", 400);
  }

  // ── 2. Fetch the order's total_amount from Supabase ───────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error: fetchError } = await (supabase as any)
    .from("orders")
    .select("id, total_amount, status")
    .eq("id", order_id)
    .single();

  if (fetchError || !order) {
    console.error("[create-razorpay-order] fetch order:", fetchError);
    return err("Order not found.", 404);
  }

  if (order.status !== "pending") {
    return err(`Order is already in status '${order.status}'.`, 409);
  }

  // ── 3. Create a Razorpay order (amount in paise = INR × 100) ─────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rzpOrder: any;
  try {
    rzpOrder = await razorpay.orders.create({
      amount: Math.round(order.total_amount * 100), // convert INR → paise
      currency: "INR",
      receipt: `rcpt_${order_id.slice(0, 20)}`,     // max 40 chars
      notes: { supabase_order_id: order_id },
    });
  } catch (e) {
    console.error("[create-razorpay-order] Razorpay API:", e);
    return err("Failed to create Razorpay order.", 502);
  }

  // ── 4. Save the Razorpay order id back to Supabase ────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("orders")
    .update({ razorpay_order_id: rzpOrder.id })
    .eq("id", order_id);

  if (updateError) {
    // Non-fatal — log and continue; the frontend still needs the order id
    console.error("[create-razorpay-order] update razorpay_order_id:", updateError);
  }

  // ── 5. Return Razorpay order details to the frontend ──────────────────────
  return ok({
    razorpay_order_id: rzpOrder.id,
    amount: rzpOrder.amount,       // in paise
    currency: rzpOrder.currency,
  });
}
