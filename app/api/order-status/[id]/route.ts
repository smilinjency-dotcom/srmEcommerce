// TODO: GET /api/order-status/[id]
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ id: params.id });
}
