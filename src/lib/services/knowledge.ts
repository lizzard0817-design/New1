import { getDb } from "../db";
import { knowledgeEntries, knowledgeEntryTags } from "../db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import type { PhaseId, ContentType } from "../agents";

export type CreateKnowledgeEntryInput = {
  id: string;
  originalItemId: string | null;
  phase: PhaseId;
  type: ContentType;
  title: string;
  summary: string;
  source: string;
  tags: string[];
};

export function createKnowledgeEntry(input: CreateKnowledgeEntryInput) {
  const db = getDb();
  const existing = db.select({ id: knowledgeEntries.id }).from(knowledgeEntries).where(eq(knowledgeEntries.id, input.id)).get();
  if (existing) return getEntryById(input.id);

  db.insert(knowledgeEntries).values({
    id: input.id,
    originalItemId: input.originalItemId,
    phase: input.phase,
    type: input.type,
    title: input.title,
    summary: input.summary,
    source: input.source,
  }).run();

  for (const tag of input.tags) {
    db.insert(knowledgeEntryTags).values({ entryId: input.id, tag }).run();
  }

  return getEntryById(input.id);
}

export function getEntryById(id: string) {
  const db = getDb();
  const entry = db.select().from(knowledgeEntries).where(eq(knowledgeEntries.id, id)).get();
  if (!entry) return null;
  const tags = db.select({ tag: knowledgeEntryTags.tag }).from(knowledgeEntryTags).where(eq(knowledgeEntryTags.entryId, id)).all().map((r) => r.tag);
  return { ...entry, tags };
}

export function listKnowledgeEntries(params: {
  page?: number;
  pageSize?: number;
  phase?: PhaseId;
}) {
  const db = getDb();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (params.phase) conditions.push(eq(knowledgeEntries.phase, params.phase));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const total = db.select({ count: count() }).from(knowledgeEntries).where(where).get()!.count;
  const rows = db.select().from(knowledgeEntries).where(where).orderBy(desc(knowledgeEntries.createdAt)).limit(pageSize).offset(offset).all();

  const data = rows.map((entry) => {
    const tags = db.select({ tag: knowledgeEntryTags.tag }).from(knowledgeEntryTags).where(eq(knowledgeEntryTags.entryId, entry.id)).all().map((r) => r.tag);
    return { ...entry, tags };
  });

  return { data, total, page, pageSize };
}

export function updateEntryTags(entryId: string, tags: string[]) {
  const db = getDb();
  db.delete(knowledgeEntryTags).where(eq(knowledgeEntryTags.entryId, entryId)).run();
  for (const tag of tags) {
    db.insert(knowledgeEntryTags).values({ entryId, tag }).run();
  }
  return getEntryById(entryId);
}

export function getEntriesForStudent(submitterId: string, limit = 5) {
  const db = getDb();
  const entries = db.select().from(knowledgeEntries)
    .orderBy(desc(knowledgeEntries.createdAt))
    .limit(limit)
    .all();

  return entries.map((entry) => {
    const tags = db.select({ tag: knowledgeEntryTags.tag }).from(knowledgeEntryTags).where(eq(knowledgeEntryTags.entryId, entry.id)).all().map((r) => r.tag);
    return { ...entry, tags };
  });
}
