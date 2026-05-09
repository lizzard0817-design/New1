import { getDb } from "../db";
import { growSessions } from "../db/schema";
import { eq } from "drizzle-orm";

type GrowStep = "goal" | "reality" | "options" | "will" | "complete";

const STEP_PROMPTS: Record<Exclude<GrowStep, "complete">, { label: string; question: string }> = {
  goal: { label: "目标 (Goal)", question: "你希望在学习或工作中达成什么具体目标？" },
  reality: { label: "现状 (Reality)", question: "目前的实际情况是怎样的？有什么证据或观察？" },
  options: { label: "选择 (Options)", question: "你有哪些可选的行动方案？各有什么利弊？" },
  will: { label: "行动 (Will)", question: "你决定采取哪个行动？第一步做什么？何时开始？" },
};

export { STEP_PROMPTS, type GrowStep };

export function getOrCreateSession(userId: string) {
  const db = getDb();
  const existing = db.select().from(growSessions)
    .where(eq(growSessions.userId, userId))
    .orderBy(growSessions.updatedAt)
    .get();

  if (existing) return existing;

  const id = `grow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  db.insert(growSessions).values({ id, userId }).run();
  return db.select().from(growSessions).where(eq(growSessions.id, id)).get()!;
}

export function saveStepAnswer(userId: string, step: GrowStep, answer: string) {
  const db = getDb();
  const session = getOrCreateSession(userId);
  const stepOrder: GrowStep[] = ["goal", "reality", "options", "will", "complete"];

  const currentIdx = stepOrder.indexOf(session.currentStep as GrowStep);
  const stepIdx = stepOrder.indexOf(step);
  if (stepIdx < currentIdx) return session;

  const fieldMap: Record<string, string> = {
    goal: "goalAnswer",
    reality: "realityAnswer",
    options: "optionsAnswer",
    will: "willAnswer",
  };

  const field = fieldMap[step];
  if (!field) return session;

  const nextStep = stepIdx < stepOrder.length - 1 ? stepOrder[stepIdx + 1] : "complete";

  db.update(growSessions).set({
    [field]: answer,
    currentStep: nextStep,
    updatedAt: new Date().toISOString(),
  }).where(eq(growSessions.id, session.id)).run();

  return db.select().from(growSessions).where(eq(growSessions.id, session.id)).get()!;
}

export function composeReflectionFromSession(session: NonNullable<ReturnType<typeof getOrCreateSession>>) {
  return [
    `目标：${session.goalAnswer}`,
    `现状：${session.realityAnswer}`,
    `选择：${session.optionsAnswer}`,
    `行动：${session.willAnswer}`,
  ].join("\n");
}

export function deleteSession(userId: string) {
  const db = getDb();
  db.delete(growSessions).where(eq(growSessions.userId, userId)).run();
}
