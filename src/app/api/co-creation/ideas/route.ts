import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { submitIdeas } from "@/lib/services/co-creation";

export const POST = withAuth(async (request, _ctx, user) => {
  const body = await request.json();
  const topicId = String(body.topicId || "");
  const ideas = Array.isArray(body.ideas) ? body.ideas.map((v: unknown) => String(v || "")) : [];

  if (!topicId || ideas.length === 0) {
    return NextResponse.json({ error: "缺少主题 ID 或观点内容", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const result = submitIdeas(topicId, ideas, user.sub);
  return NextResponse.json(result);
});
