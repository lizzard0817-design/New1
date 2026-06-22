import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  categorizeIdeas,
  createLearningItem,
  demoAccounts,
  generateConsensusReport,
  generatePersonalPlan,
  initialCoCreation,
  initialItems,
  initialKnowledgeBase,
  mergeNewIdeas,
  participantCount,
  shouldEnterExcellentPool,
  shouldEnterKnowledgeBase,
  toKnowledgeEntry,
  type CoCreationState,
  type ContentType,
  type DemoAccount,
  type KnowledgeEntry,
  type LearningItem,
  type PersonalPlan,
  type PhaseId,
  type RoleId,
  type UploadedAsset
} from "@/lib/agents";

export type SharedState = {
  items: LearningItem[];
  knowledgeBase: KnowledgeEntry[];
  coCreation: CoCreationState;
  plansByStudent: Record<string, PersonalPlan>;
  accounts: DemoAccount[];
};

const dataRoot = process.env.WUHUA_DATA_DIR || path.join(process.cwd(), ".wuhuan-data");
const stateFile = path.join(dataRoot, "state.json");
let mutationQueue: Promise<void> = Promise.resolve();

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

export async function listSharedItems(options: {
  page?: number;
  pageSize?: number;
  phase?: PhaseId | "all";
  author?: string;
} = {}) {
  const state = await readSharedState();
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(50, Math.max(1, options.pageSize || 10));
  const filtered = state.items.filter((item) => {
    if (options.phase && options.phase !== "all" && item.phase !== options.phase) return false;
    if (options.author && item.author !== options.author) return false;
    return true;
  });
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize
  };
}

export async function writeSharedState(state: SharedState) {
  await mkdir(dataRoot, { recursive: true });
  await writeFile(stateFile, JSON.stringify(normalizeState(state), null, 2), "utf8");
}

async function mutateSharedState<T>(mutation: (state: SharedState) => T | Promise<T>) {
  const previous = mutationQueue;
  let release!: () => void;
  mutationQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    const state = await readSharedState();
    const result = await mutation(state);
    await writeSharedState(state);
    return result;
  } finally {
    release();
  }
}

export async function addSharedItem(input: {
  phase: PhaseId;
  type: ContentType;
  title: string;
  body: string;
  author: string;
  submitterId?: string;
  submitterRole?: RoleId;
  attachments?: UploadedAsset[];
  aiReview?: Partial<Pick<LearningItem, "quality" | "tags" | "aiSummary" | "reviewSource">>;
}) {
  return mutateSharedState((state) => {
    const item = createLearningItem(input);
    const merged: LearningItem = {
      ...item,
      quality: input.aiReview?.quality || item.quality,
      tags: input.aiReview?.tags?.length ? input.aiReview.tags : item.tags,
      aiSummary: input.aiReview?.aiSummary || item.aiSummary,
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

    return { state, item: merged };
  });
}

export async function likeSharedItem(itemId: string, voter?: string) {
  return mutateSharedState((state) => {
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
        voters: Array.from(voters),
        updatedAt: new Date().toISOString()
      };
      if (!updated.isExcellent && shouldEnterExcellentPool(updated)) {
        updated.isExcellent = true;
      }
      if (!updated.inKnowledgeBase && shouldEnterKnowledgeBase(updated)) {
        updated.inKnowledgeBase = true;
        state.knowledgeBase = [toKnowledgeEntry(updated), ...state.knowledgeBase];
      }
      updatedItem = updated;
      return updated;
    });
    return { state, item: updatedItem };
  });
}

export async function submitSharedIdeas(ideas: string[], group = "全班") {
  return mutateSharedState((state) => {
    if (state.coCreation.converged) {
      return { state, accepted: [], hidden: ideas };
    }
    const { accepted, hidden } = mergeNewIdeas(state.coCreation.ideas, ideas);
    if (!accepted.length) {
      state.coCreation = {
        ...state.coCreation,
        hiddenIdeas: [...(state.coCreation.hiddenIdeas || []), ...hidden]
      };
      return { state, accepted, hidden };
    }
    const merged = [...state.coCreation.ideas, ...accepted];
    const votes = { ...state.coCreation.votes };
    const ideaGroups = { ...(state.coCreation.ideaGroups || {}) };
    for (const idea of accepted) {
      if (typeof votes[idea] !== "number") votes[idea] = 0;
      ideaGroups[idea] = group;
    }
    state.coCreation = {
      ...state.coCreation,
      ideas: merged,
      ideaGroups,
      hiddenIdeas: [...(state.coCreation.hiddenIdeas || []), ...hidden],
      categories: categorizeIdeas(merged),
      votes
    };
    return { state, accepted, hidden };
  });
}

