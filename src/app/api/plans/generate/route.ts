import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { generatePlan } from "@/lib/services/plans";

export const POST = withAuth(async (request, _ctx, user) => {
  const body = await request.json();
  const student = String(body.student || "").trim();

  if (!student) {
    return NextResponse.json({ error: "缺少学员 ID", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const result = await generatePlan(student, user.sub);
  return NextResponse.json(result);
}, { roles: ["admin", "teacher"] });
