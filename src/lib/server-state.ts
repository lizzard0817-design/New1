import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  categorizeIdeas,
  createLearningItem,
  generateConsensusReport,
  generatePersonalPlan,
  initialCoCreation,
  initialItems,
  initialKnowledgeBase,
  mergeNewIdeas,
  participantCount,
  shouldEnterKnowledgeBase,
  toKnowledgeEntry,
  type CoCreationState,
  type ContentType,
  type KnowledgeEntry,
  type LearningItem,
  type PersonalPlan,
  type PhaseId,
  type UploadedAsset
} from "@/lib/agents";

export type SharedState = {
  items: LearningItem[];
  knowledgeBase: KnowledgeEntry[];
  coCreation: CoCreationState;
  plansByStudent: Record<string, PersonalPlan>;
};

const dataRoot = process.env.WUHUA_DATA_DIR || path.join(process.cwd(), ".wuhuan-data");
const stateFile = path.join(dataRoot, "state.json");

export async function readSharedState(): Promise<SharedState> {
  await mkdir(dataRoot, { recursive: true });
  try {
    const raw = await readFile(stateFile, "utf8");
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? error.code : "";
    if (code !== "ENOENT") throw error;
    const seeded = seedSharedState();
    await writeSharedState(seeded);
    return seeded;
  }
}

export async function writeSharedState(state: SharedState) {
  await mkdir(dataRoot, { recursive: true });
  await writeFile(stateFile, JSON.stringify(normalizeState(state), null, 2), "utf8");
}

export async function addSharedItem(input: {
  phase: PhaseId;
  type: ContentType;
  title: string;
  body: string;
  author: string;
  attachments?: UploadedAsset[];
  aiReview?: Partial<Pick<LearningItem, "quality" | "tags" | "aiSummary" | "reviewSource">>;
}) {
  const state = await readSharedState();
  const item = createLearningItem(input);
  const merged: LearningItem = {
    ...item,
    quality: input.aiReview?.quality || item.quality,
    tags: input.aiReview?.tags?.length ? input.aiReview.tags : item.tags,
    aiSummary: input.aiReview?.aiSummary,
    attachments: input.attachments || [],
    reviewSource: input.aiReview?.reviewSource || item.reviewSource
  };
  state.items = [merged, ...state.items];

  if (input.phase === "transformation") {
    const plan = state.plansByStudent[input.author];
    if (plan) {
      const today = new Date().toISOString().slice(0, 10);
      let updated = false;
      const checkpoints = plan.checkpoints.map((checkpoint) => {
        if (updated) return checkpoint;
        if (checkpoint.status !== "已评估" && (!checkpoint.date || checkpoint.date <= today)) {
          updated = true;
          return { ...checkpoint, status: "已评估" as const, evidenceItemId: merged.id };
        }
        return checkpoint;
      });
      if (updated) {
        state.plansByStudent = {
          ...state.plansByStudent,
          [input.author]: { ...plan, checkpoints }
        };
      }
    }
  }

  await writeSharedState(state);
  return { state, item: merged };
}

export async function likeSharedItem(itemId: string, voter?: string) {
  const state = await readSharedState();
  let updatedItem: LearningItem | null = null;
  state.items = state.items.map((item) => {
    if (item.id !== itemId) return item;
    const voters = new Set(item.voters || []);
    if (voter && voters.has(voter)) {
      updatedItem = item;
      return item;
    }
    if (voter) voters.add(voter);
    const updated: LearningItem = {
      ...item,
      likes: item.likes + 1,
      voters: Array.from(voters)
    };
    if (!updated.inKnowledgeBase && shouldEnterKnowledgeBase(updated)) {
      updated.inKnowledgeBase = true;
      state.knowledgeBase = [toKnowledgeEntry(updated), ...state.knowledgeBase];
    }
    updatedItem = updated;
    return updated;
  });
  await writeSharedState(state);
  return { state, item: updatedItem };
}

export async function submitSharedIdeas(ideas: string[]) {
  const state = await readSharedState();
  const accepted = mergeNewIdeas(state.coCreation.ideas, ideas);
  if (!accepted.length) {
    return { state, accepted };
  }
  const merged = [...state.coCreation.ideas, ...accepted];
  const votes = { ...state.coCreation.votes };
  for (const idea of accepted) {
    if (typeof votes[idea] !== "number") votes[idea] = 0;
  }
  state.coCreation = {
    ...state.coCreation,
    ideas: merged,
    categories: categorizeIdeas(merged),
    votes
  };
  await writeSharedState(state);
  return { state, accepted };
}