export async function voteSharedIdea(idea: string, voter?: string, group = "全班") {
  return mutateSharedState((state) => {
    if (state.coCreation.converged) {
      return { state, changed: false, reason: "converged" as const };
    }
    if (!state.coCreation.ideas.includes(idea)) {
      return { state, changed: false, reason: "missing" as const };
    }
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
    const groupVotes = { ...(state.coCreation.groupVotes || {}) };
    groupVotes[idea] = { ...(groupVotes[idea] || {}), [group]: (groupVotes[idea]?.[group] || 0) + 1 };
    state.coCreation = {
      ...state.coCreation,
      votes,
      groupVotes,
      voters: voterMap
    };
    return { state, changed: true };
  });
}

export async function runSharedCoCreationRound(additionalIdeas: string[], group = "全班") {
  return mutateSharedState((state) => {
    if (state.coCreation.converged) {
      return { state, accepted: [], hidden: additionalIdeas, archived: null };
    }
    const { accepted, hidden } = mergeNewIdeas(state.coCreation.ideas, additionalIdeas);
    const ideas = [...state.coCreation.ideas, ...accepted];
    const votes = { ...state.coCreation.votes };
    const ideaGroups = { ...(state.coCreation.ideaGroups || {}) };
    for (const idea of accepted) {
      if (typeof votes[idea] !== "number") votes[idea] = Math.max(1, participantCount - accepted.indexOf(idea) - 3);
      ideaGroups[idea] = group;
    }
    const nextCoCreation: CoCreationState = {
      ...state.coCreation,
      round: 1,
      maxRounds: 1,
      ideas,
      ideaGroups,
      hiddenIdeas: [...(state.coCreation.hiddenIdeas || []), ...hidden],
      categories: categorizeIdeas(ideas),
      votes,
      converged: true,
      report: state.coCreation.report
    };
    nextCoCreation.report = generateConsensusReport(nextCoCreation);
    const archive = {
      id: `topic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      topic: nextCoCreation.topic,
      createdAt: new Date().toISOString(),
      ideas,
      hiddenIdeas: nextCoCreation.hiddenIdeas || [],
      categories: nextCoCreation.categories,
      votes,
      groupVotes: nextCoCreation.groupVotes || {},
      report: nextCoCreation.report
    };
    nextCoCreation.archives = [archive, ...(state.coCreation.archives || [])];
    state.coCreation = nextCoCreation;

    const consensusId = `kb-consensus-${state.coCreation.topic.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g, "").slice(0, 24) || "latest"}`;
    if (nextCoCreation.report && !state.knowledgeBase.some((entry) => entry.id === consensusId)) {
      state.knowledgeBase = [
        {
          id: consensusId,
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

    return { state, accepted, hidden, archived: archive };
  });
}

export async function setSharedPlan(student: string, plan: PersonalPlan) {
  return mutateSharedState((state) => {
    state.plansByStudent = { ...state.plansByStudent, [student]: plan };
    return { state };
  });
}

export async function generateSharedPlan(student: string) {
  return mutateSharedState((state) => {
    const studentHistory = state.items.filter((item) => item.author === student);
    const plan = generatePersonalPlan(state.knowledgeBase, student, studentHistory);
    state.plansByStudent = { ...state.plansByStudent, [student]: plan };
    return { state, plan };
  });
}

export async function confirmSharedPlan(student: string) {
  return mutateSharedState((state) => {
    const plan = state.plansByStudent[student];
    if (!plan) return { state, plan: null };
    const updated: PersonalPlan = {
      ...plan,
      status: "已确认",
      confirmedAt: new Date().toISOString().slice(0, 10)
    };
    state.plansByStudent = { ...state.plansByStudent, [student]: updated };
    return { state, plan: updated };
  });
}

export async function updateCoCreationTopic(topic: string) {
  return mutateSharedState((state) => {
    const groups = state.coCreation.groups?.length ? state.coCreation.groups : initialCoCreation.groups;
    const archives = state.coCreation.archives || [];
    state.coCreation = {
      ...initialCoCreation,
      topic,
      round: 1,
      maxRounds: 1,
      groups,
      ideas: [],
      ideaGroups: {},
      hiddenIdeas: [],
      categories: {},
      votes: {},
      groupVotes: {},
      voters: {},
      converged: false,
      report: "",
      archives
    };
    return { state };
  });
}

export async function submitTransformationEvidence(input: {
  student: string;
  day: "D+30" | "D+90";
  itemId: string;
}) {
  return mutateSharedState((state) => {
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
    return { state };
  });
}

export async function upsertSharedAccount(input: Partial<DemoAccount> & { id?: string }) {
  return mutateSharedState((state) => {
    const nowId = input.id || `account-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const existing = state.accounts.find((account) => account.id === nowId);
    const next: DemoAccount = {
      id: nowId,
      username: String(input.username || existing?.username || "").trim(),
      password: String(input.password || existing?.password || "student123"),
      name: String(input.name || existing?.name || "新学员").trim(),
      role: input.role || existing?.role || "student",
      className: String(input.className || existing?.className || "青年教师研修一班").trim(),
      groupName: String(input.groupName || existing?.groupName || "第一小组").trim(),
      title: String(input.title || existing?.title || "参训学员").trim(),
      active: input.active ?? existing?.active ?? true
    };
    state.accounts = existing
      ? state.accounts.map((account) => (account.id === nowId ? next : account))
      : [next, ...state.accounts];
    if (next.groupName && !state.coCreation.groups.includes(next.groupName) && next.role === "student") {
      state.coCreation = {
        ...state.coCreation,
        groups: [...state.coCreation.groups, next.groupName]
      };
    }
    return { state, account: next };
  });
}

