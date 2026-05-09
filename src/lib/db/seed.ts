import { getDb, runMigrations } from "./index";
import { eq, and, isNull } from "drizzle-orm";
import { users, learningItems, knowledgeEntries, coCreationTopics, coCreationIdeas, learningItemTags, knowledgeEntryTags } from "./schema";
import { hashPassword } from "../auth/password";
import { likeThreshold, initialItems, initialCoCreation, initialKnowledgeBase } from "../agents";
import type { RoleId, PhaseId, ContentType } from "../agents";

const DEMO_ACCOUNTS = [
  { id: "account-admin", username: "admin", password: "admin123", name: "系统管理员", role: "admin" as RoleId, className: "平台管理组", title: "系统配置与权限治理" },
  { id: "account-teacher", username: "teacher", password: "teacher123", name: "周老师", role: "teacher" as RoleId, className: "青年教师研修一班", title: "班级运营负责人" },
  { id: "account-student", username: "student", password: "student123", name: "李同学", role: "student" as RoleId, className: "青年教师研修一班", title: "参训学员" },
  { id: "account-student-wang", username: "student2", password: "student123", name: "王同学", role: "student" as RoleId, className: "青年教师研修一班", title: "参训学员" },
  { id: "account-student-chen", username: "student3", password: "student123", name: "陈同学", role: "student" as RoleId, className: "青年教师研修一班", title: "参训学员" },
];

export async function seedDatabase() {
  runMigrations();
  const db = getDb();

  const existingUsers = db.select({ id: users.id }).from(users).all();
  if (existingUsers.length > 0) return;

  console.log("[seed] Seeding database with demo data...");

  for (const account of DEMO_ACCOUNTS) {
    const passwordHash = await hashPassword(account.password);
    db.insert(users).values({
      id: account.id,
      username: account.username,
      passwordHash,
      name: account.name,
      role: account.role,
      className: account.className,
      title: account.title,
    }).run();
  }

  const submitterMap: Record<string, string> = {
    "李同学": "account-student",
    "王同学": "account-student-wang",
    "陈同学": "account-student-chen",
  };

  for (const item of initialItems) {
    db.insert(learningItems).values({
      id: item.id,
      phase: item.phase as PhaseId,
      type: item.type as ContentType,
      title: item.title,
      body: item.body,
      submitterId: submitterMap[item.author] || "account-student",
      submitterRole: "student",
      author: item.author,
      likes: item.likes,
      threshold: item.threshold,
      quality: item.quality,
      inKnowledgeBase: item.inKnowledgeBase,
      isExcellent: item.inKnowledgeBase,
      reviewSource: "local",
    }).run();

    for (const tag of item.tags) {
      db.insert(learningItemTags).values({ itemId: item.id, tag }).run();
    }
  }

  for (const entry of initialKnowledgeBase) {
    const originalId = entry.id.replace("kb-", "");
    db.insert(knowledgeEntries).values({
      id: entry.id,
      originalItemId: originalId.startsWith("item-") ? originalId : null,
      phase: entry.phase as PhaseId,
      type: entry.type as ContentType,
      title: entry.title,
      summary: entry.summary,
      source: entry.source,
    }).run();

    for (const tag of entry.tags) {
      db.insert(knowledgeEntryTags).values({ entryId: entry.id, tag }).run();
    }
  }

  const topicId = "topic-default";
  db.insert(coCreationTopics).values({
    id: topicId,
    title: initialCoCreation.topic,
    round: initialCoCreation.round,
    maxRounds: initialCoCreation.maxRounds,
    converged: initialCoCreation.converged,
    isActive: true,
  }).run();

  for (const idea of initialCoCreation.ideas) {
    db.insert(coCreationIdeas).values({
      id: `idea-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      topicId,
      content: idea,
    }).run();
  }

  console.log("[seed] Done.");
}
