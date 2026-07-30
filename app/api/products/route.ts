// TODO: GET /api/products
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "products route" });
}
