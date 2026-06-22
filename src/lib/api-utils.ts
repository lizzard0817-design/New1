import { NextResponse } from "next/server";
import { can, type PermissionKey, type RoleId } from "@/lib/agents";
import type { SharedState } from "@/lib/server-state";

export type RequestActor = {
  id: string;
  name: string;
  role: RoleId;
  groupName: string;
};

export function apiError(message: string, status = 400, code = "BAD_REQUEST") {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function readActor(request: Request): RequestActor | null {
  const role = normalizeRole(request.headers.get("x-wuhuan-role"));
  const id = request.headers.get("x-wuhuan-user-id") || "";
  const name = decodeHeaderValue(request.headers.get("x-wuhuan-user-name") || "");
  const groupName = decodeHeaderValue(request.headers.get("x-wuhuan-group") || "全班");
  if (!role || !id || !name) return null;
  return { id, name, role, groupName };
}

export function requirePermission(request: Request, permission: PermissionKey) {
  const actor = readActor(request);
  if (!actor) {
    return { response: apiError("请先登录后再执行该操作。", 401, "UNAUTHORIZED") };
  }
  if (!can(actor.role, permission)) {
    return { response: apiError("当前账号没有执行该操作的权限。", 403, "FORBIDDEN") };
  }
  return { actor };
}

export function sanitizeStateForActor(state: SharedState, actor: RequestActor): SharedState {
  const visibleKnowledge = actor.role === "admin" ? state.knowledgeBase : state.knowledgeBase.filter((entry) => entry.status !== "hidden");
  if (actor.role !== "student") {
    return { ...state, knowledgeBase: visibleKnowledge };
  }
  return {
    ...state,
    knowledgeBase: visibleKnowledge,
    accounts: [],
    plansByStudent: actor.name && state.plansByStudent[actor.name] ? { [actor.name]: state.plansByStudent[actor.name] } : {}
  };
}

export function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function normalizeRole(value: string | null): RoleId | null {
  if (value === "admin" || value === "teacher" || value === "student") return value;
  return null;
}

function decodeHeaderValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
