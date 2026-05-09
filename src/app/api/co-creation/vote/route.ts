import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { voteIdea } from "@/lib/services/co-creation";

export const POST = withAuth(async (request, _ctx, user) => {
  const body = await request.json();
  const topicId = String(body.topicId || "");
  const idea = String(body.idea || "");

  if (!topicId || !idea) {
    return NextResponse.json({ error: "缺少主题 ID 或观点内容", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const result = voteIdea(topicId, idea, user.sub);
  return NextResponse.json(result);
});