export async function voteSharedIdea(idea: string, voter?: string) {
  const state = await readSharedState();
  const voterMap = { ...(state.coCreation.voters || {}) };
  const voted = new Set(voterMap[idea] || []);
  if (voter && voted.has(voter)) {
    return { state, changed: false };
  }
  if (voter) {
    voted.add(voter);
    voterMap[idea] = Array.from(voted);
  }
  const votes = { ...state.coCreation.votes };
  votes[idea] = (votes[idea] || 0) + 1;
  state.coCreation = {
    ...state.coCreation,
    votes,
    voters: voterMap
  };
  await writeSharedState(state);
  return { state, changed: true };
}

export async function runSharedCoCreationRound(additionalIdeas: string[]) {
  const state = await readSharedState();
  const accepted = mergeNewIdeas(state.coCreation.ideas, additionalIdeas);
  const ideas = [...state.coCreation.ideas, ...accepted];
  const votes = { ...state.coCreation.votes };
  for (const idea of accepted) {
    if (typeof votes[idea] !== "number") votes[idea] = Math.max(1, participantCount - accepted.indexOf(idea) - 3);
  }
  const nextRound = state.coCreation.round + 1;
  const converged = accepted.length <= 3 || nextRound >= state.coCreation.maxRounds;
  const nextCoCreation: CoCreationState = {
    ...state.coCreation,
    round: nextRound,
    ideas,
    categories: categorizeIdeas(ideas),
    votes,
    converged,
    report: state.coCreation.report
  };
  if (converged) {
    nextCoCreation.report = generateConsensusReport(nextCoCreation);
  }
  state.coCreation = nextCoCreation;

  if (nextCoCreation.report && !state.knowledgeBase.some((entry) => entry.id === "kb-consensus-latest")) {
    state.knowledgeBase = [
      {
        id: "kb-consensus-latest",
        phase: "co-creation",
        type: "共识报告",
        title: `共创共识报告：${state.coCreation.topic}`,
        summary: nextCoCreation.report,
        source: "共创教练 Agent",
        tags: ["群体共创", "行动转化"],
        createdAt: new Date().toISOString().slice(0, 10)
      },
      ...state.knowledgeBase
    ];
  }

  await writeSharedState(state);
  return { state, accepted };
}

export async function setSharedPlan(student: string, plan: PersonalPlan) {
  const state = await readSharedState();
  state.plansByStudent = { ...state.plansByStudent, [student]: plan };
  await writeSharedState(state);
  return { state };
}

export async function generateSharedPlan(student: string) {
  const state = await readSharedState();
  const plan = generatePersonalPlan(state.knowledgeBase, student);
  state.plansByStudent = { ...state.plansByStudent, [student]: plan };
  await writeSharedState(state);
  return { state, plan };
}

export async function submitTransformationEvidence(input: {
  student: string;
  day: "D+30" | "D+90";
  itemId: string;
}) {
  const state = await readSharedState();
  const plan = state.plansByStudent[input.student];
  if (!plan) return { state };
  const checkpoints = plan.checkpoints.map((checkpoint) =>
    checkpoint.day === input.day
      ? { ...checkpoint, status: "已评估" as const, evidenceItemId: input.itemId }
      : checkpoint
  );
  state.plansByStudent = {
    ...state.plansByStudent,
    [input.student]: { ...plan, checkpoints }
  };
  await writeSharedState(state);
  return { state };
}

function seedSharedState(): SharedState {
  return {
    items: initialItems,
    knowledgeBase: initialKnowledgeBase,
    coCreation: initialCoCreation,
    plansByStudent: {}
  };
}

function normalizeState(raw: Partial<SharedState>): SharedState {
  const seeded = seedSharedState();
  const coCreation = raw.coCreation || seeded.coCreation;
  return {
    items: Array.isArray(raw.items) ? raw.items.map(normalizeItem) : seeded.items,
    knowledgeBase: Array.isArray(raw.knowledgeBase) ? raw.knowledgeBase : seeded.knowledgeBase,
    coCreation: {
      ...seeded.coCreation,
      ...coCreation,
      voters: coCreation.voters || {}
    },
    plansByStudent: raw.plansByStudent && typeof raw.plansByStudent === "object" ? raw.plansByStudent : {}
  };
}

function normalizeItem(item: LearningItem): LearningItem {
  return { ...item, voters: Array.isArray(item.voters) ? item.voters : [] };
}
