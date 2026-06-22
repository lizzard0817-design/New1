import { NextResponse } from "next/server";
import { apiError, requirePermission, sanitizeStateForActor } from "@/lib/api-utils";
import { submitTransformationEvidence } from "@/lib/server-state";

export async function POST(request: Request) {
  const auth = requirePermission(request, "generatePlan");
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError("请求体不是有效 JSON。", 400, "VALIDATION_ERROR");
  }
  const student = String(body.student || "").trim();
  const day = body.day === "D+90" ? "D+90" : "D+30";
  const itemId = String(body.itemId || "");
  if (!student || !itemId) {
    return apiError("缺少学员或成果物 ID。", 400, "VALIDATION_ERROR");
  }
  const result = await submitTransformationEvidence({ student, day, itemId });
  return NextResponse.json({ ...result, state: sanitizeStateForActor(result.state, auth.actor) });
}
