import { NextResponse } from "next/server";
import { apiError, requirePermission, sanitizeStateForActor } from "@/lib/api-utils";
import { readSharedState, upsertSharedAccount } from "@/lib/server-state";
import type { DemoAccount, RoleId } from "@/lib/agents";

function normalizeRole(value: unknown): RoleId {
  return value === "admin" || value === "teacher" || value === "student" ? value : "student";
}

export async function GET(request: Request) {
  const auth = requirePermission(request, "managePermissions");
  if ("response" in auth) return auth.response;
  const state = await readSharedState();
  return NextResponse.json({ accounts: state.accounts });
}

export async function POST(request: Request) {
  const auth = requirePermission(request, "managePermissions");
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError("请求体不是有效 JSON。", 400, "VALIDATION_ERROR");
  }
  const account: Partial<DemoAccount> = {
    id: typeof body.id === "string" && body.id ? body.id : undefined,
    username: String(body.username || "").trim(),
    password: String(body.password || "").trim() || "student123",
    name: String(body.name || "").trim(),
    role: normalizeRole(body.role),
    className: String(body.className || "青年教师研修一班").trim(),
    groupName: String(body.groupName || "第一小组").trim(),
    title: String(body.title || "参训学员").trim(),
    active: body.active !== false
  };
  if (!account.username || !account.name) {
    return apiError("账号和姓名不能为空。", 400, "VALIDATION_ERROR");
  }
  const result = await upsertSharedAccount(account);
  return NextResponse.json({ ...result, state: sanitizeStateForActor(result.state, auth.actor) });
}

export async function PATCH(request: Request) {
  return POST(request);
}
