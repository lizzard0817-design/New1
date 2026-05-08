import { NextResponse } from "next/server";
import { likeSharedItem } from "@/lib/server-state";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await likeSharedItem(String(body.itemId || ""));
  return NextResponse.json(result);
}
