import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { runConvergenceRound } from "@/lib/services/co-creation";

export const POST = withAuth(async (request, _ctx, user) => {
  const body = await request.json().catch(() => ({}));
  const topicId = String(body.topicId || "");
  const additional = Array.isArray(body.ideas) ? body.ideas.map((v: unknown) => String(v || "")) : [];

  if (!topicId) {
    return NextResponse.json({ error: "缺少主题 ID", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const result = await runConvergenceRound(topicId, additional, user.sub);
  return NextResponse.json(result);
}, { roles: ["admin", "teacher"] });
