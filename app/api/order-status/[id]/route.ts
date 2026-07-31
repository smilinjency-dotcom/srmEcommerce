import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Data layer
// ---------------------------------------------------------------------------
// ⚠️  SWAP POINT — replace the body of `fetchOrderStatus` to add RLS checks,
//     include payment fields, or join with order_items as needs evolve.
// ---------------------------------------------------------------------------

interface OrderStatus {
  id: string;
  status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
}

async function fetchOrderStatus(id: string): Promise<OrderStatus | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, razorpay_order_id, razorpay_payment_id, created_at")
    .eq("id", id)
    .single();

  // PGRST116 → .single() matched no rows — treat as not found
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as OrderStatus;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
// GET /api/order-status/[id]
//
// Returns:
//   200  { success: true,  data: { id, status, razorpay_order_id,
//                                  razorpay_payment_id, created_at } }
//   404  { success: false, error: "Order not found." }
//   500  { success: false, error: "Failed to fetch order status." }
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await fetchOrderStatus(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/order-status/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order status." },
      { status: 500 }
    );
  }
}
