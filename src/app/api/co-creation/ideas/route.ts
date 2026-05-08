import { NextResponse } from "next/server";
import { submitSharedIdeas } from "@/lib/server-state";

export async function POST(request: Request) {
  const body = await request.json();
  const ideas = Array.isArray(body.ideas) ? body.ideas.map((v: unknown) => String(v || "")) : [];
  const result = await submitSharedIdeas(ideas);
  return NextResponse.json(result);
}
