import { getDb } from "../db";
import { coCreationTopics, coCreationIdeas, coCreationVotes } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { categorizeIdeas, mergeNewIdeas, generateConsensusReport } from "../agents";
import { reviewWithMiniMax } from "../minimax";
import { getDecryptedModelConfig } from "./model-config";

export function listTopics() {
  const db = getDb();
  const topics = db.select().from(coCreationTopics).orderBy(desc(coCreationTopics.createdAt)).all();
  return topics;
}

export function getActiveTopic() {
  const db = getDb();
  return db.select().from(coCreationTopics).where(eq(coCreationTopics.isActive, true)).get();
}

export function createTopic(title: string, maxRounds = 3) {
  const db = getDb();
  const id = `topic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  db.update(coCreationTopics).set({ isActive: false }).run();
  db.insert(coCreationTopics).values({ id, title, maxRounds, isActive: true }).run();
  return db.select().from(coCreationTopics).where(eq(coCreationTopics.id, id)).get();
}

export function getTopicDetail(topicId: string) {
  const db = getDb();
  const topic = db.select().from(coCreationTopics).where(eq(coCreationTopics.id, topicId)).get();
  if (!topic) return null;

  const ideas = db.select().from(coCreationIdeas).where(eq(coCreationIdeas.topicId, topicId)).all();
  const ideaIds = ideas.map((i) => i.id);

  const votes: Record<string, number> = {};
  const voters: Record<string, string[]> = {};
  for (const ideaId of ideaIds) {
    const voteRows = db.select({ voterId: coCreationVotes.voterId }).from(coCreationVotes).where(eq(coCreationVotes.ideaId, ideaId)).all();
    votes[ideas.find((i) => i.id === ideaId)!.content] = voteRows.length;
    voters[ideas.find((i) => i.id === ideaId)!.content] = voteRows.map((v) => v.voterId);
  }

  const categories = categorizeIdeas(ideas.map((i) => i.content));

  return {
    ...topic,
    ideas: ideas.map((i) => i.content),
    categories,
    votes,
    voters,
  };
}

export function submitIdeas(topicId: string, ideas: string[], submitterId: string) {
  const db = getDb();
  const topic = db.select().from(coCreationTopics).where(eq(coCreationTopics.id, topicId)).get();
  if (!topic) return null;

  const existing = db.select({ content: coCreationIdeas.content }).from(coCreationIdeas).where(eq(coCreationIdeas.topicId, topicId)).all().map((r) => r.content);
  const accepted = mergeNewIdeas(existing, ideas);

  for (const idea of accepted) {
    const id = `idea-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    db.insert(coCreationIdeas).values({ id, topicId, content: idea, submitterId }).run();
  }

  return getTopicDetail(topicId);
}

export function voteIdea(topicId: string, ideaContent: string, voterId: string) {
  const db = getDb();
  const idea = db.select().from(coCreationIdeas).where(and(eq(coCreationIdeas.topicId, topicId), eq(coCreationIdeas.content, ideaContent))).get();
  if (!idea) return null;

  const existing = db.select().from(coCreationVotes).where(and(eq(coCreationVotes.ideaId, idea.id), eq(coCreationVotes.voterId, voterId))).get();
  if (existing) return getTopicDetail(topicId);

  db.insert(coCreationVotes).values({ ideaId: idea.id, voterId }).run();
  return getTopicDetail(topicId);
}

export async function runConvergenceRound(topicId: string, additionalIdeas: string[], userId?: string) {
  const db = getDb();
  const topic = db.select().from(coCreationTopics).where(eq(coCreationTopics.id, topicId)).get();
  if (!topic) return null;

  if (additionalIdeas.length > 0) {
    submitIdeas(topicId, additionalIdeas, userId || "system");
  }

  const allIdeas = db.select({ content: coCreationIdeas.content }).from(coCreationIdeas).where(eq(coCreationIdeas.topicId, topicId)).all().map((r) => r.content);
  const categories = categorizeIdeas(allIdeas);

  for (const [category, contents] of Object.entries(categories)) {
    for (const content of contents) {
      db.update(coCreationIdeas).set({ category }).where(and(eq(coCreationIdeas.topicId, topicId), eq(coCreationIdeas.content, content))).run();
    }
  }

  const nextRound = topic.round + 1;
  let converged = false;
  let report = "";

  if (additionalIdeas.length <= 3) {
    converged = true;
  }

  if (!converged && userId) {
    try {
      const modelConfig = await getDecryptedModelConfig(userId);
      if (modelConfig?.enabled && allIdeas.length > 3) {
        const lastFew = allIdeas.slice(-5);
        const checkPrompt = `判断以下新观点与已有观点的语义重复度。已有观点：${allIdeas.slice(0, -5).join("；")}。新观点：${lastFew.join("；")}。如果新观点中超过80%与已有观点含义重复，回答"重复"，否则回答"不重复"。只回答一个词。`;
        const result = await reviewWithMiniMax({
          phase: "co-creation",
          title: "语义收敛判断",
          body: checkPrompt,
          modelConfig,
        });
        if (result && result.aiSummary?.includes("重复")) {
          converged = true;
        }
      }
    } catch {
      // fallback to count-based
    }
  }

  if (converged || nextRound > topic.maxRounds) {
    const detail = getTopicDetail(topicId)!;
    report = generateConsensusReport({
      topic: topic.title,
      round: nextRound,
      maxRounds: topic.maxRounds,
      ideas: detail.ideas,
      categories: detail.categories,
      votes: detail.votes,
      voters: detail.voters,
      converged: true,
      report: "",
    });
  }

  db.update(coCreationTopics).set({
    round: nextRound,
    converged: converged || nextRound > topic.maxRounds,
    report,
    updatedAt: new Date().toISOString(),
  }).where(eq(coCreationTopics.id, topicId)).run();

  return getTopicDetail(topicId);
}
