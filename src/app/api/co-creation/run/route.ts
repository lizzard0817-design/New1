import { NextResponse } from "next/server";
import { runSharedCoCreationRound } from "@/lib/server-state";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const additional = Array.isArray(body.ideas) ? body.ideas.map((v: unknown) => String(v || "")) : [];
  const result = await runSharedCoCreationRound(additional);
  return NextResponse.json(result);
}
