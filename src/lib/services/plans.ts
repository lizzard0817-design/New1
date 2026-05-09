import { getDb } from "../db";
import { personalPlans, personalPlanActions, personalPlanCheckpoints, personalPlanCitedCases, knowledgeEntries, knowledgeEntryTags, users, reminders } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { listKnowledgeEntries } from "./knowledge";
import { reviewWithMiniMax } from "../minimax";
import { getDecryptedModelConfig } from "./model-config";
import type { PhaseId } from "../agents";

function addDays(base: Date, days: number) {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export async function generatePlan(studentId: string, teacherId: string) {
  const db = getDb();
  const student = db.select().from(users).where(eq(users.id, studentId)).get();
  if (!student) return null;

  const kbResult = listKnowledgeEntries({ pageSize: 50 });
  const relevantEntries = kbResult.data.filter(
    (e) => e.phase === "co-creation" || e.phase === "transformation" || e.phase === "reflection"
  ).slice(-5);

  const citedCases = relevantEntries.map((e) => e.title);
  const now = new Date();
  const generatedAt = now.toISOString().slice(0, 10);
  const d30 = addDays(now, 30).toISOString().slice(0, 10);
  const d90 = addDays(now, 90).toISOString().slice(0, 10);

  let recommendation = `建议 ${student.name} 围绕"提升课堂提问质量和学生参与度"形成小步行动方案，先选定一节真实课作为转化场景，再复用深学、跟练、反思和共创知识库中的方法素材。`;
  let actions = [
    "选择一节 2 周内可实施的真实课作为转化场景。",
    `引用 ${citedCases.slice(0, 2).join("和")}完善课堂设计。`,
    "在课堂中收集学生发言记录、观察量表和改进证据。",
    `${d30} 提交初步成果，${d90} 形成完整转化案例。`,
  ];

  try {
    const modelConfig = await getDecryptedModelConfig(teacherId);
    if (modelConfig?.enabled && relevantEntries.length > 0) {
      const prompt = `基于以下知识库条目，为学员${student.name}生成一份个性化方案建议（2-3句话）：\n${relevantEntries.map((e) => `- ${e.title}：${e.summary}`).join("\n")}`;
      const aiResult = await reviewWithMiniMax({
        phase: "transformation",
        title: "生成个性化方案",
        body: prompt,
        modelConfig,
      });
      if (aiResult?.aiSummary) {
        recommendation = aiResult.aiSummary;
      }
    }
  } catch {
    // fallback to template
  }

  const planId = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  db.insert(personalPlans).values({
    id: planId,
    studentId,
    recommendation,
    generatedAt,
  }).run();

  actions.forEach((actionText, sortOrder) => {
    db.insert(personalPlanActions).values({ planId, actionText, sortOrder }).run();
  });

  db.insert(personalPlanCheckpoints).values([
    { planId, label: "训后 1 个月提醒", day: "D+30", dueDate: d30, status: "待提交" },
    { planId, label: "训后 3 个月追踪", day: "D+90", dueDate: d90, status: "待提醒" },
  ]);

  for (const caseTitle of citedCases) {
    db.insert(personalPlanCitedCases).values({ planId, caseTitle }).run();
  }

  return getPlanById(planId);
}

export function getPlanById(id: string) {
  const db = getDb();
  const plan = db.select().from(personalPlans).where(eq(personalPlans.id, id)).get();
  if (!plan) return null;

  const actions = db.select().from(personalPlanActions).where(eq(personalPlanActions.planId, id)).orderBy(personalPlanActions.sortOrder).all();
  const checkpoints = db.select().from(personalPlanCheckpoints).where(eq(personalPlanCheckpoints.planId, id)).all();
  const citedCases = db.select().from(personalPlanCitedCases).where(eq(personalPlanCitedCases.planId, id)).all();

  return {
    ...plan,
    actions: actions.map((a) => a.actionText),
    checkpoints: checkpoints.map((c) => ({
      id: c.id,
      label: c.label,
      day: c.day,
      dueDate: c.dueDate,
      status: c.status as "待提醒" | "待提交" | "已评估",
      evidenceItemId: c.evidenceItemId,
    })),
    citedCases: citedCases.map((c) => c.caseTitle),
  };
}

export function getPlansByStudent(studentId: string) {
  const db = getDb();
  const plans = db.select().from(personalPlans).where(eq(personalPlans.studentId, studentId)).orderBy(desc(personalPlans.generatedAt)).all();
  return plans.map((p) => getPlanById(p.id));
}

export function getAllPlans() {
  const db = getDb();
  const plans = db.select().from(personalPlans).orderBy(desc(personalPlans.generatedAt)).all();
  return plans.map((p) => getPlanById(p.id));
}

export function confirmPlan(planId: string) {
  const db = getDb();
  const plan = db.select().from(personalPlans).where(eq(personalPlans.id, planId)).get();
  if (!plan) return null;

  db.update(personalPlans).set({ confirmed: true, confirmedAt: new Date().toISOString() }).where(eq(personalPlans.id, planId)).run();

  const checkpoints = db.select().from(personalPlanCheckpoints).where(eq(personalPlanCheckpoints.planId, planId)).all();
  for (const cp of checkpoints) {
    if (cp.dueDate) {
      const reminderId = `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      db.insert(reminders).values({
        id: reminderId,
        studentId: plan.studentId,
        planId,
        checkpointDay: cp.day,
        dueDate: cp.dueDate,
        status: "pending",
      }).run();
    }
  }

  return getPlanById(planId);
}

export function submitCheckpoint(planId: string, day: "D+30" | "D+90", itemId: string) {
  const db = getDb();
  db.update(personalPlanCheckpoints)
    .set({ status: "已评估", evidenceItemId: itemId })
    .where(and(eq(personalPlanCheckpoints.planId, planId), eq(personalPlanCheckpoints.day, day)))
    .run();

  return getPlanById(planId);
}
