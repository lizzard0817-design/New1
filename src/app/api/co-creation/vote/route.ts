import { NextResponse } from "next/server";
import { apiError, requirePermission, sanitizeStateForActor } from "@/lib/api-utils";
import { voteSharedIdea } from "@/lib/server-state";

export async function POST(request: Request) {
  const auth = requirePermission(request, "likeContent");
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError("请求体不是有效 JSON。", 400, "VALIDATION_ERROR");
  }
  const idea = String(body.idea || "");
  if (!idea) {
    return apiError("缺少观点内容。", 400, "VALIDATION_ERROR");
  }
  const group = auth.actor.role === "student"
    ? auth.actor.groupName
    : typeof body.group === "string" && body.group.trim()
      ? body.group.trim()
      : auth.actor.groupName;
  const result = await voteSharedIdea(idea, auth.actor.id, group);
  return NextResponse.json({ ...result, state: sanitizeStateForActor(result.state, auth.actor) });
}
