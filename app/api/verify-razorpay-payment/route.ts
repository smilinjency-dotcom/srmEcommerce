import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { supabase } from "@/lib/supabase";

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
// POST /api/verify-razorpay-payment
//
// Body:
//   razorpay_order_id   string  – from Razorpay checkout response
//   razorpay_payment_id string  – from Razorpay checkout response
//   razorpay_signature  string  – from Razorpay checkout response
//
// Returns:
//   200 { success: true,  data: { order_id: string } }  on valid signature
//   400 { success: false, error: "..." }                on invalid signature
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // ── 1. Parse body ─────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body.", 400);
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    (body ?? {}) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

  if (!razorpay_order_id)  return err("Missing razorpay_order_id.", 400);
  if (!razorpay_payment_id) return err("Missing razorpay_payment_id.", 400);
  if (!razorpay_signature)  return err("Missing razorpay_signature.", 400);

  // ── 2. Recompute the expected HMAC-SHA256 signature ───────────────────────
  // Razorpay's specification:
  //   signature = HMAC_SHA256( razorpay_order_id + "|" + razorpay_payment_id,
  //                            RAZORPAY_KEY_SECRET )
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    console.error("[verify-razorpay-payment] RAZORPAY_KEY_SECRET not set");
    return err("Server misconfiguration.", 500);
  }

  const payload  = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = createHmac("sha256", keySecret)
    .update(payload)
    .digest("hex");

  // ── 3a. Signature mismatch — do NOT update the order ─────────────────────
  if (expected !== razorpay_signature) {
    console.warn(
      "[verify-razorpay-payment] Signature mismatch for order",
      razorpay_order_id
    );
    return err("Payment signature verification failed.", 400);
  }

  // ── 3b. Signature valid — mark the Supabase order as 'paid' ──────────────
  const { data: order, error: updateError } = await supabase
    .from("orders")
    .update({
      status: "paid",
      razorpay_payment_id,
    })
    .eq("razorpay_order_id", razorpay_order_id)
    .select("id")
    .single();

  if (updateError || !order) {
    console.error("[verify-razorpay-payment] update order:", updateError);
    return err("Failed to update order status.", 500);
  }

  // ── 4. Return success with our Supabase order id ──────────────────────────
  return ok({ order_id: order.id });
}
