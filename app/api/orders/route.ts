import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabaseAdmin";
import type { Order, OrderItem } from "@/types/supabase";

// ---------------------------------------------------------------------------
// Response shape helpers (consistent with /api/cart convention)
// ---------------------------------------------------------------------------

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// ---------------------------------------------------------------------------
// Request body shape
// ---------------------------------------------------------------------------

interface CartItemInput {
  product_id: string;
  quantity: number;
  price: number; // unit price in INR at time of checkout
}

interface ShippingDetails {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
}

interface CreateOrderBody {
  user_id: string;
  cart_items: CartItemInput[];
  shipping: ShippingDetails;
}

// ---------------------------------------------------------------------------
// Data layer — all Supabase interaction lives in these three functions.
// Swap or extend here when adding payment capture, inventory deductions, etc.
// ---------------------------------------------------------------------------

/** Step 1 – insert the order header row and return it. */
async function insertOrder(
  user_id: string,
  total_amount: number,
  shipping: ShippingDetails
): Promise<Order> {
  const supabase = getAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("orders")
    .insert({
      user_id,
      status: "pending",
      total_amount,
      shipping_name: shipping.name,
      shipping_address: shipping.address,
      shipping_city: shipping.city,
      shipping_postal_code: shipping.postal_code,
      shipping_phone: shipping.phone,
    })
    .select()
    .single();

  if (error) throw new Error(`insert order: ${error.message}`);
  return data as Order;
}

/** Step 2 – insert one order_items row per cart entry. */
async function insertOrderItems(
  order_id: string,
  items: CartItemInput[]
): Promise<OrderItem[]> {
  const supabase = getAdminClient();
  const rows = items.map((item) => ({
    order_id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("order_items")
    .insert(rows)
    .select();

  if (error) throw new Error(`insert order_items: ${error.message}`);
  return (data ?? []) as OrderItem[];
}

/** Step 3 – delete all cart_items rows belonging to the user. */
async function clearCart(user_id: string): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", user_id);

  if (error) throw new Error(`clear cart: ${error.message}`);
}

// ---------------------------------------------------------------------------
// POST /api/orders
//
// Body: {
//   user_id:    string,
//   cart_items: Array<{ product_id, quantity, price }>,
//   shipping:   { name, address, city, postal_code, phone }
// }
//
// Returns: { success: true, data: { order_id: string } }
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // ── Parse body ────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body.", 400);
  }

  const { user_id, cart_items, shipping } =
    (body ?? {}) as Partial<CreateOrderBody>;

  // ── Validate ──────────────────────────────────────────────────────────────
  if (!user_id) return err("Missing required field: user_id", 400);

  if (!Array.isArray(cart_items) || cart_items.length === 0) {
    return err("cart_items must be a non-empty array.", 400);
  }

  for (const item of cart_items) {
    if (!item.product_id) return err("Each cart item must have a product_id.", 400);
    if (
      typeof item.quantity !== "number" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      return err("Each cart item quantity must be a positive integer.", 400);
    }
    if (typeof item.price !== "number" || item.price < 0) {
      return err("Each cart item price must be a non-negative number.", 400);
    }
  }

  if (!shipping) return err("Missing required field: shipping", 400);
  const { name, address, city, postal_code, phone } = shipping;
  if (!name)        return err("Missing required field: shipping.name", 400);
  if (!address)     return err("Missing required field: shipping.address", 400);
  if (!city)        return err("Missing required field: shipping.city", 400);
  if (!postal_code) return err("Missing required field: shipping.postal_code", 400);
  if (!phone)       return err("Missing required field: shipping.phone", 400);

  // ── Compute total ─────────────────────────────────────────────────────────
  const total_amount = cart_items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // ── Execute the three writes sequentially ────────────────────────────────
  // We don't use a DB transaction here because the anon key has no access to
  // Supabase RPC functions. Partial failures are logged so they can be
  // reconciled manually or via a future server-side function.
  try {
    const order = await insertOrder(user_id, total_amount, shipping);
    await insertOrderItems(order.id, cart_items);
    await clearCart(user_id);

    return ok({ order_id: order.id }, 201);
  } catch (error) {
    console.error("[POST /api/orders]", error);
    return err("Failed to create order.", 500);
  }
}
