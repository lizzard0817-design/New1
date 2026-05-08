import { NextResponse } from "next/server";
import { voteSharedIdea } from "@/lib/server-state";

export async function POST(request: Request) {
  const body = await request.json();
  const idea = String(body.idea || "");
  const voter = typeof body.voter === "string" ? body.voter : undefined;
  if (!idea) {
    return NextResponse.json({ error: "缺少观点内容。" }, { status: 400 });
  }
  const result = await voteSharedIdea(idea, voter);
  return NextResponse.json(result);
}
