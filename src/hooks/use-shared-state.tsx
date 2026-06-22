"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  coachModules,
  demoAccounts,
  initialCoCreation,
  initialItems,
  initialKnowledgeBase,
  submissionBlueprints,
  type CoCreationState,
  type KnowledgeEntry,
  type LearningItem,
  type ModelConfig,
  type PersonalPlan,
  type PhaseId,
  type UploadedAsset
} from "@/lib/agents";
import type { SharedState } from "@/lib/server-state";
import { useAuth } from "./use-auth";

const appBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
type PlansByStudent = Record<string, PersonalPlan>;

const defaultModelConfig: ModelConfig = {
  enabled: false,
  providerName: "MiniMax",
  baseUrl: "https://api.minimax.io/v1",
  model: "MiniMax-M2.7",
  apiKey: ""
};

type SharedStateContextValue = {
  items: LearningItem[];
  knowledgeBase: KnowledgeEntry[];
  coCreation: CoCreationState;
  plansByStudent: PlansByStudent;
  accounts: typeof demoAccounts;
  modelConfig: ModelConfig;
  selectedPlanStudent: string;
  activePhase: PhaseId;
  draft: { title: string; body: string };
  attachments: UploadedAsset[];
  setAttachments: (a: UploadedAsset[]) => void;
  ideaDraft: string;
  selectedCoCreationGroup: string;
  permissionNotice: string;
  setPermissionNotice: (v: string) => void;
  setModelConfig: (c: ModelConfig) => void;
  setSelectedPlanStudent: (s: string) => void;
  setActivePhase: (p: PhaseId) => void;
  setDraft: (d: { title: string; body: string }) => void;
  setIdeaDraft: (s: string) => void;
  setSelectedCoCreationGroup: (g: string) => void;
  apiHeaders: (includeContentType?: boolean) => Record<string, string>;
  refreshSharedState: () => Promise<SharedState | undefined>;
  applySharedState: (state: SharedState) => void;
  studentOptions: string[];
  plan: PersonalPlan | null;
  phaseStats: Array<(typeof coachModules)[number] & { entries: number; submissions: number }>;
  approvedCount: number;
  reportReady: boolean;
};

const SharedStateContext = createContext<SharedStateContextValue | null>(null);

