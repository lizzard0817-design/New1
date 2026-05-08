import { NextResponse } from "next/server";
import { likeSharedItem } from "@/lib/server-state";

export async function POST(request: Request) {
  const body = await request.json();
  const itemId = String(body.itemId || "");
  const voter = typeof body.voter === "string" ? body.voter : undefined;
  const result = await likeSharedItem(itemId, voter);
  return NextResponse.json(result);
}
