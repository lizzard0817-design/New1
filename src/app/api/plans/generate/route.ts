import { NextResponse } from "next/server";
import { generateSharedPlan } from "@/lib/server-state";

export async function POST(request: Request) {
  const body = await request.json();
  const student = String(body.student || "").trim();
  if (!student) {
    return NextResponse.json({ error: "缺少学员姓名。" }, { status: 400 });
  }
  const result = await generateSharedPlan(student);
  return NextResponse.json(result);
}
