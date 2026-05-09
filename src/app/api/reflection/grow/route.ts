import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { getOrCreateSession, saveStepAnswer, STEP_PROMPTS, composeReflectionFromSession, deleteSession } from "@/lib/services/reflection";
import type { GrowStep } from "@/lib/services/reflection";

export const GET = withAuth(async (_request, _ctx, user) => {
  const session = getOrCreateSession(user.sub);
  return NextResponse.json({
    ...session,
    stepInfo: STEP_PROMPTS[session.currentStep as Exclude<GrowStep, "complete">] || null,
  });
});

export const POST = withAuth(async (request, _ctx, user) => {
  const body = await request.json();
  const action = String(body.action || "");

  if (action === "reset") {
    deleteSession(user.sub);
    const session = getOrCreateSession(user.sub);
    return NextResponse.json({ ...session, stepInfo: STEP_PROMPTS[session.currentStep as Exclude<GrowStep, "complete">] || null });
  }

  const step = body.step as GrowStep;
  const answer = String(body.answer || "").trim();

  if (!step || !answer) {
    return NextResponse.json({ error: "缺少步骤或回答", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const session = saveStepAnswer(user.sub, step, answer);
  const composed = session.currentStep === "complete" ? composeReflectionFromSession(session) : null;

  return NextResponse.json({
    ...session,
    stepInfo: STEP_PROMPTS[session.currentStep as Exclude<GrowStep, "complete">] || null,
    composed,
  });
});
