import { NextResponse } from "next/server";
import { apiError, requirePermission, sanitizeStateForActor } from "@/lib/api-utils";
import { likeSharedItem } from "@/lib/server-state";

export async function POST(request: Request) {
  const auth = requirePermission(request, "likeContent");
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError("请求体不是有效 JSON。", 400, "VALIDATION_ERROR");
  }
  const itemId = String(body.itemId || "");
  if (!itemId) {
    return apiError("缺少内容 ID。", 400, "VALIDATION_ERROR");
  }
  const result = await likeSharedItem(itemId, auth.actor.id);
  return NextResponse.json({ ...result, state: sanitizeStateForActor(result.state, auth.actor) });
}
