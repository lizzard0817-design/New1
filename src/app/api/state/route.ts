import { NextResponse } from "next/server";
import { readSharedState } from "@/lib/server-state";

export async function GET() {
  const state = await readSharedState();
  return NextResponse.json(state);
}
