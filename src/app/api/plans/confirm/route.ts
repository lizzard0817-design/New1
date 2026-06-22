import { NextResponse } from "next/server";
import { apiError, requirePermission, sanitizeStateForActor } from "@/lib/api-utils";
import { confirmSharedPlan } from "@/lib/server-state";

export async function POST(request: Request) {
  const auth = requirePermission(request, "trackTransformation");
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => ({}));
  const requestedStudent = String(body.student || "").trim();
  const student = auth.actor.role === "student" ? auth.actor.name : requestedStudent;
  if (!student) {
    return apiError("缺少学员姓名。", 400, "VALIDATION_ERROR");
  }
  const result = await confirmSharedPlan(student);
  if (!result.plan) {
    return apiError("该学员还没有可确认的行动计划。", 404, "NOT_FOUND");
  }
  return NextResponse.json({ ...result, state: sanitizeStateForActor(result.state, auth.actor) });
}
