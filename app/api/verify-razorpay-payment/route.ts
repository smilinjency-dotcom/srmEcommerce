// TODO: POST /api/verify-razorpay-payment
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "verify-razorpay-payment route" });
}
