import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { submitCheckpoint } from "@/lib/services/plans";

export const POST = withAuth(async (request) => {
  const body = await request.json();
  const planId = String(body.planId || "").trim();
  const day = body.day === "D+90" ? "D+90" : "D+30";
  const itemId = String(body.itemId || "");

  if (!planId || !itemId) {
    return NextResponse.json({ error: "缺少方案 ID 或成果物 ID", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const result = submitCheckpoint(planId, day, itemId);
  return NextResponse.json(result);
});
