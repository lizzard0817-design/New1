import { NextResponse } from "next/server";
import { apiError, requirePermission, sanitizeStateForActor } from "@/lib/api-utils";
import { runSharedCoCreationRound } from "@/lib/server-state";

export async function POST(request: Request) {
  const auth = requirePermission(request, "runCoCreation");
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError("请求体不是有效 JSON。", 400, "VALIDATION_ERROR");
  }
  const additional = Array.isArray(body.ideas)
    ? body.ideas.map((v: unknown) => String(v || "").trim()).filter(Boolean).slice(0, 20)
    : [];
  const group = auth.actor.role === "student"
    ? auth.actor.groupName
    : typeof body.group === "string" && body.group.trim()
      ? body.group.trim()
      : auth.actor.groupName;
  const result = await runSharedCoCreationRound(additional, group);
  return NextResponse.json({ ...result, state: sanitizeStateForActor(result.state, auth.actor) });
}