export async function updateSharedKnowledgeEntry(id: string, patch: Partial<KnowledgeEntry>) {
  return mutateSharedState((state) => {
    let updated: KnowledgeEntry | null = null;
    state.knowledgeBase = state.knowledgeBase.map((entry) => {
      if (entry.id !== id) return entry;
      updated = {
        ...entry,
        title: typeof patch.title === "string" ? patch.title.trim() : entry.title,
        summary: typeof patch.summary === "string" ? patch.summary.trim() : entry.summary,
        source: typeof patch.source === "string" ? patch.source.trim() : entry.source,
        tags: Array.isArray(patch.tags) ? patch.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 8) : entry.tags,
        status: patch.status === "hidden" ? "hidden" : patch.status === "active" ? "active" : entry.status || "active"
      };
      return updated;
    });
    return { state, entry: updated };
  });
}

export async function deleteSharedKnowledgeEntry(id: string) {
  return mutateSharedState((state) => {
    const before = state.knowledgeBase.length;
    state.knowledgeBase = state.knowledgeBase.filter((entry) => entry.id !== id);
    return { state, deleted: state.knowledgeBase.length !== before };
  });
}

function seedSharedState(): SharedState {
  return {
    items: initialItems,
    knowledgeBase: initialKnowledgeBase,
    coCreation: initialCoCreation,
    plansByStudent: {},
    accounts: demoAccounts
  };
}

function normalizeState(raw: Partial<SharedState>): SharedState {
  const seeded = seedSharedState();
  const coCreation = raw.coCreation || seeded.coCreation;
  const plansByStudent =
    raw.plansByStudent && typeof raw.plansByStudent === "object"
      ? Object.fromEntries(Object.entries(raw.plansByStudent).map(([student, plan]) => [student, normalizePlan(plan)]))
      : {};
  const accounts = Array.isArray(raw.accounts) ? raw.accounts.map(normalizeAccount) : seeded.accounts;
  return {
    items: Array.isArray(raw.items) ? raw.items.map(normalizeItem) : seeded.items,
    knowledgeBase: Array.isArray(raw.knowledgeBase)
      ? raw.knowledgeBase.map((entry) => ({
          ...entry,
          originalItemId: entry.originalItemId || (entry.id.startsWith("kb-") ? entry.id.slice(3) : undefined),
          status: entry.status || "active"
        }))
      : seeded.knowledgeBase,
    coCreation: {
      ...seeded.coCreation,
      ...coCreation,
      groups: Array.isArray(coCreation.groups) && coCreation.groups.length ? coCreation.groups : seeded.coCreation.groups,
      ideaGroups: coCreation.ideaGroups || {},
      hiddenIdeas: coCreation.hiddenIdeas || [],
      groupVotes: coCreation.groupVotes || {},
      voters: coCreation.voters || {},
      archives: coCreation.archives || []
    },
    plansByStudent,
    accounts
  };
}

function normalizeAccount(account: DemoAccount): DemoAccount {
  return {
    ...account,
    groupName: account.groupName || "第一小组",
    active: account.active !== false
  };
}

function normalizeItem(item: LearningItem): LearningItem {
  const createdAt = item.createdAt || new Date().toISOString();
  return {
    ...item,
    createdAt,
    updatedAt: item.updatedAt || createdAt,
    isExcellent: Boolean(item.isExcellent || item.inKnowledgeBase),
    voters: Array.isArray(item.voters) ? item.voters : []
  };
}

function normalizePlan(plan: PersonalPlan): PersonalPlan {
  const today = new Date().toISOString().slice(0, 10);
  return {
    ...plan,
    status: plan.status || "待确认",
    checkpoints: plan.checkpoints.map((checkpoint) => {
      if (checkpoint.status === "待提醒" && checkpoint.date && checkpoint.date <= today) {
        return { ...checkpoint, status: "待提交" as const };
      }
      return checkpoint;
    })
  };
}
