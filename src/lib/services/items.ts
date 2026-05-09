import { getDb } from "../db";
import { learningItems, learningItemTags, learningItemAttachments, learningItemVoters, users } from "../db/schema";
import { eq, and, desc, sql, like, or, count } from "drizzle-orm";
import type { PhaseId, ContentType, RoleId } from "../agents";
import { reviewLearningItem, likeThreshold, shouldEnterKnowledgeBase, toKnowledgeEntry } from "../agents";
import { structuralReview } from "../review/structural-check";
import { reviewWithMiniMax } from "../minimax";
import { getDecryptedModelConfig } from "./model-config";

export type CreateItemInput = {
  phase: PhaseId;
  type: ContentType;
  title: string;
  body: string;
  submitterId: string;
  submitterRole: RoleId;
  author: string;
  attachments?: { url: string; name: string; mimeType: string; size: number }[];
  useAiReview?: boolean;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

export async function createItem(input: CreateItemInput) {
  const db = getDb();

  let quality: "待补充" | "合规" | "优秀" = "待补充";
  let tags: string[] = [];
  let reviewSource: string | null = "local";
  let aiSummary: string | null = null;

  const structural = structuralReview({ title: input.title, body: input.body, phase: input.phase });
  quality = structural.quality;
  tags = structural.tags;

  if (input.useAiReview) {
    try {
      const modelConfig = await getDecryptedModelConfig(input.submitterId);
      if (modelConfig?.enabled) {
        const aiResult = await reviewWithMiniMax({
          phase: input.phase,
          title: input.title,
          body: input.body,
          modelConfig,
        });
        if (aiResult) {
          quality = aiResult.quality;
          tags = aiResult.tags.length > 0 ? aiResult.tags : tags;
          aiSummary = aiResult.aiSummary ?? null;
          reviewSource = "custom";
        }
      }
    } catch {
      reviewSource = "local-fallback";
    }
  }

  const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  db.insert(learningItems).values({
    id,
    phase: input.phase,
    type: input.type,
    title: input.title,
    body: input.body,
    submitterId: input.submitterId,
    submitterRole: input.submitterRole,
    author: input.author,
    likes: 0,
    threshold: likeThreshold,
    quality,
    reviewSource,
    aiSummary,
    createdAt: now,
    updatedAt: now,
  }).run();

  for (const tag of tags) {
    db.insert(learningItemTags).values({ itemId: id, tag }).run();
  }

  if (input.attachments?.length) {
    for (const att of input.attachments) {
      db.insert(learningItemAttachments).values({ itemId: id, ...att }).run();
    }
  }

  return getItemById(id);
}

export function getItemById(id: string) {
  const db = getDb();
  const item = db.select().from(learningItems).where(eq(learningItems.id, id)).get();
  if (!item) return null;

  const tags = db.select({ tag: learningItemTags.tag }).from(learningItemTags).where(eq(learningItemTags.itemId, id)).all().map((r) => r.tag);
  const attachments = db.select().from(learningItemAttachments).where(eq(learningItemAttachments.itemId, id)).all();
  const voters = db.select({ voterId: learningItemVoters.voterId }).from(learningItemVoters).where(eq(learningItemVoters.itemId, id)).all().map((r) => r.voterId);

  return { ...item, tags, attachments, voters };
}

export function listItems(params: {
  page?: number;
  pageSize?: number;
  phase?: PhaseId;
  submitterId?: string;
  isExcellent?: boolean;
  inKnowledgeBase?: boolean;
}) {
  const db = getDb();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (params.phase) conditions.push(eq(learningItems.phase, params.phase));
  if (params.submitterId) conditions.push(eq(learningItems.submitterId, params.submitterId));
  if (params.isExcellent !== undefined) conditions.push(eq(learningItems.isExcellent, params.isExcellent));
  if (params.inKnowledgeBase !== undefined) conditions.push(eq(learningItems.inKnowledgeBase, params.inKnowledgeBase));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const total = db.select({ count: count() }).from(learningItems).where(where).get()!.count;
  const rows = db.select().from(learningItems).where(where).orderBy(desc(learningItems.createdAt)).limit(pageSize).offset(offset).all();

  const data = rows.map((item) => {
    const tags = db.select({ tag: learningItemTags.tag }).from(learningItemTags).where(eq(learningItemTags.itemId, item.id)).all().map((r) => r.tag);
    const attachments = db.select().from(learningItemAttachments).where(eq(learningItemAttachments.itemId, item.id)).all();
    return { ...item, tags, attachments };
  });

  return { data, total, page, pageSize };
}

export function likeItem(itemId: string, voterId: string) {
  const db = getDb();

  const existing = db.select().from(learningItemVoters).where(and(eq(learningItemVoters.itemId, itemId), eq(learningItemVoters.voterId, voterId))).get();
  if (existing) return getItemById(itemId);

  db.insert(learningItemVoters).values({ itemId, voterId }).run();
  db.update(learningItems).set({ likes: sql`${learningItems.likes} + 1`, updatedAt: new Date().toISOString() }).where(eq(learningItems.id, itemId)).run();

  const item = getItemById(itemId);
  if (item && item.likes >= item.threshold && !item.isExcellent) {
    db.update(learningItems).set({ isExcellent: true, updatedAt: new Date().toISOString() }).where(eq(learningItems.id, itemId)).run();
  }

  return getItemById(itemId);
}

export async function enterKnowledgeBase(itemId: string) {
  const db = getDb();
  const item = getItemById(itemId);
  if (!item) return null;

  if (!item.isExcellent || item.quality === "待补充") return null;

  db.update(learningItems).set({ inKnowledgeBase: true, updatedAt: new Date().toISOString() }).where(eq(learningItems.id, itemId)).run();

  const entry = toKnowledgeEntry(item as never);
  const { createKnowledgeEntry } = await import("./knowledge");
  createKnowledgeEntry({
    id: entry.id,
    originalItemId: item.id,
    phase: entry.phase as PhaseId,
    type: entry.type as ContentType,
    title: entry.title,
    summary: entry.summary,
    source: entry.source,
    tags: entry.tags,
  });

  return getItemById(itemId);
}
