// TODO: Cart API (GET, POST, DELETE)
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "cart route" });
}
