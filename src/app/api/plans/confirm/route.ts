import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { confirmPlan, getPlansByStudent, getAllPlans } from "@/lib/services/plans";

export const GET = withAuth(async (request, _ctx, user) => {
  if (user.role === "student") {
    return NextResponse.json(getPlansByStudent(user.sub));
  }
  return NextResponse.json(getAllPlans());
});

export const POST = withAuth(async (request, _ctx, user) => {
  const body = await request.json();
  const planId = String(body.planId || "").trim();

  if (!planId) {
    return NextResponse.json({ error: "缺少方案 ID", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const result = confirmPlan(planId);
  return NextResponse.json(result);
});
