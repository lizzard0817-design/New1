import { NextResponse } from "next/server";
import { submitTransformationEvidence } from "@/lib/server-state";

export async function POST(request: Request) {
  const body = await request.json();
  const student = String(body.student || "").trim();
  const day = body.day === "D+90" ? "D+90" : "D+30";
  const itemId = String(body.itemId || "");
  if (!student || !itemId) {
    return NextResponse.json({ error: "缺少学员或成果物 ID。" }, { status: 400 });
  }
  const result = await submitTransformationEvidence({ student, day, itemId });
  return NextResponse.json(result);
}
