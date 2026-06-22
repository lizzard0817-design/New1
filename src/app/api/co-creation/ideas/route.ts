import { NextResponse } from "next/server";
import { apiError, requirePermission, sanitizeStateForActor } from "@/lib/api-utils";
import { submitSharedIdeas } from "@/lib/server-state";

export async function POST(request: Request) {
  const auth = requirePermission(request, "submitCoCreationIdeas");
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError("请求体不是有效 JSON。", 400, "VALIDATION_ERROR");
  }
  const ideas = Array.isArray(body.ideas)
    ? body.ideas.map((v: unknown) => String(v || "").trim()).filter(Boolean).slice(0, 20)
    : [];
  if (!ideas.length) {
    return apiError("请至少提交一条观点。", 400, "VALIDATION_ERROR");
  }
  const group = auth.actor.role === "student"
    ? auth.actor.groupName
    : typeof body.group === "string" && body.group.trim()
      ? body.group.trim()
      : auth.actor.groupName;
  const result = await submitSharedIdeas(ideas, group);
  return NextResponse.json({ ...result, state: sanitizeStateForActor(result.state, auth.actor) });
}