export function SharedStateProvider({ children }: { children: ReactNode }) {
  const { currentAccount, currentRole } = useAuth();

  const [items, setItems] = useState<LearningItem[]>(initialItems);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeEntry[]>(initialKnowledgeBase);
  const [coCreation, setCoCreation] = useState<CoCreationState>(initialCoCreation);
  const [plansByStudent, setPlansByStudent] = useState<PlansByStudent>({});
  const [accounts, setAccounts] = useState<typeof demoAccounts>(demoAccounts);
  const [modelConfig, setModelConfigState] = useState<ModelConfig>(defaultModelConfig);
  const [selectedPlanStudent, setSelectedPlanStudent] = useState("李同学");
  const [activePhase, setActivePhase] = useState<PhaseId>("deep-study");
  const [draft, setDraft] = useState({ title: submissionBlueprints["deep-study"].defaultTitle, body: submissionBlueprints["deep-study"].defaultBody });
  const [attachments, setAttachments] = useState<UploadedAsset[]>([]);
  const [ideaDraft, setIdeaDraft] = useState(submissionBlueprints["co-creation"].defaultBody);
  const [selectedCoCreationGroup, setSelectedCoCreationGroup] = useState("第一小组");
  const [permissionNotice, setPermissionNotice] = useState("");

  // Load model config from localStorage
  useEffect(() => {
    const raw = window.localStorage.getItem("wuhuan-model-config");
    if (!raw) return;
    try {
      setModelConfigState({ ...defaultModelConfig, ...JSON.parse(raw) });
    } catch {
      window.localStorage.removeItem("wuhuan-model-config");
    }
  }, []);

  function setModelConfig(next: ModelConfig) {
    setModelConfigState(next);
    window.localStorage.setItem("wuhuan-model-config", JSON.stringify(next));
  }

  // Refresh shared state when account changes
  useEffect(() => {
    if (!currentAccount) return;
    setSelectedCoCreationGroup(currentAccount.groupName || "全班");
    refreshSharedState().catch(() => {
      setPermissionNotice("共享状态加载失败，当前显示本地演示数据。");
    });
  }, [currentAccount?.id]);

  async function refreshSharedState() {
    const headers: Record<string, string> = {};
    if (currentAccount) {
      headers["x-wuhuan-user-id"] = currentAccount.id;
      headers["x-wuhuan-user-name"] = encodeURIComponent(currentAccount.name);
      headers["x-wuhuan-role"] = currentAccount.role;
      headers["x-wuhuan-group"] = encodeURIComponent(currentAccount.groupName || "全班");
    }
    const response = await fetch(`${appBasePath}/api/state`, { headers });
    if (!response.ok) throw new Error("load failed");
    const state: SharedState = await response.json();
    setItems(state.items);
    setKnowledgeBase(state.knowledgeBase);
    setCoCreation(state.coCreation);
    setPlansByStudent(state.plansByStudent || {});
    if (state.accounts?.length) setAccounts(state.accounts);
    return state;
  }

  function applySharedState(state: SharedState) {
    setItems(state.items);
    setKnowledgeBase(state.knowledgeBase);
    setCoCreation(state.coCreation);
    setPlansByStudent(state.plansByStudent || {});
    if (state.accounts?.length) setAccounts(state.accounts);
  }

  function apiHeaders(includeContentType = true) {
    const headers: Record<string, string> = {};
    if (includeContentType) headers["Content-Type"] = "application/json";
    if (currentAccount) {
      headers["x-wuhuan-user-id"] = currentAccount.id;
      headers["x-wuhuan-user-name"] = encodeURIComponent(currentAccount.name);
      headers["x-wuhuan-role"] = currentAccount.role;
      headers["x-wuhuan-group"] = encodeURIComponent(currentAccount.groupName || "全班");
    }
    return headers;
  }

  const studentOptions = useMemo(() => {
    const names = new Set<string>();
    for (const a of accounts) {
      if (a.role === "student" && a.active !== false) names.add(a.name);
    }
    for (const item of items) {
      if (item.author) names.add(item.author);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  }, [accounts, items]);

  const planStudent = currentAccount?.role === "student" ? currentAccount?.name || selectedPlanStudent : selectedPlanStudent;
  const plan = planStudent ? plansByStudent[planStudent] || null : null;

  const phaseStats = useMemo(
    () =>
      coachModules.map((module) => ({
        ...module,
        entries: knowledgeBase.filter((item) => item.phase === module.id).length,
        submissions: items.filter((item) => item.phase === module.id).length
      })),
    [items, knowledgeBase]
  );

  const approvedCount = items.filter((item) => item.inKnowledgeBase).length;
  const reportReady = coCreation.report.length > 0;

  // Auto-update selectedPlanStudent when options change
  useEffect(() => {
    if (!studentOptions.length) return;
    if (!studentOptions.includes(selectedPlanStudent)) {
      setSelectedPlanStudent(studentOptions[0]);
    }
  }, [selectedPlanStudent, studentOptions]);

  const value = useMemo(
    () => ({
      items,
      setItems,
      knowledgeBase,
      setKnowledgeBase,
      coCreation,
      setCoCreation,
      plansByStudent,
      setPlansByStudent,
      accounts,
      setAccounts,
      modelConfig,
      permissionNotice,
      setPermissionNotice,
      setModelConfig,
      selectedPlanStudent,
      setSelectedPlanStudent,
      activePhase,
      setActivePhase,
      draft,
      setDraft,
      attachments,
      setAttachments,
      ideaDraft,
      setIdeaDraft,
      selectedCoCreationGroup,
      setSelectedCoCreationGroup,
      apiHeaders,
      refreshSharedState,
      applySharedState,
      studentOptions,
      plan,
      phaseStats,
      approvedCount,
      reportReady
    }),
    [
      items, knowledgeBase, coCreation, plansByStudent, accounts,
      modelConfig, permissionNotice, selectedPlanStudent, activePhase,
      draft, attachments, ideaDraft, selectedCoCreationGroup, studentOptions, plan,
      phaseStats, approvedCount, reportReady
    ]
  );

  return <SharedStateContext.Provider value={value}>{children}</SharedStateContext.Provider>;
}

export function useSharedState() {
  const ctx = useContext(SharedStateContext);
  if (!ctx) throw new Error("useSharedState must be used within SharedStateProvider");
  return ctx;
}
