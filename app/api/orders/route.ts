// TODO: Orders API (GET, POST)
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "orders route" });
}
