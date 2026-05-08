import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  createLearningItem,
  initialCoCreation,
  initialItems,
  initialKnowledgeBase,
  shouldEnterKnowledgeBase,
  toKnowledgeEntry,
  type CoCreationState,
  type ContentType,
  type KnowledgeEntry,
  type LearningItem,
  type PhaseId,
  type UploadedAsset
} from "@/lib/agents";

export type SharedState = {
  items: LearningItem[];
  knowledgeBase: KnowledgeEntry[];
  coCreation: CoCreationState;
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
  await writeSharedState(state);
  return { state, item: merged };
}

export async function likeSharedItem(itemId: string) {
  const state = await readSharedState();
  let updatedItem: LearningItem | null = null;
  state.items = state.items.map((item) => {
    if (item.id !== itemId) return item;
    const updated = { ...item, likes: item.likes + 1 };
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

function seedSharedState(): SharedState {
  return {
    items: initialItems,
    knowledgeBase: initialKnowledgeBase,
    coCreation: initialCoCreation
  };
}

function normalizeState(raw: Partial<SharedState>): SharedState {
  const seeded = seedSharedState();
  return {
    items: Array.isArray(raw.items) ? raw.items : seeded.items,
    knowledgeBase: Array.isArray(raw.knowledgeBase) ? raw.knowledgeBase : seeded.knowledgeBase,
    coCreation: raw.coCreation || seeded.coCreation
  };
}
