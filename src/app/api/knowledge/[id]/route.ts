import { NextResponse } from "next/server";
import { apiError, requirePermission, sanitizeStateForActor } from "@/lib/api-utils";
import { deleteSharedKnowledgeEntry, updateSharedKnowledgeEntry } from "@/lib/server-state";
import type { KnowledgeEntry } from "@/lib/agents";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requirePermission(request, "managePermissions");
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError("请求体不是有效 JSON。", 400, "VALIDATION_ERROR");
  }
  const patch: Partial<KnowledgeEntry> = {
    title: typeof body.title === "string" ? body.title : undefined,
    summary: typeof body.summary === "string" ? body.summary : undefined,
    source: typeof body.source === "string" ? body.source : undefined,
    tags: Array.isArray(body.tags) ? body.tags : undefined,
    status: body.status === "hidden" ? "hidden" : body.status === "active" ? "active" : undefined
  };
  const result = await updateSharedKnowledgeEntry(id, patch);
  if (!result.entry) {
    return apiError("知识库条目不存在。", 404, "NOT_FOUND");
  }
  return NextResponse.json({ ...result, state: sanitizeStateForActor(result.state, auth.actor) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requirePermission(request, "managePermissions");
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const result = await deleteSharedKnowledgeEntry(id);
  if (!result.deleted) {
    return apiError("知识库条目不存在。", 404, "NOT_FOUND");
  }
  return NextResponse.json({ ...result, state: sanitizeStateForActor(result.state, auth.actor) });
}
