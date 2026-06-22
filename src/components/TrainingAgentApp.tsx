"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  EyeOff,
  FileText,
  FlaskConical,
  Gauge,
  ImagePlus,
  Layers3,
  Lock,
  LogIn,
  LogOut,
  MessageSquareWarning,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  TimerReset,
  TrendingUp,
  UserRound,
  Users,
  Vote,
  X
} from "lucide-react";
import {
  can,
  coachModules,
  deliveryFlows,
  demoAccounts,
  initialCoCreation,
  initialItems,
  initialKnowledgeBase,
  likeThreshold,
  navItems,
  participantCount,
  permissionLabels,
  roleProfiles,
  supervisorFunctions,
  viewPermission,
  type CoCreationState,
  type ContentType,
  type DemoAccount,
  type DeliveryStep,
  type KnowledgeEntry,
  type LearningItem,
  type ModelConfig,
  type PermissionKey,
  type PhaseId,
  type PersonalPlan,
  type UploadedAsset,
  type ViewId
} from "@/lib/agents";
import type { SharedState } from "@/lib/server-state";

const typeByPhase: Record<PhaseId, ContentType> = {
  "deep-study": "批注",
  practice: "即时贴",
  reflection: "反思案例",
  "co-creation": "观点",
  transformation: "转化案例"
};

const deliveryByPhase: Record<PhaseId, { receiver: string; next: string; evidence: string }> = {
  "deep-study": {
    receiver: "班主任与同学",
    next: "点赞达标后进入优秀批注池和深学知识库。",
    evidence: "课程理解、关键发现、迁移想法"
  },
  practice: {
    receiver: "班主任与跟练教练",
    next: "点赞达标后进入优秀即时贴池和跟练知识库。",
    evidence: "现场照片、操作说明、技能要点"
  },
  reflection: {
    receiver: "班主任与反思教练",
    next: "完整合规后进入反思案例池和反思知识库。",
    evidence: "GROW 问答、问题分析、下一步行动"
  },
  "co-creation": {
    receiver: "共创教练与全班学员",
    next: "收敛投票后生成《共识报告》并进入共创知识库。",
    evidence: "观点、分类、投票结果"
  },
  transformation: {
    receiver: "转化教练与总知识库",
    next: "评估合格后进入转化知识库，供下一期培训引用。",
    evidence: "行动计划、成果物、转化案例"
  }
};

const submissionBlueprints: Record<
  PhaseId,
  {
    titleLabel: string;
    bodyLabel: string;
    titlePlaceholder: string;
    bodyPlaceholder: string;
    defaultTitle: string;
    defaultBody: string;
    submitLabel: string;
    outputHint: string;
    templateSections: Array<{ label: string; detail: string }>;
    qualityChecks: string[];
  }
> = {
  "deep-study": {
    titleLabel: "批注标题",
    bodyLabel: "学习批注",
    titlePlaceholder: "例如：课堂提问链观察",
    bodyPlaceholder: "按“我看到什么、我理解什么、我准备怎么迁移”来写。",
    defaultTitle: "课堂提问链观察",
    defaultBody: "我看到：学生在小组讨论中容易等待少数同学给答案。\n我理解：问题链如果只停留在事实层，学生很难说明理由。\n我迁移：下一次课堂先设计事实性问题，再追问理由，并让每个小组成员承担记录、汇报或质询角色。",
    submitLabel: "提交学习批注",
    outputHint: "系统会判断是否具体、有效、可迁移。",
    templateSections: [
      { label: "看到什么", detail: "记录课程中一个具体观点、方法或课堂现象。" },
      { label: "为什么重要", detail: "说明它对教学、学习或班级管理的价值。" },
      { label: "如何迁移", detail: "写出下一次准备怎么试用或调整。" }
    ],
    qualityChecks: ["有具体观察", "有个人理解", "有迁移动作"]
  },
  practice: {
    titleLabel: "即时贴标题",
    bodyLabel: "照片说明与技能要点",
    titlePlaceholder: "例如：小组角色分工跟练记录",
    bodyPlaceholder: "按“照片内容、现场发现、操作经验、下次复用”来写。",
    defaultTitle: "小组角色分工跟练记录",
    defaultBody: "照片内容：第三组讨论时只有组长发言，其他成员沉默。\n现场发现：任务卡没有分配角色，学生不知道自己负责什么。\n操作经验：加入记录员、汇报员、质询员三类角色后，讨论更容易形成分工。\n下次复用：我会在任务卡上直接写清每个角色的产出要求。",
    submitLabel: "提交即时贴",
    outputHint: "后续可接入真实图片上传；当前先提交照片说明和技能证据。",
    templateSections: [
      { label: "照片内容", detail: "说明照片记录的实训场景或关键动作。" },
      { label: "现场发现", detail: "写清问题、变化或技能要点。" },
      { label: "复用方法", detail: "说明下次如何沿用这次跟练经验。" }
    ],
    qualityChecks: ["能还原现场", "有操作动作", "可复用"]
  },
  reflection: {
    titleLabel: "反思案例标题",
    bodyLabel: "GROW 反思案例",
    titlePlaceholder: "例如：学生讨论参与不均衡",
    bodyPlaceholder: "按 Goal、Reality、Options、Will 四段写完整。",
    defaultTitle: "学生讨论参与不均衡",
    defaultBody: "Goal 目标：让每个小组成员都能参与讨论。\nReality 现状：发言集中在少数学生身上，部分学生等待组长给答案。\nOptions 选择：角色分工、发言计时、同伴追问、任务卡明确产出。\nWill 行动：下一节课在任务卡中明确记录员、汇报员、质询员的产出，并观察参与变化。",
    submitLabel: "提交反思案例",
    outputHint: "系统会检查目标、现状、选择和行动是否完整。",
    templateSections: [
      { label: "Goal", detail: "你希望改变什么具体教学问题。" },
      { label: "Reality", detail: "当前真实情况是什么，有什么证据。" },
      { label: "Options / Will", detail: "有哪些选择，最终下一步怎么做。" }
    ],
    qualityChecks: ["目标清晰", "现状有证据", "行动可执行"]
  },
  "co-creation": {
    titleLabel: "观点主题",
    bodyLabel: "共创观点",
    titlePlaceholder: "例如：训后转化支持机制",
    bodyPlaceholder: "每行一条观点，建议写成：建议 + 理由 + 落地条件。",
    defaultTitle: "训后转化支持机制",
    defaultBody: "建立转化案例模板：让学员按统一结构提交成果，便于教师评估和下一期复用。\n设置训后 3 个月成果复盘：避免培训结束后无人跟进。\n增加同伴互评反馈：让同组学员互相补充落地建议。",
    submitLabel: "提交共创观点",
    outputHint: "系统会去重、分类，并等待班主任运行收敛。",
    templateSections: [
      { label: "建议", detail: "提出一个可执行的改进动作。" },
      { label: "理由", detail: "说明为什么它对班级或培训有价值。" },
      { label: "条件", detail: "说明落地需要谁配合、什么材料或节点。" }
    ],
    qualityChecks: ["一行一观点", "可执行", "有理由"]
  },
  transformation: {
    titleLabel: "成果标题",
    bodyLabel: "转化成果或案例",
    titlePlaceholder: "例如：D+30 提问链课堂应用",
    bodyPlaceholder: "按“应用场景、采取动作、结果证据、下一步改进”来写。",
    defaultTitle: "D+30 提问链课堂应用",
    defaultBody: "应用场景：项目导入课的小组讨论环节。\n采取动作：使用事实性问题、解释性问题、迁移性问题三段式提问链。\n结果证据：学生回答更愿意说明理由，小组汇报更聚焦。\n下一步改进：继续记录不同问题类型对学生参与度的影响。",
    submitLabel: "提交转化成果",
    outputHint: "系统会初评完成度、落地性和改进空间。",
    templateSections: [
      { label: "应用场景", detail: "在哪节课、哪个班级或哪个任务中使用。" },
      { label: "结果证据", detail: "用学生表现、作品、数据或观察证明已落地。" },
      { label: "改进计划", detail: "说明下一轮准备怎么优化。" }
    ],
    qualityChecks: ["有应用场景", "有结果证据", "有改进动作"]
  }
};

function defaultDraftForPhase(phase: PhaseId) {
  const blueprint = submissionBlueprints[phase];
  return {
    title: blueprint.defaultTitle,
    body: blueprint.defaultBody
  };
}

const toneClass = {
  teal: "text-teal-700 bg-teal-50 border-teal-200",
  coral: "text-[#bd5145] bg-[#fff0ee] border-[#f2c5bf]",
  violet: "text-[#6d5bd0] bg-[#f1edff] border-[#d9d1ff]",
  amber: "text-[#92620f] bg-[#fff4d8] border-[#eed38e]",
  rose: "text-[#a43f5a] bg-[#fde9ef] border-[#f2bdcd]"
};

const defaultModelConfig: ModelConfig = {
  enabled: false,
  providerName: "MiniMax",
  baseUrl: "https://api.minimax.io/v1",
  model: "MiniMax-M2.7",
  apiKey: ""
};

const appBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
type PlansByStudent = Record<string, PersonalPlan>;

async function readApiError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    if (typeof data?.error?.message === "string") return data.error.message;
    if (typeof data?.error === "string") return data.error;
  } catch {
    // Keep the original fallback when the response is not JSON.
  }
  return fallback;
}

function getDueCheckpoints(plan: PersonalPlan | null) {
  if (!plan) return [];
  const today = new Date().toISOString().slice(0, 10);
  return plan.checkpoints.filter((checkpoint) => checkpoint.status !== "已评估" && (!checkpoint.date || checkpoint.date <= today));
}

export function TrainingAgentApp() {
  const [view, setView] = useState<ViewId>("dashboard");
  const [currentAccount, setCurrentAccount] = useState<DemoAccount | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "teacher", password: "teacher123" });
  const [loginError, setLoginError] = useState("");
  const [modelConfig, setModelConfig] = useState<ModelConfig>(defaultModelConfig);
  const [permissionNotice, setPermissionNotice] = useState("");
  const [items, setItems] = useState<LearningItem[]>(initialItems);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeEntry[]>(initialKnowledgeBase);
  const [coCreation, setCoCreation] = useState<CoCreationState>(initialCoCreation);
  const [plansByStudent, setPlansByStudent] = useState<PlansByStudent>({});
  const [accounts, setAccounts] = useState<DemoAccount[]>(demoAccounts);
  const [selectedPlanStudent, setSelectedPlanStudent] = useState("李同学");
  const [activePhase, setActivePhase] = useState<PhaseId>("deep-study");
  const [draft, setDraft] = useState(defaultDraftForPhase("deep-study"));
  const [attachments, setAttachments] = useState<UploadedAsset[]>([]);
  const [ideaDraft, setIdeaDraft] = useState(submissionBlueprints["co-creation"].defaultBody);
  const [selectedCoCreationGroup, setSelectedCoCreationGroup] = useState("第一小组");

  const role = currentAccount?.role || "student";
  const currentModule = coachModules.find((item) => item.id === activePhase) || coachModules[0];
  const activeItems = items.filter((item) => item.phase === activePhase);
  const approvedCount = items.filter((item) => item.inKnowledgeBase).length;
  const reportReady = coCreation.report.length > 0;
  const currentRole = roleProfiles.find((item) => item.id === role) || roleProfiles[1];
  const visibleNavItems = navItems.filter((item) => has(viewPermission(item.id)));
  const studentOptions = useMemo(() => {
    const names = new Set<string>();
    for (const account of accounts) {
      if (account.role === "student" && account.active !== false) names.add(account.name);
    }
    for (const item of items) {
      if (item.author) names.add(item.author);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  }, [accounts, items]);
  const planStudent = role === "student" ? currentAccount?.name || selectedPlanStudent : selectedPlanStudent;
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

  useEffect(() => {
    const raw = window.localStorage.getItem("wuhuan-current-account");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as DemoAccount;
      if (parsed && parsed.id) {
        const known = demoAccounts.find((account) => account.id === parsed.id);
        setCurrentAccount({ ...(known || parsed), ...parsed, groupName: parsed.groupName || known?.groupName || "全班" });
      }
    } catch {
      window.localStorage.removeItem("wuhuan-current-account");
    }
  }, []);

  useEffect(() => {
    if (!currentAccount) return;
    setSelectedCoCreationGroup(currentAccount.groupName || "全班");
    refreshSharedState().catch(() => {
      setPermissionNotice("共享状态加载失败，当前显示本地演示数据。");
    });
  }, [currentAccount?.id]);

  async function refreshSharedState() {
    const response = await fetch(`${appBasePath}/api/state`, {
      headers: apiHeaders(false)
    });
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

  useEffect(() => {
    const raw = window.localStorage.getItem("wuhuan-model-config");
    if (!raw) return;
    try {
      setModelConfig({ ...defaultModelConfig, ...JSON.parse(raw) });
    } catch {
      window.localStorage.removeItem("wuhuan-model-config");
    }
  }, []);



  useEffect(() => {
    if (!studentOptions.length) return;
    if (!studentOptions.includes(selectedPlanStudent)) {
      setSelectedPlanStudent(studentOptions[0]);
    }
  }, [selectedPlanStudent, studentOptions]);

  function saveModelConfig(nextConfig: ModelConfig) {
    setModelConfig(nextConfig);
    window.localStorage.setItem("wuhuan-model-config", JSON.stringify(nextConfig));
    setPermissionNotice(nextConfig.enabled ? `模型配置已保存：${nextConfig.providerName} / ${nextConfig.model}` : "已关闭自定义模型，提交内容时使用服务器默认配置或本地审核。");
  }

  function has(permission: PermissionKey) {
    return can(role, permission);
  }

  function deny(permission: PermissionKey) {
    setPermissionNotice(`${currentRole.name}暂无“${permissionLabels[permission]}”权限。`);
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

  async function addItem(phaseOverride?: PhaseId) {
    if (!has("submitLearningContent")) {
      deny("submitLearningContent");
      return;
    }
    const phase = phaseOverride || activePhase;
    try {
      const response = await fetch(`${appBasePath}/api/items`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          phase,
          type: typeByPhase[phase],
          title: draft.title,
          body: draft.body,
          attachments,
          modelConfig
        })
      });
      if (!response.ok) {
        setPermissionNotice(await readApiError(response, "提交失败，请稍后重试。"));
        return;
      }
      const result: { state: SharedState; item: LearningItem } = await response.json();
      applySharedState(result.state);
      setAttachments([]);
      setPermissionNotice(
        result.item.reviewSource === "minimax"
          ? `已提交，MiniMax 已完成审核：${result.item.aiSummary || result.item.quality}`
          : result.item.reviewSource === "custom"
            ? `已提交，${modelConfig.providerName || "自定义模型"} 已完成审核：${result.item.aiSummary || result.item.quality}`
            : `已提交，当前使用本地规则完成审核：${result.item.aiSummary || result.item.quality}`
      );
    } catch {
      setPermissionNotice("网络异常，提交未完成。草稿和附件已保留。");
      return;
    }
  }

  async function uploadImage(file: File) {
    if (!has("submitLearningContent")) {
      deny("submitLearningContent");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(`${appBasePath}/api/uploads`, {
        method: "POST",
        headers: apiHeaders(false),
        body: formData
      });
      if (!response.ok) {
        setPermissionNotice(await readApiError(response, "图片上传失败。"));
        return;
      }
      const result = await response.json();
      setAttachments((current) => [...current, result.asset as UploadedAsset]);
      setPermissionNotice("图片已上传，将随本次提交一起进入内容池。");
    } catch {
      setPermissionNotice("图片上传网络异常，请稍后重试。");
      return;
    }
  }

  async function likeItem(itemId: string) {
    if (!has("likeContent")) {
      deny("likeContent");
      return;
    }
    try {
      const response = await fetch(`${appBasePath}/api/items/like`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ itemId })
      });
      if (!response.ok) {
        setPermissionNotice(await readApiError(response, "点赞失败，请稍后重试。"));
        return;
      }
      const result: { state: SharedState; item: LearningItem | null } = await response.json();
      applySharedState(result.state);
    } catch {
      setPermissionNotice("点赞网络异常，请稍后重试。");
      return;
    }
  }

  function openView(nextView: ViewId) {
    const permission = viewPermission(nextView);
    if (!has(permission)) {
      deny(permission);
      return;
    }
    setPermissionNotice("");
    setView(nextView);
    if (["deep-study", "practice", "reflection", "co-creation", "transformation"].includes(nextView)) {
      const nextPhase = nextView as PhaseId;
      setActivePhase(nextPhase);
      if (nextPhase === "co-creation") {
        setIdeaDraft(submissionBlueprints["co-creation"].defaultBody);
      } else {
        setDraft(defaultDraftForPhase(nextPhase));
      }
      setAttachments([]);
    }
  }

  function login(account?: DemoAccount) {
    const sourceAccounts = accounts.length ? accounts : demoAccounts;
    const matched = account || sourceAccounts.find((item) => item.username === loginForm.username.trim() && item.password === loginForm.password);
    if (!matched) {
      setLoginError("账号或密码不正确。可使用下方演示账号快速登录。");
      return;
    }
    if (matched.active === false) {
      setLoginError("该账号已被管理员停用。");
      return;
    }
    setCurrentAccount(matched);
    window.localStorage.setItem("wuhuan-current-account", JSON.stringify(matched));
    setLoginError("");
    setPermissionNotice("");
    setView("dashboard");
  }

  function logout() {
    setCurrentAccount(null);
    window.localStorage.removeItem("wuhuan-current-account");
    setPermissionNotice("");
    setView("dashboard");
  }

  async function runCoCreationRound() {
    if (!has("runCoCreation")) {
      deny("runCoCreation");
      return;
    }
    const incoming = ideaDraft.split("\n").map((value) => value.trim()).filter(Boolean);
    try {
      const response = await fetch(`${appBasePath}/api/co-creation/run`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ ideas: incoming, group: selectedCoCreationGroup })
      });
      if (!response.ok) {
        setPermissionNotice(await readApiError(response, "运行共创失败，请稍后重试。"));
        return;
      }
      const result: { state: SharedState; accepted: string[]; hidden?: string[] } = await response.json();
      applySharedState(result.state);
      setPermissionNotice(
        `当前主题已收敛归档，保留 ${result.accepted.length} 条新增有效观点${result.hidden?.length ? `，隐藏 ${result.hidden.length} 条无效/重复观点` : ""}。请更新新的共创主题。`
      );
    } catch {
      setPermissionNotice("运行共创时网络异常，请稍后重试。");
      return;
    }
  }

  async function submitCoCreationIdeas() {
    if (!has("submitCoCreationIdeas")) {
      deny("submitCoCreationIdeas");
      return;
    }
    const incoming = ideaDraft.split("\n").map((value) => value.trim()).filter(Boolean);
    if (!incoming.length) {
      setPermissionNotice("请先填写观点内容，每行一条。");
      return;
    }
    try {
      const response = await fetch(`${appBasePath}/api/co-creation/ideas`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ ideas: incoming, group: selectedCoCreationGroup })
      });
      if (!response.ok) {
        setPermissionNotice(await readApiError(response, "提交观点失败，请稍后重试。"));
        return;
      }
      const result: { state: SharedState; accepted: string[]; hidden?: string[] } = await response.json();
      applySharedState(result.state);
      setPermissionNotice(
        result.accepted.length
          ? `已提交 ${result.accepted.length} 条有效观点${result.hidden?.length ? `，隐藏 ${result.hidden.length} 条无效/重复观点` : ""}，等待班主任收敛当前主题。`
          : "没有发现新的有效观点，已隐藏无效或重复内容。"
      );
    } catch {
      setPermissionNotice("提交观点网络异常，请稍后重试。");
      return;
    }
  }

  async function voteForIdea(idea: string) {
    if (!has("likeContent")) {
      deny("likeContent");
      return;
    }
    try {
      const response = await fetch(`${appBasePath}/api/co-creation/vote`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ idea, group: selectedCoCreationGroup })
      });
      if (!response.ok) {
        setPermissionNotice(await readApiError(response, "投票失败，请稍后重试。"));
        return;
      }
      const result: { state: SharedState; changed: boolean; reason?: string } = await response.json();
      applySharedState(result.state);
      if (!result.changed) {
        setPermissionNotice(
          result.reason === "missing"
            ? "该观点已不存在，无法投票。"
            : result.reason === "converged"
              ? "当前主题已收敛归档，不能继续投票。"
              : "你已经为该观点投过票了。"
        );
      }
    } catch {
      setPermissionNotice("投票网络异常，请稍后重试。");
      return;
    }
  }

  async function createPlan(studentName?: string) {
    if (!has("generatePlan")) {
      deny("generatePlan");
      return;
    }
    const targetStudent = studentName || (role === "student" ? currentAccount?.name : selectedPlanStudent) || studentOptions[0];
    if (!targetStudent) {
      setPermissionNotice("请先选择要生成行动计划的学员。");
      return;
    }
    try {
      const response = await fetch(`${appBasePath}/api/plans/generate`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ student: targetStudent })
      });
      if (!response.ok) {
        setPermissionNotice(await readApiError(response, "生成方案失败，请稍后重试。"));
        return;
      }
      const result: { state: SharedState; plan: PersonalPlan } = await response.json();
      applySharedState(result.state);
      setSelectedPlanStudent(targetStudent);
      setActivePhase("transformation");
      setDraft(defaultDraftForPhase("transformation"));
      setView("transformation");
      setPermissionNotice(`已为 ${targetStudent} 生成《个人行动计划》，等待学员确认。`);
    } catch {
      setPermissionNotice("生成方案网络异常，请稍后重试。");
      return;
    }
  }

  async function confirmPlan(studentName?: string) {
    const targetStudent = studentName || planStudent;
    if (!targetStudent) return;
    try {
      const response = await fetch(`${appBasePath}/api/plans/confirm`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ student: targetStudent })
      });
      if (!response.ok) {
        setPermissionNotice(await readApiError(response, "确认方案失败，请稍后重试。"));
        return;
      }
      const result: { state: SharedState; plan: PersonalPlan } = await response.json();
      applySharedState(result.state);
      setPermissionNotice(`${result.plan.student} 已确认个人行动计划。`);
    } catch {
      setPermissionNotice("确认方案网络异常，请稍后重试。");
    }
  }

  async function updateCoCreationTopic(topic: string) {
    if (!has("runCoCreation")) {
      deny("runCoCreation");
      return;
    }
    try {
      const response = await fetch(`${appBasePath}/api/co-creation/topics`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ topic })
      });
      if (!response.ok) {
        setPermissionNotice(await readApiError(response, "更新共创主题失败。"));
        return;
      }
      const result: { state: SharedState } = await response.json();
      applySharedState(result.state);
      setIdeaDraft(submissionBlueprints["co-creation"].defaultBody);
      setPermissionNotice(`共创主题已更新为：${result.state.coCreation.topic}`);
    } catch {
      setPermissionNotice("更新共创主题网络异常，请稍后重试。");
    }
  }

  async function testModelConfig(nextConfig: ModelConfig) {
    const response = await fetch(`${appBasePath}/api/model/test`, {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({ modelConfig: nextConfig })
    });
    if (!response.ok) {
      throw new Error(await readApiError(response, "模型连接失败。"));
    }
    const result: { providerName: string; model: string; sampleQuality: string; sampleTags: string[] } = await response.json();
    return `${result.providerName} / ${result.model} 连接成功，样例审核为“${result.sampleQuality}”。`;
  }

  async function saveAccount(account: DemoAccount) {
    if (!has("managePermissions")) {
      deny("managePermissions");
      return;
    }
    try {
      const response = await fetch(`${appBasePath}/api/admin/accounts`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify(account)
      });
      if (!response.ok) {
        setPermissionNotice(await readApiError(response, "保存账号失败。"));
        return;
      }
      const result: { state: SharedState; account: DemoAccount } = await response.json();
      applySharedState(result.state);
      setPermissionNotice(`账号已保存：${result.account.name}`);
    } catch {
      setPermissionNotice("保存账号网络异常，请稍后重试。");
    }
  }

  async function updateKnowledgeEntry(id: string, patch: Partial<KnowledgeEntry>) {
    if (!has("managePermissions")) {
      deny("managePermissions");
      return;
    }
    try {
      const response = await fetch(`${appBasePath}/api/knowledge/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: apiHeaders(),
        body: JSON.stringify(patch)
      });
      if (!response.ok) {
        setPermissionNotice(await readApiError(response, "更新知识库失败。"));
        return;
      }
      const result: { state: SharedState; entry: KnowledgeEntry } = await response.json();
      applySharedState(result.state);
      setPermissionNotice(`知识库条目已更新：${result.entry.title}`);
    } catch {
      setPermissionNotice("更新知识库网络异常，请稍后重试。");
    }
  }

  async function deleteKnowledgeEntry(id: string) {
    if (!has("managePermissions")) {
      deny("managePermissions");
      return;
    }
    try {
      const response = await fetch(`${appBasePath}/api/knowledge/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: apiHeaders(false)
      });
      if (!response.ok) {
        setPermissionNotice(await readApiError(response, "删除知识库失败。"));
        return;
      }
      const result: { state: SharedState } = await response.json();
      applySharedState(result.state);
      setPermissionNotice("知识库条目已删除。");
    } catch {
      setPermissionNotice("删除知识库网络异常，请稍后重试。");
    }
  }

  if (!currentAccount) {
    return (
      <LoginScreen
        accounts={accounts}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        loginError={loginError}
        onLogin={() => login()}
        onQuickLogin={login}
      />
    );
  }

  return (
    <main className="min-h-screen">
      <div className="grid min-h-screen grid-cols-[260px_1fr] max-lg:grid-cols-1">
        <aside className="border-r border-[var(--line)] bg-white px-4 py-5 max-lg:border-b max-lg:border-r-0">
          <div className="mb-7 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--teal)] text-white">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-base font-bold">五环共创 Agent</p>
              <p className="text-xs text-[var(--muted)]">培训智能体控制台</p>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto lg:block">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const selected = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => openView(item.id)}
                  className={`mb-1 flex min-w-fit items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    selected ? "bg-[var(--surface-strong)] font-semibold text-[var(--teal)]" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] p-4 max-lg:hidden">
            <p className="text-xs font-semibold text-slate-500">入库规则</p>
            <p className="mt-2 text-2xl font-bold">{likeThreshold} 票</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">参训 {participantCount} 人，点赞超过 1/3 且内容合规后进入知识库。</p>
          </div>

          <RoleCard role={currentRole} account={currentAccount} />
        </aside>

        <section className="px-8 py-6 max-md:px-4">
          <header className="mb-6 flex items-center justify-between gap-4 max-md:block">
            <div>
              <h1 className="text-3xl font-bold tracking-normal">五环共创培训智能体</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                一个总教练统一入口，调度深学、跟练、反思、共创、转化五个专业教练，把过程数据沉淀为知识库，再反哺个性化方案。
              </p>
            </div>
            <div className="flex items-center gap-3 max-md:mt-4 max-md:block">
              <AccountBadge account={currentAccount} roleName={currentRole.name} onLogout={logout} />
              {role === "student" ? (
                <button
                  onClick={() => openView("transformation")}
                  className="mt-0 flex items-center gap-2 rounded-lg bg-[#b94a66] px-4 py-2.5 text-sm font-semibold text-white shadow-sm max-md:mt-0"
                >
                  <TimerReset size={16} />
                  查看我的行动计划
                </button>
              ) : (
                <PermissionButton permission="generatePlan" allowed={has("generatePlan")} onClick={() => openView("coach")} className="bg-[var(--teal)] text-white">
                  <Sparkles size={16} />
                  选择学员生成方案
                </PermissionButton>
              )}
            </div>
          </header>

          {permissionNotice && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-[#f2c5bf] bg-[#fff0ee] px-4 py-3 text-sm font-semibold text-[#bd5145]">
              <Lock size={16} />
              {permissionNotice}
            </div>
          )}

          {view === "dashboard" && (
            <Dashboard
              approvedCount={approvedCount}
              phaseStats={phaseStats}
              coCreation={coCreation}
              reportReady={reportReady}
              onOpen={openView}
              onCreatePlan={createPlan}
              canGeneratePlan={has("generatePlan")}
              role={currentRole}
              items={items}
              knowledgeBase={knowledgeBase}
              plan={plan}
              plansByStudent={plansByStudent}
              studentOptions={studentOptions}
              selectedPlanStudent={selectedPlanStudent}
              onSelectPlanStudent={setSelectedPlanStudent}
              account={currentAccount}
              accounts={accounts}
              onSaveAccount={saveAccount}
              onLike={likeItem}
              onConfirmPlan={confirmPlan}
            />
          )}
          {view === "coach" && (
            <SupervisorPanel
              knowledgeBase={knowledgeBase}
              plan={plan}
              plansByStudent={plansByStudent}
              studentOptions={studentOptions}
              selectedPlanStudent={selectedPlanStudent}
              onSelectPlanStudent={setSelectedPlanStudent}
              onCreatePlan={createPlan}
              canGeneratePlan={has("generatePlan")}
            />
          )}
          {["deep-study", "practice", "reflection"].includes(view) && (
            <WorkflowPanel
              module={coachModules.find((item) => item.id === view) || currentModule}
              activePhase={activePhase}
              activeItems={activeItems}
              draft={draft}
              setDraft={setDraft}
              attachments={attachments}
              setAttachments={setAttachments}
              onUploadImage={uploadImage}
              onSubmit={addItem}
              onLike={likeItem}
              canSubmit={has("submitLearningContent")}
              canLike={has("likeContent")}
            />
          )}
          {view === "co-creation" && (
            <CoCreationPanel
              coCreation={coCreation}
              ideaDraft={ideaDraft}
              setIdeaDraft={setIdeaDraft}
              onSubmitIdeas={submitCoCreationIdeas}
              onRun={runCoCreationRound}
              onVote={voteForIdea}
              onUpdateTopic={updateCoCreationTopic}
              canSubmitIdeas={has("submitCoCreationIdeas")}
              canRun={has("runCoCreation")}
              canVote={has("likeContent")}
              currentVoter={currentAccount?.id || currentAccount?.name || ""}
              currentGroup={currentAccount.groupName || "全班"}
              selectedGroup={selectedCoCreationGroup}
              onSelectGroup={setSelectedCoCreationGroup}
              role={currentRole}
            />
          )}
          {view === "transformation" && (
            <TransformationPanel
              plan={plan}
              draft={draft}
              setDraft={setDraft}
              attachments={attachments}
              setAttachments={setAttachments}
              onUploadImage={uploadImage}
              transformationItems={items.filter((item) => item.phase === "transformation")}
              onSubmit={() => addItem("transformation")}
              onLike={likeItem}
              onCreatePlan={createPlan}
              canSubmit={has("submitLearningContent")}
              canLike={has("likeContent")}
              canGeneratePlan={has("generatePlan")}
              role={currentRole}
              plansByStudent={plansByStudent}
              studentOptions={studentOptions}
              selectedPlanStudent={selectedPlanStudent}
              onSelectPlanStudent={setSelectedPlanStudent}
              onConfirmPlan={confirmPlan}
            />
          )}
          {view === "knowledge" && (
            <KnowledgePanel
              knowledgeBase={knowledgeBase}
              role={currentRole}
              onUpdate={updateKnowledgeEntry}
              onDelete={deleteKnowledgeEntry}
            />
          )}
          {view === "model-settings" && <ModelSettingsPanel config={modelConfig} onSave={saveModelConfig} onTest={testModelConfig} />}
        </section>
      </div>
    </main>
  );
}

function LoginScreen({
  accounts,
  loginForm,
  setLoginForm,
  loginError,
  onLogin,
  onQuickLogin
}: {
  accounts: DemoAccount[];
  loginForm: { username: string; password: string };
  setLoginForm: (value: { username: string; password: string }) => void;
  loginError: string;
  onLogin: () => void;
  onQuickLogin: (account: DemoAccount) => void;
}) {
  return (
    <main className="grid min-h-screen grid-cols-[0.95fr_1.05fr] bg-[var(--background)] max-lg:grid-cols-1">
      <section className="flex min-h-screen flex-col justify-between bg-white p-10 max-lg:min-h-fit max-md:p-5">
        <div>
          <div className="mb-10 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--teal)] text-white">
              <Sparkles size={21} />
            </div>
            <div>
              <p className="text-lg font-bold">五环共创 Agent</p>
              <p className="text-sm text-[var(--muted)]">账号登录与权限控制</p>
            </div>
          </div>
          <h1 className="max-w-xl text-4xl font-bold leading-tight max-md:text-3xl">用账号进入对应角色工作台</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
            系统根据登录账号绑定的角色加载不同页面、导航和操作权限。管理员、班主任、学员看到的是三套不同的工作入口。
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
          {accounts.filter((account) => account.active !== false).map((account) => {
            const profile = roleProfiles.find((item) => item.id === account.role);
            return (
              <button key={account.id} onClick={() => onQuickLogin(account)} className="rounded-lg border border-[var(--line)] p-4 text-left hover:border-[var(--teal)]">
                <p className="font-semibold">{profile?.name}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{account.name}</p>
                <p className="mt-3 rounded-md bg-[var(--surface-strong)] px-2 py-1 text-xs text-slate-600">{account.username} / {account.password}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid place-items-center p-10 max-md:p-5">
        <div className="w-full max-w-md rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-[var(--teal)]">
              <LogIn size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">登录入口</h2>
              <p className="text-sm text-[var(--muted)]">输入账号和密码进入系统</p>
            </div>
          </div>

          <label className="block text-sm font-semibold">
            账号
            <input
              value={loginForm.username}
              onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })}
              className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2 font-normal outline-none focus:border-[var(--teal)]"
            />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            密码
            <input
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === "Enter") onLogin();
              }}
              className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2 font-normal outline-none focus:border-[var(--teal)]"
            />
          </label>

          {loginError && <p className="mt-4 rounded-lg border border-[#f2c5bf] bg-[#fff0ee] px-3 py-2 text-sm font-semibold text-[#bd5145]">{loginError}</p>}

          <button onClick={onLogin} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--teal)] px-4 py-2.5 text-sm font-semibold text-white">
            <LogIn size={16} />
            登录
          </button>
        </div>
      </section>
    </main>
  );
}

function AccountBadge({ account, roleName, onLogout }: { account: DemoAccount; roleName: string; onLogout: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm max-md:mb-3">
      <UserRound size={16} className="text-[var(--teal)]" />
      <div className="leading-4">
        <p className="font-semibold">{account.name}</p>
        <p className="text-xs text-[var(--muted)]">{roleName} · {account.className} · {account.groupName || "全班"}</p>
      </div>
      <button onClick={onLogout} className="ml-2 rounded-md p-1 text-slate-500 hover:bg-slate-100" title="退出登录">
        <LogOut size={16} />
      </button>
    </div>
  );
}

function Dashboard({
  approvedCount,
  phaseStats,
  coCreation,
  reportReady,
  onOpen,
  onCreatePlan,
  canGeneratePlan,
  role,
  items,
  knowledgeBase,
  plan,
  plansByStudent,
  studentOptions,
  selectedPlanStudent,
  onSelectPlanStudent,
  account,
  accounts,
  onSaveAccount,
  onLike,
  onConfirmPlan
}: {
  approvedCount: number;
  phaseStats: Array<(typeof coachModules)[number] & { entries: number; submissions: number }>;
  coCreation: CoCreationState;
  reportReady: boolean;
  onOpen: (view: ViewId) => void;
  onCreatePlan: (studentName?: string) => void;
  canGeneratePlan: boolean;
  role: (typeof roleProfiles)[number];
  items: LearningItem[];
  knowledgeBase: KnowledgeEntry[];
  plan: PersonalPlan | null;
  plansByStudent: PlansByStudent;
  studentOptions: string[];
  selectedPlanStudent: string;
  onSelectPlanStudent: (student: string) => void;
  account: DemoAccount;
  accounts: DemoAccount[];
  onSaveAccount: (account: DemoAccount) => void;
  onLike: (id: string) => void;
  onConfirmPlan: (studentName?: string) => void;
}) {
  if (role.id === "admin") {
    return (
      <AdminDashboard
        role={role}
        approvedCount={approvedCount}
        phaseStats={phaseStats}
        items={items}
        knowledgeBase={knowledgeBase}
        coCreation={coCreation}
        plansByStudent={plansByStudent}
        onOpen={onOpen}
        accounts={accounts}
        onSaveAccount={onSaveAccount}
        onLike={onLike}
      />
    );
  }

  if (role.id === "student") {
    return (
      <StudentDashboard
        phaseStats={phaseStats}
        items={items}
        knowledgeBase={knowledgeBase}
        coCreation={coCreation}
        plan={plan}
        account={account}
        onOpen={onOpen}
        onConfirmPlan={onConfirmPlan}
      />
    );
  }

  return (
    <div className="space-y-6">
      <TeacherHero coCreation={coCreation} reportReady={reportReady} approvedCount={approvedCount} onOpen={onOpen} />

      <ClassSubmissionPanel items={items} onLike={onLike} canLike={role.allowed.includes("likeContent")} title="班级提交内容池" />

      <PlanTargetPanel
        plan={plan}
        plansByStudent={plansByStudent}
        studentOptions={studentOptions}
        selectedStudent={selectedPlanStudent}
        onSelectStudent={onSelectPlanStudent}
        onCreatePlan={onCreatePlan}
        canGeneratePlan={canGeneratePlan}
      />

      <DeliveryFlowPanel
        title="班主任交付闭环"
        description="从收集班级过程数据开始，到交付共识报告和个性化方案结束。每一步都明确产出物和接收方。"
        steps={deliveryFlows.teacher}
        statusLabels={[
          phaseStats.some((item) => item.submissions > 0) ? "进行中" : "待收集",
          approvedCount > 0 ? "已沉淀" : "待达标",
          reportReady ? "已交付" : "待收敛",
          plan ? "已生成" : "待生成"
        ]}
        onOpen={onOpen}
      />

      <section className="grid grid-cols-[1.15fr_0.85fr] gap-5 max-xl:grid-cols-1">
        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">总教练中枢</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">统一入口、统一知识库、统一方案交付。</p>
            </div>
            <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700">已入库 {approvedCount}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
            {supervisorFunctions.map((item) => (
              <div key={item.title} className="rounded-lg border border-[var(--line)] p-4">
                <p className="font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <h2 className="text-xl font-bold">共创收敛状态</h2>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Metric label="当前轮次" value={`${coCreation.round}/${coCreation.maxRounds}`} />
            <Metric label="观点数" value={String(coCreation.ideas.length)} />
            <Metric label="报告" value={reportReady ? "已生成" : "待收敛"} />
          </div>
          <button onClick={() => onOpen("co-creation")} className="mt-5 flex w-full items-center justify-between rounded-lg border border-[var(--line)] px-4 py-3 text-sm font-semibold hover:border-[var(--teal)]">
            查看共创工作流
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => onOpen("coach")}
            disabled={!canGeneratePlan}
            className={`mt-3 flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold ${
              canGeneratePlan ? "bg-[var(--teal)] text-white" : "bg-slate-100 text-slate-400"
            }`}
          >
            选择学员生成方案
            {canGeneratePlan ? <ArrowRight size={16} /> : <Lock size={16} />}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-5 gap-3 max-xl:grid-cols-3 max-md:grid-cols-1">
        {phaseStats.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.id}
              onClick={() => onOpen(module.id)}
              className="rounded-lg border border-[var(--line)] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--teal)]"
            >
              <div className={`mb-4 grid h-10 w-10 place-items-center rounded-lg border ${toneClass[module.tone]}`}>
                <Icon size={19} />
              </div>
              <p className="font-bold">{module.title}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{module.coach}</p>
              <div className="mt-4 flex justify-between text-sm">
                <span>提交 {module.submissions}</span>
                <span>入库 {module.entries}</span>
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
}

function AdminDashboard({
  role,
  approvedCount,
  phaseStats,
  items,
  knowledgeBase,
  coCreation,
  plansByStudent,
  onOpen,
  accounts,
  onSaveAccount,
  onLike
}: {
  role: (typeof roleProfiles)[number];
  approvedCount: number;
  phaseStats: Array<(typeof coachModules)[number] & { entries: number; submissions: number }>;
  items: LearningItem[];
  knowledgeBase: KnowledgeEntry[];
  coCreation: CoCreationState;
  plansByStudent: PlansByStudent;
  onOpen: (view: ViewId) => void;
  accounts: DemoAccount[];
  onSaveAccount: (account: DemoAccount) => void;
  onLike: (id: string) => void;
}) {
  const pendingItems = items.filter((item) => !item.inKnowledgeBase).length;
  const totalSubmissions = phaseStats.reduce((sum, item) => sum + item.submissions, 0);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-[0.9fr_1.1fr] gap-5 max-xl:grid-cols-1">
        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-teal-50 text-[var(--teal)]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--teal)]">管理员工作台</p>
              <h2 className="mt-2 text-2xl font-bold">系统治理与权限配置</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{role.description}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Metric label="总提交" value={String(totalSubmissions)} />
            <Metric label="已入库" value={String(approvedCount)} />
            <Metric label="待沉淀" value={String(pendingItems)} />
          </div>
        </div>
        <PermissionMatrix role={role} />
      </section>

      <DeliveryFlowPanel
        title="系统交付治理链路"
        description="管理员看到的是可运营、可审计、可复用的交付链路，重点是让角色、数据、知识库和模型能力都处于可控状态。"
        steps={deliveryFlows.admin}
        statusLabels={[
          accounts.length ? "已配置" : "待配置",
          totalSubmissions > 0 ? "运行中" : "待运行",
          knowledgeBase.length > 0 ? "有资产" : "待沉淀",
          "可维护"
        ]}
        onOpen={onOpen}
      />

      <AdminDataBoard
        items={items}
        knowledgeBase={knowledgeBase}
        coCreation={coCreation}
        plansByStudent={plansByStudent}
        accounts={accounts}
        phaseStats={phaseStats}
        onOpen={onOpen}
      />

      <ClassSubmissionPanel items={items} onLike={onLike} canLike={role.allowed.includes("likeContent")} title="全班学员提交审阅" />

      <section className="grid grid-cols-[1fr_0.8fr] gap-5 max-xl:grid-cols-1">
        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold">智能体模块运行监控</h3>
            <button onClick={() => onOpen("knowledge")} className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-semibold hover:border-[var(--teal)]">
              查看知识库
            </button>
          </div>
          <div className="grid grid-cols-5 gap-3 max-xl:grid-cols-3 max-md:grid-cols-1">
            {phaseStats.map((module) => {
              const Icon = module.icon;
              const rate = module.submissions ? Math.round((module.entries / module.submissions) * 100) : 0;
              return (
                <div key={module.id} className="rounded-lg border border-[var(--line)] p-4">
                  <div className={`grid h-9 w-9 place-items-center rounded-lg border ${toneClass[module.tone]}`}>
                    <Icon size={18} />
                  </div>
                  <p className="mt-3 font-bold">{module.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">入库率 {rate}%</p>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-[var(--teal)]" style={{ width: `${Math.min(rate, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <AccountManagementPanel accounts={accounts} onSaveAccount={onSaveAccount} />
      </section>

      <section className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
        <Metric label="知识库条目" value={String(knowledgeBase.length)} />
        <Metric label="归档主题" value={String(coCreation.archives?.length || 0)} />
        <Metric label="当前主题" value={coCreation.converged ? "待更新" : "收集中"} />
      </section>
    </div>
  );
}

function AdminDataBoard({
  items,
  knowledgeBase,
  coCreation,
  plansByStudent,
  accounts,
  phaseStats,
  onOpen
}: {
  items: LearningItem[];
  knowledgeBase: KnowledgeEntry[];
  coCreation: CoCreationState;
  plansByStudent: PlansByStudent;
  accounts: DemoAccount[];
  phaseStats: Array<(typeof coachModules)[number] & { entries: number; submissions: number }>;
  onOpen: (view: ViewId) => void;
}) {
  const activeStudents = accounts.filter((account) => account.role === "student" && account.active !== false);
  const accountByName = new Map(activeStudents.map((account) => [account.name, account]));
  const submittedNames = new Set(items.map((item) => item.author));
  const submittedStudentCount = activeStudents.filter((student) => submittedNames.has(student.name)).length;
  const missingStudents = activeStudents.filter((student) => !submittedNames.has(student.name));
  const lowQualityItems = items.filter((item) => item.quality === "待补充");
  const compliantItems = items.filter((item) => item.quality === "合规");
  const excellentItems = items.filter((item) => item.quality === "优秀" || item.isExcellent);
  const zeroLikeItems = items.filter((item) => item.likes === 0);
  const totalLikes = items.reduce((sum, item) => sum + item.likes, 0);
  const knowledgeLinkedCount = items.filter((item) => item.inKnowledgeBase).length;
  const reviewedCount = items.filter((item) => Boolean(item.quality)).length;
  const externalReviewedCount = items.filter((item) => item.reviewSource === "minimax" || item.reviewSource === "custom").length;
  const planValues = Object.values(plansByStudent);
  const confirmedPlans = planValues.filter((plan) => plan.status === "已确认");
  const pendingPlans = planValues.filter((plan) => plan.status === "待确认");
  const checkpointRows = planValues.flatMap((plan) => plan.checkpoints.map((checkpoint) => ({ plan, checkpoint })));
  const dueCheckpoints = checkpointRows.filter(({ checkpoint }) => checkpoint.status !== "已评估" && isDueDate(checkpoint.date));
  const hiddenIdeaCount = (coCreation.hiddenIdeas?.length || 0) + (coCreation.archives || []).reduce((sum, archive) => sum + (archive.hiddenIdeas?.length || 0), 0);
  const reportCount = (coCreation.archives?.length || 0) + (coCreation.report ? 1 : 0);
  const visibleIdeaCount = coCreation.ideas.length;
  const averageLikes = items.length ? (totalLikes / items.length).toFixed(1) : "0";
  const healthScore = Math.round(
    getRatio(submittedStudentCount, activeStudents.length) * 32 +
      getRatio(items.length - lowQualityItems.length, items.length || 1) * 24 +
      getRatio(items.length - zeroLikeItems.length, items.length || 1) * 16 +
      getRatio(knowledgeLinkedCount, items.length || 1) * 16 +
      (planValues.length ? getRatio(confirmedPlans.length, planValues.length) : 1) * 12
  );
  const healthTone = healthScore >= 85 ? "text-teal-700 bg-teal-50 border-teal-200" : healthScore >= 70 ? "text-[#92620f] bg-[#fff4d8] border-[#eed38e]" : "text-[#a43f5a] bg-[#fde9ef] border-[#f2bdcd]";
  const reviewSourceStats = [
    { label: "外部 AI 审核", value: externalReviewedCount, detail: "MiniMax 或自定义模型" },
    { label: "本地规则/历史审核", value: Math.max(0, reviewedCount - externalReviewedCount), detail: "无凭证时兜底审核" }
  ];
  const qualityStats = [
    { label: "优秀", value: excellentItems.length, color: "bg-[var(--teal)]" },
    { label: "合规", value: compliantItems.length, color: "bg-[#6d5bd0]" },
    { label: "待补充", value: lowQualityItems.length, color: "bg-[#b94a66]" }
  ];
  const groupNames = Array.from(new Set([...coCreation.groups, ...activeStudents.map((student) => student.groupName).filter(Boolean)]));
  const groupStats = groupNames.map((group) => {
    const members = activeStudents.filter((student) => student.groupName === group);
    const submissions = items.filter((item) => accountByName.get(item.author)?.groupName === group).length;
    const ideas = coCreation.ideas.filter((idea) => coCreation.ideaGroups?.[idea] === group).length;
    const votes = Object.values(coCreation.groupVotes || {}).reduce((sum, groupVotes) => sum + (groupVotes[group] || 0), 0);
    return { group, members: members.length, submissions, ideas, votes, signal: submissions + ideas + votes };
  });
  const maxGroupSignal = Math.max(1, ...groupStats.map((group) => group.signal));
  const recentItems = [...items].sort((a, b) => getDateValue(b.createdAt) - getDateValue(a.createdAt)).slice(0, 5);
  const attentionItems = [
    missingStudents.length
      ? {
          title: "未提交学员",
          value: String(missingStudents.length),
          body: missingStudents.slice(0, 4).map((student) => student.name).join("、")
        }
      : null,
    lowQualityItems.length
      ? {
          title: "待补充内容",
          value: String(lowQualityItems.length),
          body: lowQualityItems.slice(0, 2).map((item) => item.title).join("、")
        }
      : null,
    zeroLikeItems.length
      ? {
          title: "低互动提交",
          value: String(zeroLikeItems.length),
          body: zeroLikeItems.slice(0, 2).map((item) => item.author).join("、")
        }
      : null,
    coCreation.converged
      ? {
          title: "共创主题待更新",
          value: "1",
          body: "当前主题已收敛，教师应发布新的共创主题。"
        }
      : null,
    pendingPlans.length
      ? {
          title: "行动计划待确认",
          value: String(pendingPlans.length),
          body: pendingPlans.slice(0, 3).map((plan) => plan.student).join("、")
        }
      : null,
    dueCheckpoints.length
      ? {
          title: "转化节点待追踪",
          value: String(dueCheckpoints.length),
          body: dueCheckpoints.slice(0, 2).map(({ plan, checkpoint }) => `${plan.student} ${checkpoint.day}`).join("、")
        }
      : null
  ].filter(Boolean) as Array<{ title: string; value: string; body: string }>;

  const explicitCards = [
    {
      label: "提交覆盖率",
      value: formatPercent(submittedStudentCount, activeStudents.length),
      detail: `${submittedStudentCount}/${activeStudents.length || 0} 名活跃学员`,
      icon: Users,
      tone: "border-teal-200 bg-teal-50 text-teal-700"
    },
    {
      label: "合规以上",
      value: formatPercent(items.length - lowQualityItems.length, items.length),
      detail: `${items.length - lowQualityItems.length}/${items.length} 条可用提交`,
      icon: CheckCircle2,
      tone: "border-[#d9d1ff] bg-[#f1edff] text-[#6d5bd0]"
    },
    {
      label: "知识沉淀",
      value: String(knowledgeBase.length),
      detail: `${knowledgeLinkedCount} 条来自学员提交`,
      icon: Database,
      tone: "border-[#f2c5bf] bg-[#fff0ee] text-[#bd5145]"
    },
    {
      label: "报告产出",
      value: String(reportCount),
      detail: `${coCreation.archives?.length || 0} 个归档主题`,
      icon: FileText,
      tone: "border-[#eed38e] bg-[#fff4d8] text-[#92620f]"
    }
  ];

  const implicitCards = [
    {
      label: "未提交",
      value: String(missingStudents.length),
      detail: missingStudents.length ? missingStudents.slice(0, 3).map((student) => student.name).join("、") : "暂无缺口",
      icon: MessageSquareWarning,
      tone: missingStudents.length ? "border-[#f2bdcd] bg-[#fde9ef] text-[#a43f5a]" : "border-teal-200 bg-teal-50 text-teal-700"
    },
    {
      label: "低互动",
      value: String(zeroLikeItems.length),
      detail: zeroLikeItems.length ? "需要教师二次关注" : "互动正常",
      icon: ThumbsUp,
      tone: zeroLikeItems.length ? "border-[#eed38e] bg-[#fff4d8] text-[#92620f]" : "border-teal-200 bg-teal-50 text-teal-700"
    },
    {
      label: "隐藏观点",
      value: String(hiddenIdeaCount),
      detail: "无效/重复观点不进入可见分类",
      icon: EyeOff,
      tone: hiddenIdeaCount ? "border-[#d9d1ff] bg-[#f1edff] text-[#6d5bd0]" : "border-slate-200 bg-slate-50 text-slate-600"
    },
    {
      label: "待确认计划",
      value: String(pendingPlans.length),
      detail: planValues.length ? `${confirmedPlans.length}/${planValues.length} 已确认` : "暂无计划",
      icon: Clock3,
      tone: pendingPlans.length ? "border-[#eed38e] bg-[#fff4d8] text-[#92620f]" : "border-teal-200 bg-teal-50 text-teal-700"
    }
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-5 max-lg:block">
        <div className="flex items-start gap-3">
          <div className={`grid h-12 w-12 place-items-center rounded-lg border ${healthTone}`}>
            <Gauge size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--teal)]">管理员数据看板</p>
            <h3 className="mt-2 text-2xl font-bold">显性反馈与隐性反馈</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">显性反馈来自提交、点赞、审核、入库和报告；隐性反馈用于发现缺交、低互动、待补充、隐藏观点和计划节点风险。</p>
          </div>
        </div>
        <div className="mt-0 grid min-w-[280px] grid-cols-2 gap-2 max-lg:mt-4">
          <Metric label="运行健康度" value={`${healthScore}%`} />
          <Metric label="平均点赞" value={averageLikes} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        {explicitCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`rounded-lg border bg-white p-4 ${card.tone}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{card.label}</p>
                <Icon size={18} />
              </div>
              <p className="mt-3 text-2xl font-bold text-[var(--foreground)]">{card.value}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{card.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-[1.05fr_0.95fr] gap-5 max-xl:grid-cols-1">
        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={19} className="text-[var(--teal)]" />
              <h4 className="text-lg font-bold">显性反馈</h4>
            </div>
            <button onClick={() => onOpen("knowledge")} className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-semibold hover:border-[var(--teal)]">
              查看知识库
            </button>
          </div>
          <div className="space-y-5">
            <div>
              <p className="mb-3 text-sm font-semibold">提交质量分布</p>
              <div className="space-y-3">
                {qualityStats.map((item) => {
                  const width = getPercentNumber(item.value, items.length);
                  return (
                    <div key={item.label}>
                      <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
                        <span>{item.label}</span>
                        <span>{item.value} 条 · {width}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
              {reviewSourceStats.map((item) => (
                <div key={item.label} className="border-t border-[var(--line)] pt-3">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-1 text-2xl font-bold">{item.value}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.detail}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold">各环节提交与入库</p>
              <div className="grid grid-cols-5 gap-2 max-lg:grid-cols-3 max-md:grid-cols-1">
                {phaseStats.map((module) => {
                  const rate = getPercentNumber(module.entries, module.submissions);
                  return (
                    <button key={module.id} onClick={() => onOpen(module.id)} className="rounded-lg border border-[var(--line)] p-3 text-left hover:border-[var(--teal)]">
                      <p className="text-sm font-semibold">{module.title}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{module.submissions} 提交 · {module.entries} 入库</p>
                      <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                        <div className="h-1.5 rounded-full bg-[var(--teal)]" style={{ width: `${rate}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={19} className="text-[#6d5bd0]" />
              <h4 className="text-lg font-bold">隐性反馈</h4>
            </div>
            <span className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)]">后台信号</span>
          </div>
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
            {implicitCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className={`rounded-lg border p-3 ${card.tone}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{card.label}</p>
                    <Icon size={17} />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{card.value}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{card.detail}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle size={16} className="text-[#b94a66]" />
              关注队列
            </p>
            <div className="space-y-2">
              {attentionItems.length ? (
                attentionItems.map((item) => (
                  <div key={item.title} className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3 text-sm">
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.body}</p>
                    </div>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold">{item.value}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">当前暂无高优先级隐性风险。</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_0.85fr] gap-5 max-xl:grid-cols-1">
        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="text-lg font-bold">小组参与热力</h4>
            <span className="text-xs text-[var(--muted)]">{visibleIdeaCount} 条可见共创观点</span>
          </div>
          <div className="space-y-3">
            {groupStats.map((group) => {
              const width = getPercentNumber(group.signal, maxGroupSignal);
              return (
                <div key={group.group}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold">{group.group}</span>
                    <span className="text-xs text-[var(--muted)]">{group.members} 人 · {group.submissions} 提交 · {group.ideas} 观点 · {group.votes} 票</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-[#6d5bd0]" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => onOpen("co-creation")} className="mt-4 flex w-full items-center justify-between rounded-lg border border-[var(--line)] px-4 py-3 text-sm font-semibold hover:border-[var(--teal)]">
            查看共创环数据
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="text-lg font-bold">最新课堂反馈</h4>
            <span className="text-xs text-[var(--muted)]">按提交时间排序</span>
          </div>
          <div className="space-y-3">
            {recentItems.map((item) => (
              <div key={item.id} className="border-t border-[var(--line)] pt-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{item.author} · {getPhaseTitle(item.phase)} · {formatShortDate(item.createdAt)}</p>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold">{item.quality}</span>
                </div>
              </div>
            ))}
            {!recentItems.length && <div className="rounded-lg border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">暂无提交反馈。</div>}
          </div>
        </div>
      </div>
    </section>
  );
}

function AccountManagementPanel({ accounts, onSaveAccount }: { accounts: DemoAccount[]; onSaveAccount: (account: DemoAccount) => void }) {
  const emptyAccount: DemoAccount = {
    id: "",
    username: "",
    password: "student123",
    name: "",
    role: "student",
    className: "青年教师研修一班",
    groupName: "第一小组",
    title: "参训学员",
    active: true
  };
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState<DemoAccount>(emptyAccount);

  function startEdit(account?: DemoAccount) {
    setEditingId(account?.id || "new");
    setDraft(account || emptyAccount);
  }

  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold">账号管理</h3>
        <button onClick={() => startEdit()} className="rounded-lg bg-[var(--teal)] px-3 py-2 text-sm font-semibold text-white">
          新增账号
        </button>
      </div>

      {editingId && (
        <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 p-4">
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
            <label className="text-sm font-semibold">
              账号
              <input value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2 font-normal" />
            </label>
            <label className="text-sm font-semibold">
              密码
              <input value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2 font-normal" />
            </label>
            <label className="text-sm font-semibold">
              姓名
              <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2 font-normal" />
            </label>
            <label className="text-sm font-semibold">
              角色
              <select value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value as DemoAccount["role"] })} className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 font-normal">
                <option value="student">学员</option>
                <option value="teacher">班主任</option>
                <option value="admin">管理员</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              班级
              <input value={draft.className} onChange={(event) => setDraft({ ...draft, className: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2 font-normal" />
            </label>
            <label className="text-sm font-semibold">
              小组
              <input value={draft.groupName} onChange={(event) => setDraft({ ...draft, groupName: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2 font-normal" />
            </label>
            <label className="text-sm font-semibold">
              职责说明
              <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2 font-normal" />
            </label>
            <label className="flex items-center gap-2 pt-7 text-sm font-semibold">
              <input type="checkbox" checked={draft.active !== false} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} className="h-4 w-4 accent-[var(--teal)]" />
              启用账号
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => onSaveAccount(draft)} className="rounded-lg bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white">保存</button>
            <button onClick={() => setEditingId("")} className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-semibold">取消</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {accounts.map((account) => {
          const profile = roleProfiles.find((item) => item.id === account.role);
          return (
            <div key={account.id} className="rounded-lg border border-[var(--line)] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{account.name}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{account.username} · {account.groupName} · {account.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-1 text-xs font-semibold ${account.active === false ? "bg-slate-100 text-slate-500" : "bg-teal-50 text-teal-700"}`}>
                    {account.active === false ? "停用" : profile?.name}
                  </span>
                  <button onClick={() => startEdit(account)} className="rounded-md border border-[var(--line)] px-2 py-1 text-xs font-semibold">编辑</button>
                  <button onClick={() => onSaveAccount({ ...account, active: account.active === false })} className="rounded-md border border-[var(--line)] px-2 py-1 text-xs font-semibold">
                    {account.active === false ? "启用" : "停用"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClassSubmissionPanel({
  items,
  onLike,
  canLike,
  title
}: {
  items: LearningItem[];
  onLike: (id: string) => void;
  canLike: boolean;
  title: string;
}) {
  const authors = Array.from(new Set(items.map((item) => item.author))).sort();
  const [selectedAuthor, setSelectedAuthor] = useState("全部学员");
  const [selectedPhase, setSelectedPhase] = useState<PhaseId | "all">("all");
  const [status, setStatus] = useState<"all" | "excellent" | "knowledge" | "pending">("all");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filteredItems = items.filter((item) => {
    if (selectedAuthor !== "全部学员" && item.author !== selectedAuthor) return false;
    if (selectedPhase !== "all" && item.phase !== selectedPhase) return false;
    if (status === "excellent" && !item.isExcellent) return false;
    if (status === "knowledge" && !item.inKnowledgeBase) return false;
    if (status === "pending" && (item.isExcellent || item.inKnowledgeBase)) return false;
    return true;
  });

  const selectedCount = selectedAuthor === "全部学员" ? items.length : items.filter((item) => item.author === selectedAuthor).length;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const visibleItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [selectedAuthor, selectedPhase, status, items.length]);

  return (
    <section className="rounded-lg border border-[var(--line)] bg-white">
      <div className="border-b border-[var(--line)] px-5 py-4">
        <div className="flex items-start justify-between gap-4 max-xl:block">
          <div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">教师和管理员可按学员、环节和入库状态查看所有提交，确认学生端内容是否进入班级内容池。</p>
          </div>
          <div className="mt-0 grid grid-cols-3 gap-2 text-sm max-xl:mt-4 max-md:grid-cols-1">
            <Metric label="当前范围" value={String(selectedCount)} />
            <Metric label="筛选结果" value={String(filteredItems.length)} />
            <Metric label="已入库" value={String(filteredItems.filter((item) => item.inKnowledgeBase).length)} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_1fr_1fr] gap-3 max-md:grid-cols-1">
          <label className="text-sm font-semibold">
            学员
            <select
              value={selectedAuthor}
              onChange={(event) => setSelectedAuthor(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 font-normal outline-none focus:border-[var(--teal)]"
            >
              <option>全部学员</option>
              {authors.map((author) => (
                <option key={author}>{author}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            环节
            <select
              value={selectedPhase}
              onChange={(event) => setSelectedPhase(event.target.value as PhaseId | "all")}
              className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 font-normal outline-none focus:border-[var(--teal)]"
            >
              <option value="all">全部环节</option>
              {coachModules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            状态
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as "all" | "knowledge" | "pending")}
              className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 font-normal outline-none focus:border-[var(--teal)]"
            >
              <option value="all">全部状态</option>
              <option value="excellent">优秀池</option>
              <option value="knowledge">已入库</option>
              <option value="pending">待沉淀</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-3 p-4">
        {visibleItems.length ? (
          visibleItems.map((item) => <LearningItemCard key={item.id} item={item} onLike={onLike} canLike={canLike} />)
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">当前筛选条件下暂无提交内容。</div>
        )}
        {filteredItems.length > pageSize && (
          <div className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm">
            <span>第 {page}/{totalPages} 页，共 {filteredItems.length} 条</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="rounded-md border border-[var(--line)] bg-white px-3 py-1 disabled:text-slate-400">
                上一页
              </button>
              <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="rounded-md border border-[var(--line)] bg-white px-3 py-1 disabled:text-slate-400">
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function PlanTargetSelector({
  plansByStudent,
  studentOptions,
  selectedStudent,
  onSelectStudent
}: {
  plansByStudent: PlansByStudent;
  studentOptions: string[];
  selectedStudent: string;
  onSelectStudent: (student: string) => void;
}) {
  return (
    <label className="text-sm font-semibold">
      选择学员
      <select
        value={selectedStudent}
        onChange={(event) => onSelectStudent(event.target.value)}
        className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 font-normal outline-none focus:border-[#b94a66]"
      >
        {studentOptions.map((student) => (
          <option key={student} value={student}>
            {student}{plansByStudent[student] ? " · 已生成" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function PlanTargetPanel({
  plan,
  plansByStudent,
  studentOptions,
  selectedStudent,
  onSelectStudent,
  onCreatePlan,
  canGeneratePlan
}: {
  plan: PersonalPlan | null;
  plansByStudent: PlansByStudent;
  studentOptions: string[];
  selectedStudent: string;
  onSelectStudent: (student: string) => void;
  onCreatePlan: (studentName?: string) => void;
  canGeneratePlan: boolean;
}) {
  const generatedCount = studentOptions.filter((student) => plansByStudent[student]).length;

  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-5">
      <div className="flex items-start justify-between gap-4 max-lg:block">
        <div>
          <p className="text-sm font-semibold text-[#a43f5a]">行动计划生成对象</p>
          <h3 className="mt-2 text-xl font-bold">先选择学员，再生成个人行动计划</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">教师生成计划时会绑定到选定学员，学生端只查看自己名下的计划。</p>
        </div>
        <div className="mt-0 grid grid-cols-2 gap-2 text-sm max-lg:mt-4">
          <Metric label="可选学员" value={String(studentOptions.length)} />
          <Metric label="已生成" value={String(generatedCount)} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-3 max-md:grid-cols-1">
        <PlanTargetSelector plansByStudent={plansByStudent} studentOptions={studentOptions} selectedStudent={selectedStudent} onSelectStudent={onSelectStudent} />
        <button
          onClick={() => onCreatePlan(selectedStudent)}
          disabled={!canGeneratePlan || !selectedStudent}
          className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${
            canGeneratePlan && selectedStudent ? "bg-[#b94a66] text-white" : "bg-slate-100 text-slate-400"
          }`}
        >
          {canGeneratePlan ? <UserRound size={16} /> : <Lock size={16} />}
          {plansByStudent[selectedStudent] ? "刷新该学员计划" : "生成该学员计划"}
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] p-4 text-sm">
        <p className="font-semibold">{selectedStudent || "未选择学员"}</p>
        <p className="mt-1 leading-6 text-[var(--muted)]">
          {plan ? "该学员已生成个人行动计划，可在转化环查看并继续提交成果。" : "该学员还没有个人行动计划。"}
        </p>
      </div>
    </section>
  );
}

function TeacherHero({
  coCreation,
  reportReady,
  approvedCount,
  onOpen
}: {
  coCreation: CoCreationState;
  reportReady: boolean;
  approvedCount: number;
  onOpen: (view: ViewId) => void;
}) {
  return (
    <section className="grid grid-cols-[1fr_0.8fr] gap-5 max-xl:grid-cols-1">
      <div className="rounded-lg border border-[var(--line)] bg-white p-5">
        <p className="text-sm font-semibold text-[var(--teal)]">班主任工作台</p>
        <h2 className="mt-2 text-2xl font-bold">班级运营与智能体调度</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          聚焦今天要推进的班级动作：检查优秀内容沉淀、运行共创收敛、生成个性化方案，并把转化追踪交给转化教练。
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Metric label="已入库素材" value={String(approvedCount)} />
          <Metric label="共创观点" value={String(coCreation.ideas.length)} />
          <Metric label="报告状态" value={reportReady ? "已生成" : "待收敛"} />
        </div>
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-white p-5">
        <h3 className="text-xl font-bold">今日运营队列</h3>
        <div className="mt-4 space-y-2">
          <QueueButton label="运行共创下一轮" detail="新增观点少于等于 3 条时自动生成共识报告" onClick={() => onOpen("co-creation")} />
          <QueueButton label="调用总教练生成方案" detail="基于总知识库生成个性化方案建议报告" onClick={() => onOpen("coach")} />
          <QueueButton label="查看训后转化追踪" detail="检查 D+30、D+90 节点和成果提交" onClick={() => onOpen("transformation")} />
        </div>
      </div>
    </section>
  );
}

function StudentDashboard({
  phaseStats,
  items,
  knowledgeBase,
  coCreation,
  plan,
  account,
  onOpen,
  onConfirmPlan
}: {
  phaseStats: Array<(typeof coachModules)[number] & { entries: number; submissions: number }>;
  items: LearningItem[];
  knowledgeBase: KnowledgeEntry[];
  coCreation: CoCreationState;
  plan: PersonalPlan | null;
  account: DemoAccount;
  onOpen: (view: ViewId) => void;
  onConfirmPlan: (studentName?: string) => void;
}) {
  const myItems = items.filter((item) => item.author === account.name);
  const myApproved = myItems.filter((item) => item.inKnowledgeBase).length;
  const dueCheckpoints = getDueCheckpoints(plan);
  const publicExcellent = knowledgeBase.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-[1fr_0.85fr] gap-5 max-xl:grid-cols-1">
        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <p className="text-sm font-semibold text-[#a43f5a]">{account.className}</p>
          <h2 className="mt-2 text-2xl font-bold">{account.name}的五环学习任务</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            这里不显示后台治理内容，只保留你需要完成的学习动作：提交批注、记录即时贴、完成反思、参与共创观点和查看自己的行动计划。
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Metric label="我的提交" value={String(myItems.length)} />
            <Metric label="我的入库" value={String(myApproved)} />
            <Metric label="共创观点" value={String(coCreation.ideas.length)} />
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <h3 className="text-xl font-bold">下一步</h3>
          <div className="mt-4 space-y-2">
            <QueueButton label="提交一条学习批注" detail="围绕看到了什么、为什么重要、如何迁移来写" onClick={() => onOpen("deep-study")} />
            <QueueButton label="补充本轮共创观点" detail="学员只提交观点，由班主任运行收敛" onClick={() => onOpen("co-creation")} />
            <QueueButton label="查看我的行动计划" detail={plan ? "行动计划已生成，按节点提交成果" : "等待班主任生成后查看 D+30、D+90 节点"} onClick={() => onOpen("transformation")} />
          </div>
        </div>
      </section>

      <DeliveryFlowPanel
        title="我的学习交付路径"
        description="学员端只保留和自己有关的交付动作：先产出学习证据，再参与共创，最后接收方案并回传成果。"
        steps={deliveryFlows.student}
        statusLabels={[
          myItems.length > 0 ? "已提交" : "待提交",
          coCreation.ideas.length > 0 ? "可参与" : "待开放",
          plan ? "已生成" : "待下发",
          plan ? "待回传" : "待计划"
        ]}
        onOpen={onOpen}
      />

      {(dueCheckpoints.length > 0 || plan?.status === "待确认") && (
        <section className="rounded-lg border border-[#f2bdcd] bg-[#fde9ef] p-5">
          <div className="flex items-start justify-between gap-4 max-md:block">
            <div className="flex gap-3">
              <Bell className="mt-1 text-[#a43f5a]" size={20} />
              <div>
                <h3 className="text-xl font-bold">训后节点提醒</h3>
                <p className="mt-1 text-sm leading-6 text-[#6f3042]">
                  {plan?.status === "待确认" ? "你的个人行动计划待确认，确认后转化教练会按节点追踪成果。" : "已有节点到期，请在转化环提交成果证据。"}
                </p>
              </div>
            </div>
            {plan?.status === "待确认" ? (
              <button onClick={() => onConfirmPlan(account.name)} className="mt-0 flex items-center gap-2 rounded-lg bg-[#b94a66] px-4 py-2.5 text-sm font-semibold text-white max-md:mt-3">
                <CheckCircle2 size={16} />
                确认我的方案
              </button>
            ) : (
              <button onClick={() => onOpen("transformation")} className="mt-0 rounded-lg bg-[#b94a66] px-4 py-2.5 text-sm font-semibold text-white max-md:mt-3">
                去提交成果
              </button>
            )}
          </div>
          {!!dueCheckpoints.length && (
            <div className="mt-4 grid grid-cols-2 gap-3 max-md:grid-cols-1">
              {dueCheckpoints.map((checkpoint) => (
                <div key={checkpoint.day} className="rounded-lg border border-[#f2bdcd] bg-white px-3 py-2 text-sm">
                  <p className="font-semibold">{checkpoint.day} · {checkpoint.label}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">预计节点：{checkpoint.date || "立即提交"}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="grid grid-cols-3 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        {phaseStats
          .filter((module) => ["deep-study", "practice", "reflection"].includes(module.id))
          .map((module) => {
            const Icon = module.icon;
            return (
              <button key={module.id} onClick={() => onOpen(module.id)} className="rounded-lg border border-[var(--line)] bg-white p-5 text-left hover:border-[#a43f5a]">
                <div className={`grid h-10 w-10 place-items-center rounded-lg border ${toneClass[module.tone]}`}>
                  <Icon size={19} />
                </div>
                <p className="mt-4 font-bold">{module.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{module.successRule}</p>
              </button>
            );
          })}
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold">公开优秀内容</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">点赞达标并入库的内容会公开给学员参考。</p>
          </div>
          <button onClick={() => onOpen("knowledge")} className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-semibold hover:border-[#a43f5a]">
            查看全部
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-1">
          {publicExcellent.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-[var(--line)] p-4">
              <p className="font-semibold">{entry.title}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{entry.source}</p>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{entry.summary}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DeliveryFlowPanel({
  title,
  description,
  steps,
  statusLabels,
  onOpen
}: {
  title: string;
  description: string;
  steps: DeliveryStep[];
  statusLabels: string[];
  onOpen: (view: ViewId) => void;
}) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-5">
      <div className="mb-5 flex items-start justify-between gap-4 max-md:block">
        <div>
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p>
        </div>
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 max-md:mt-3">按交付物推进</div>
      </div>

      <div className="grid grid-cols-4 gap-3 max-2xl:grid-cols-2 max-md:grid-cols-1">
        {steps.map((step, index) => (
          <button
            key={step.title}
            onClick={() => onOpen(step.view)}
            className="group flex min-h-[188px] flex-col rounded-lg border border-[var(--line)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--teal)] hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--surface-strong)] text-sm font-bold text-slate-700">{index + 1}</div>
              <span className="rounded-md bg-[var(--surface-strong)] px-2 py-1 text-xs font-semibold text-slate-600">{statusLabels[index] || "待处理"}</span>
            </div>
            <p className="mt-4 font-bold">{step.title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{step.goal}</p>
            <div className="mt-auto pt-4">
              <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-xs leading-5 text-slate-600">
                <span className="font-semibold text-slate-700">交付物：</span>
                {step.deliverable}
                <br />
                <span className="font-semibold text-slate-700">接收方：</span>
                {step.receiver}
              </div>
              <div className="mt-3 flex items-center justify-between text-sm font-semibold text-[var(--teal)]">
                进入处理
                <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function QueueButton({ label, detail, onClick }: { label: string; detail: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between gap-4 rounded-lg border border-[var(--line)] px-4 py-3 text-left hover:border-[var(--teal)]">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{detail}</span>
      </span>
      <ChevronRight size={16} />
    </button>
  );
}

function WorkflowPanel({
  module,
  activePhase,
  activeItems,
  draft,
  setDraft,
  attachments,
  setAttachments,
  onUploadImage,
  onSubmit,
  onLike,
  canSubmit,
  canLike
}: {
  module: (typeof coachModules)[number];
  activePhase: PhaseId;
  activeItems: LearningItem[];
  draft: { title: string; body: string };
  setDraft: (draft: { title: string; body: string }) => void;
  attachments: UploadedAsset[];
  setAttachments: (assets: UploadedAsset[]) => void;
  onUploadImage: (file: File) => void;
  onSubmit: () => void;
  onLike: (id: string) => void;
  canSubmit: boolean;
  canLike: boolean;
}) {
  const delivery = deliveryByPhase[activePhase];
  const blueprint = submissionBlueprints[activePhase];
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(activeItems.length / pageSize));
  const visibleItems = activeItems.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [activePhase, activeItems.length]);

  return (
    <div className="grid grid-cols-[0.8fr_1.2fr] gap-5 max-xl:grid-cols-1">
      <aside className="space-y-4">
        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <p className="text-sm font-semibold text-[var(--teal)]">{module.coach}</p>
          <h2 className="mt-2 text-2xl font-bold">{module.title}</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{module.purpose}</p>
          <div className="mt-5 space-y-2">
            {module.does.map((item) => (
              <div key={item} className="flex gap-2 text-sm leading-6">
                <Check className="mt-1 text-[var(--teal)]" size={15} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <p className="text-sm font-semibold text-[var(--teal)]">当前环交付说明</p>
          <h3 className="mt-2 text-xl font-bold">{module.title}要交付什么</h3>
          <div className="mt-4 space-y-3 text-sm">
            <DeliveryLine label="提交内容" value={module.input} />
            <DeliveryLine label="证明材料" value={delivery.evidence} />
            <DeliveryLine label="交付给" value={delivery.receiver} />
            <DeliveryLine label="达标后" value={delivery.next} />
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <p className="text-sm font-semibold text-[var(--teal)]">{typeByPhase[activePhase]}填写模板</p>
          <div className="mt-4 space-y-3">
            {blueprint.templateSections.map((section) => (
              <div key={section.label} className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm">
                <p className="font-semibold">{section.label}</p>
                <p className="mt-1 leading-5 text-[var(--muted)]">{section.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="space-y-4">
        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
            <label className="text-sm font-semibold">
              {blueprint.titleLabel}
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                disabled={!canSubmit}
                placeholder={blueprint.titlePlaceholder}
                className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2 font-normal outline-none focus:border-[var(--teal)] disabled:bg-slate-50 disabled:text-slate-400"
              />
            </label>
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] p-3 text-sm">
              <p className="font-semibold">输出</p>
              <p className="mt-1 text-[var(--muted)]">{module.output}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{blueprint.outputHint}</p>
            </div>
          </div>
          <label className="mt-4 block text-sm font-semibold">
            {blueprint.bodyLabel}
            <textarea
              value={draft.body}
              onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              rows={8}
              disabled={!canSubmit}
              placeholder={blueprint.bodyPlaceholder}
              className="mt-2 w-full resize-none rounded-lg border border-[var(--line)] px-3 py-2 font-normal leading-6 outline-none focus:border-[var(--teal)] disabled:bg-slate-50 disabled:text-slate-400"
            />
          </label>
          {activePhase === "reflection" && <GrowGuidedBuilder draftBody={draft.body} onChange={(body) => setDraft({ ...draft, body })} disabled={!canSubmit} />}
          <ImageUploadBox attachments={attachments} setAttachments={setAttachments} onUploadImage={onUploadImage} disabled={!canSubmit} />
          <div className="mt-4 flex flex-wrap gap-2">
            {blueprint.qualityChecks.map((check) => (
              <span key={check} className="rounded-md bg-[var(--surface-strong)] px-2 py-1 text-xs font-semibold text-slate-600">
                {check}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 max-md:block">
            <p className="text-sm text-[var(--muted)]">
              {canSubmit ? `判断标准：${module.successRule}` : "当前角色可查看流程，但不能提交学习产出。"}
            </p>
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold max-md:mt-3 ${
                canSubmit ? "bg-[var(--teal)] text-white" : "bg-slate-100 text-slate-400"
              }`}
            >
              <Send size={16} />
              {blueprint.submitLabel}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-white">
          <div className="border-b border-[var(--line)] px-5 py-4">
            <h3 className="font-bold">互动内容池</h3>
          </div>
          <div className="grid gap-3 p-4">
            {visibleItems.map((item) => (
              <LearningItemCard key={item.id} item={item} onLike={onLike} canLike={canLike} />
            ))}
            {activeItems.length > pageSize && (
              <div className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm">
                <span>第 {page}/{totalPages} 页</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="rounded-md border border-[var(--line)] bg-white px-3 py-1 disabled:text-slate-400">
                    上一页
                  </button>
                  <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="rounded-md border border-[var(--line)] bg-white px-3 py-1 disabled:text-slate-400">
                    下一页
                  </button>
                </div>
              </div>
            )}
            {!activeItems.length && (
              <div className="rounded-lg border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">当前环节暂无提交内容。</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function GrowGuidedBuilder({ draftBody, onChange, disabled }: { draftBody: string; onChange: (body: string) => void; disabled: boolean }) {
  const parts = parseGrowBody(draftBody);
  const updatePart = (key: keyof typeof parts, value: string) => {
    onChange(
      [
        `Goal 目标：${key === "goal" ? value : parts.goal}`,
        `Reality 现状：${key === "reality" ? value : parts.reality}`,
        `Options 选择：${key === "options" ? value : parts.options}`,
        `Will 行动：${key === "will" ? value : parts.will}`
      ].join("\n")
    );
  };

  const fields: Array<{ key: keyof typeof parts; label: string; hint: string }> = [
    { key: "goal", label: "Goal 目标", hint: "你希望改变的具体教学问题" },
    { key: "reality", label: "Reality 现状", hint: "当前真实情况和证据" },
    { key: "options", label: "Options 选择", hint: "可以尝试的多个方案" },
    { key: "will", label: "Will 行动", hint: "下一次明确要做的动作" }
  ];

  return (
    <div className="mt-4 rounded-lg border border-[#d9d1ff] bg-[#f1edff] p-4">
      <p className="text-sm font-semibold text-[#6d5bd0]">GROW 分步引导</p>
      <div className="mt-3 grid grid-cols-2 gap-3 max-md:grid-cols-1">
        {fields.map((field) => (
          <label key={field.key} className="text-sm font-semibold">
            {field.label}
            <textarea
              value={parts[field.key]}
              onChange={(event) => updatePart(field.key, event.target.value)}
              disabled={disabled}
              rows={3}
              placeholder={field.hint}
              className="mt-2 w-full resize-none rounded-lg border border-[#d9d1ff] bg-white px-3 py-2 font-normal leading-6 outline-none focus:border-[#6d5bd0] disabled:bg-slate-50"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function parseGrowBody(body: string) {
  const read = (pattern: RegExp) => body.match(pattern)?.[1]?.trim() || "";
  return {
    goal: read(/(?:Goal\s*)?目标[：:]\s*([\s\S]*?)(?=(?:Reality\s*)?现状[：:]|Options\s*选择[：:]|Will\s*行动[：:]|$)/i),
    reality: read(/(?:Reality\s*)?现状[：:]\s*([\s\S]*?)(?=Options\s*选择[：:]|Will\s*行动[：:]|$)/i),
    options: read(/(?:Options\s*)?选择[：:]\s*([\s\S]*?)(?=Will\s*行动[：:]|$)/i),
    will: read(/(?:Will\s*)?行动[：:]\s*([\s\S]*)$/i)
  };
}

function DeliveryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function ImageUploadBox({
  attachments,
  setAttachments,
  onUploadImage,
  disabled
}: {
  attachments: UploadedAsset[];
  setAttachments: (assets: UploadedAsset[]) => void;
  onUploadImage: (file: File) => void;
  disabled: boolean;
}) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface-strong)] p-4">
      <div className="flex items-center justify-between gap-3 max-md:block">
        <div>
          <p className="text-sm font-semibold">图片附件</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">支持 jpg、png、webp、gif，单张不超过 5MB。跟练环建议上传现场照片。</p>
        </div>
        <label className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold max-md:mt-3 ${disabled ? "bg-slate-100 text-slate-400" : "bg-white text-[var(--teal)] hover:bg-teal-50"}`}>
          <ImagePlus size={16} />
          上传图片
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUploadImage(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      {attachments.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 max-md:grid-cols-1">
          {attachments.map((asset) => (
            <div key={asset.url} className="relative overflow-hidden rounded-lg border border-[var(--line)] bg-white">
              <img src={asset.url} alt={asset.name} className="h-32 w-full object-cover" />
              <div className="p-2 text-xs text-slate-600">
                <p className="truncate font-semibold">{asset.name}</p>
                <p>{Math.ceil(asset.size / 1024)} KB</p>
              </div>
              <button
                type="button"
                onClick={() => setAttachments(attachments.filter((item) => item.url !== asset.url))}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-600 shadow-sm hover:bg-white"
                title="移除图片"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LearningItemCard({ item, onLike, canLike }: { item: LearningItem; onLike: (id: string) => void; canLike: boolean }) {
  const phaseName = coachModules.find((module) => module.id === item.phase)?.title || item.phase;

  return (
    <article className="rounded-lg border border-[var(--line)] bg-white p-4">
      <div className="flex items-start justify-between gap-4 max-md:block">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[var(--surface-strong)] px-2 py-1 text-xs font-semibold text-slate-600">{phaseName}</span>
            <span className="rounded-md bg-[var(--surface-strong)] px-2 py-1 text-xs font-semibold text-slate-600">{item.type}</span>
            <span className="text-xs text-[var(--muted)]">{item.author}</span>
            {item.createdAt && <span className="text-xs text-[var(--muted)]">{item.createdAt.slice(0, 10)}</span>}
          </div>
          <h4 className="mt-3 font-bold">{item.title}</h4>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">{item.body}</p>
        </div>
        <span className="rounded-lg border border-[var(--line)] px-2.5 py-1 text-xs max-md:mt-3 inline-block">{item.quality}</span>
      </div>

      {!!item.attachments?.length && (
        <div className="mt-4 grid grid-cols-3 gap-3 max-md:grid-cols-1">
          {item.attachments.map((asset) => (
            <a key={asset.url} href={asset.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-strong)]">
              <img src={asset.url} alt={asset.name} className="h-32 w-full object-cover" />
              <p className="truncate px-2 py-1 text-xs text-slate-600">{asset.name}</p>
            </a>
          ))}
        </div>
      )}

      {item.aiSummary && <p className="mt-3 rounded-lg bg-[var(--surface-strong)] px-3 py-2 text-xs leading-5 text-slate-600">AI 摘要：{item.aiSummary}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {item.tags.map((tag) => (
          <span key={tag} className="rounded-md bg-[var(--surface-strong)] px-2 py-1 text-xs text-slate-600">
            {tag}
          </span>
        ))}
        <button
          onClick={() => onLike(item.id)}
          disabled={!canLike}
          className={`ml-auto flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-sm ${
            canLike ? "hover:border-[var(--teal)]" : "bg-slate-50 text-slate-400"
          }`}
        >
          <ThumbsUp size={15} />
          {item.likes}/{item.threshold}
        </button>
        {item.isExcellent && <span className="rounded-lg bg-[#fff4d8] px-3 py-2 text-sm font-semibold text-[#92620f]">优秀池</span>}
        {item.inKnowledgeBase && <span className="rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700">已入库</span>}
        {item.reviewSource && <span className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs text-slate-500">审核：{item.reviewSource}</span>}
      </div>
    </article>
  );
}

function CoCreationPanel({
  coCreation,
  ideaDraft,
  setIdeaDraft,
  onSubmitIdeas,
  onRun,
  onVote,
  onUpdateTopic,
  canSubmitIdeas,
  canRun,
  canVote,
  currentVoter,
  currentGroup,
  selectedGroup,
  onSelectGroup,
  role
}: {
  coCreation: CoCreationState;
  ideaDraft: string;
  setIdeaDraft: (value: string) => void;
  onSubmitIdeas: () => void;
  onRun: () => void;
  onVote: (idea: string) => void;
  onUpdateTopic: (topic: string) => void;
  canSubmitIdeas: boolean;
  canRun: boolean;
  canVote: boolean;
  currentVoter: string;
  currentGroup: string;
  selectedGroup: string;
  onSelectGroup: (group: string) => void;
  role: (typeof roleProfiles)[number];
}) {
  const blueprint = submissionBlueprints["co-creation"];
  const [topicDraft, setTopicDraft] = useState(coCreation.topic);
  const groupLocked = role.id === "student";
  const activeSubmitAllowed = canSubmitIdeas && !coCreation.converged;
  const activeRunAllowed = canRun && !coCreation.converged && coCreation.ideas.length > 0;
  const activeVoteAllowed = canVote && !coCreation.converged;
  const displayGroup = groupLocked ? currentGroup : selectedGroup;

  useEffect(() => {
    setTopicDraft(coCreation.topic);
  }, [coCreation.topic]);

  return (
    <div className="grid grid-cols-[0.9fr_1.1fr] gap-5 max-xl:grid-cols-1">
      <section className="rounded-lg border border-[var(--line)] bg-white p-5">
        <p className="text-sm font-semibold text-[#92620f]">{role.id === "student" ? "学员共创入口" : "共创教练 Agent"}</p>
        <h2 className="mt-2 text-2xl font-bold">{role.id === "student" ? "提交我的共创观点" : "群体智慧凝聚工作流"}</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {role.id === "student"
            ? "你可以提交当前主题下的有效观点；小组来自账号配置，不能自行修改。收敛后等待老师开启新主题。"
            : "每个主题只做一次收敛。收敛后系统按主题归档有效观点，隐藏无效观点，并要求老师或管理员开启新的共创主题。"}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Metric label="有效观点" value={String(coCreation.ideas.length)} />
          <Metric label="已隐藏" value={String(coCreation.hiddenIdeas?.length || 0)} />
          <Metric label="状态" value={coCreation.converged ? "待新主题" : "收集中"} />
        </div>
        {coCreation.converged && (
          <div className="mt-5 rounded-lg border border-[#eed38e] bg-[#fff8e8] px-4 py-3 text-sm font-semibold text-[#92620f]">
            当前主题已收敛并归档。请由老师或管理员更新一个新的共创主题后再继续提交观点。
          </div>
        )}

        <div className="mt-5 rounded-lg border border-[#eed38e] bg-[#fff8e8] p-4">
          <div className="flex items-end gap-3 max-md:block">
            <label className="flex-1 text-sm font-semibold">
              当前共创主题
              <input
                value={topicDraft}
                onChange={(event) => setTopicDraft(event.target.value)}
                disabled={!canRun}
                className="mt-2 w-full rounded-lg border border-[#eed38e] bg-white px-3 py-2 font-normal outline-none focus:border-[#b7791f] disabled:bg-slate-50"
              />
            </label>
            <button
              onClick={() => onUpdateTopic(topicDraft)}
              disabled={!canRun || topicDraft.trim() === coCreation.topic}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold max-md:mt-3 ${
                canRun && topicDraft.trim() !== coCreation.topic ? "bg-[#b7791f] text-white" : "bg-slate-100 text-slate-400"
              }`}
            >
              更新主题
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-[#eed38e] bg-[#fff8e8] p-4">
          <p className="text-sm font-semibold text-[#92620f]">共创观点提交格式</p>
          <div className="mt-3 grid grid-cols-3 gap-2 max-md:grid-cols-1">
            {blueprint.templateSections.map((section) => (
              <div key={section.label} className="rounded-lg border border-[#eed38e] bg-white px-3 py-2 text-sm">
                <p className="font-semibold">{section.label}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{section.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <label className="mt-5 block text-sm font-semibold">
          所属小组
          <select
            value={displayGroup}
            onChange={(event) => onSelectGroup(event.target.value)}
            disabled={groupLocked}
            className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 font-normal outline-none focus:border-[#b7791f] disabled:bg-slate-50 disabled:text-slate-500"
          >
            {coCreation.groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
            <option value="全班">全班</option>
          </select>
        </label>

        <label className="mt-5 block text-sm font-semibold">
          {blueprint.bodyLabel}，每行一条
          <textarea
            value={ideaDraft}
            onChange={(event) => setIdeaDraft(event.target.value)}
            rows={7}
            disabled={!activeSubmitAllowed}
            placeholder={blueprint.bodyPlaceholder}
            className="mt-2 w-full resize-none rounded-lg border border-[var(--line)] px-3 py-2 font-normal leading-6 outline-none focus:border-[#b7791f] disabled:bg-slate-50 disabled:text-slate-400"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {blueprint.qualityChecks.map((check) => (
            <span key={check} className="rounded-md bg-[#fff8e8] px-2 py-1 text-xs font-semibold text-[#92620f]">
              {check}
            </span>
          ))}
        </div>
        <button
          onClick={onSubmitIdeas}
          disabled={!activeSubmitAllowed}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${
            activeSubmitAllowed ? "border border-[#eed38e] bg-[#fff8e8] text-[#92620f]" : "bg-slate-100 text-slate-400"
          }`}
        >
          {activeSubmitAllowed ? <Send size={16} /> : <Lock size={16} />}
          {activeSubmitAllowed ? blueprint.submitLabel : coCreation.converged ? "等待新主题" : "当前角色不能提交观点"}
        </button>
        <button
          onClick={onRun}
          disabled={!activeRunAllowed}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${
            activeRunAllowed ? "bg-[#b7791f] text-white" : "bg-slate-100 text-slate-400"
          }`}
        >
          {activeRunAllowed ? <Layers3 size={16} /> : <Lock size={16} />}
          {activeRunAllowed ? "收敛当前主题并归档" : coCreation.converged ? "已收敛，请开启新主题" : "当前角色不能运行共创"}
        </button>
      </section>

      <section className="space-y-4">
        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <h3 className="font-bold">观点分类汇总</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 max-md:grid-cols-1">
            {Object.entries(coCreation.categories).map(([category, ideas]) => (
              <div key={category} className="rounded-lg border border-[var(--line)] p-4">
                <p className="font-semibold">{category}</p>
                <div className="mt-3 space-y-2">
                  {ideas.map((idea) => (
                    <p key={idea} className="text-sm leading-5 text-[var(--muted)]">
                      {idea}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {!Object.keys(coCreation.categories).length && (
              <div className="rounded-lg border border-dashed border-[var(--line)] p-6 text-center text-sm text-[var(--muted)]">当前主题暂无有效观点。</div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users size={18} className="text-[#b7791f]" />
            <h3 className="font-bold">分组贡献</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
            {coCreation.groups.map((group) => {
              const count = Object.values(coCreation.ideaGroups || {}).filter((value) => value === group).length;
              const votes = Object.values(coCreation.groupVotes || {}).reduce((sum, groupMap) => sum + (groupMap[group] || 0), 0);
              return <Metric key={group} label={group} value={`${count} 条 / ${votes} 票`} />;
            })}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Vote size={18} className="text-[#b7791f]" />
            <h3 className="font-bold">投票卡片</h3>
          </div>
          <div className="space-y-2">
            {Object.entries(coCreation.votes)
              .sort((a, b) => b[1] - a[1])
              .map(([idea, votes]) => {
                const hasVoted = Boolean(
                  currentVoter && (coCreation.voters?.[idea] || []).includes(currentVoter)
                );
                const disabled = !activeVoteAllowed || hasVoted;
                return (
                  <div key={idea} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-[var(--line)] px-3 py-2 text-sm">
                    <span className="leading-6">{idea}</span>
                    <span className="font-bold text-[#92620f]">{votes} 票</span>
                    <button
                      onClick={() => onVote(idea)}
                      disabled={disabled}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                        disabled
                          ? "bg-slate-100 text-slate-400"
                          : "border border-[#eed38e] bg-[#fff8e8] text-[#92620f] hover:bg-[#fff3d6]"
                      }`}
                    >
                      {hasVoted ? "已投" : activeVoteAllowed ? "投一票" : "不可投"}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>

        {coCreation.report && (
          <div className="rounded-lg border border-[#eed38e] bg-[#fff8e8] p-5">
            <div className="mb-3 flex items-center gap-2">
              <FileText size={18} className="text-[#92620f]" />
              <h3 className="font-bold">《共识报告》</h3>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-700">{coCreation.report}</pre>
          </div>
        )}

        {!!coCreation.archives?.length && (
          <div className="rounded-lg border border-[var(--line)] bg-white p-5">
            <h3 className="font-bold">已归档主题</h3>
            <div className="mt-4 space-y-3">
              {coCreation.archives.slice(0, 5).map((archive) => (
                <div key={archive.id} className="rounded-lg border border-[var(--line)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{archive.topic}</p>
                    <span className="rounded-md bg-[#fff8e8] px-2 py-1 text-xs font-semibold text-[#92620f]">{archive.ideas.length} 条有效观点</span>
                  </div>
                  <div className="mt-3 space-y-1">
                    {archive.ideas.slice(0, 3).map((idea) => (
                      <p key={idea} className="text-sm leading-6 text-[var(--muted)]">{idea}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function SupervisorPanel({
  knowledgeBase,
  plan,
  plansByStudent,
  studentOptions,
  selectedPlanStudent,
  onSelectPlanStudent,
  onCreatePlan,
  canGeneratePlan
}: {
  knowledgeBase: KnowledgeEntry[];
  plan: PersonalPlan | null;
  plansByStudent: PlansByStudent;
  studentOptions: string[];
  selectedPlanStudent: string;
  onSelectPlanStudent: (student: string) => void;
  onCreatePlan: (studentName?: string) => void;
  canGeneratePlan: boolean;
}) {
  return (
    <div className="grid grid-cols-[0.9fr_1.1fr] gap-5 max-xl:grid-cols-1">
      <div className="space-y-4">
        <section className="rounded-lg border border-[var(--line)] bg-white p-5">
          <p className="text-sm font-semibold text-[var(--teal)]">五环共创总教练 Agent</p>
          <h2 className="mt-2 text-2xl font-bold">统一调度与方案生成</h2>
          <div className="mt-5 space-y-3">
            {supervisorFunctions.map((item) => (
              <div key={item.title} className="rounded-lg border border-[var(--line)] p-4">
                <p className="font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => onCreatePlan(selectedPlanStudent)}
            disabled={!canGeneratePlan}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${
              canGeneratePlan ? "bg-[var(--teal)] text-white" : "bg-slate-100 text-slate-400"
            }`}
          >
            {canGeneratePlan ? <Sparkles size={16} /> : <Lock size={16} />}
            {canGeneratePlan ? "为选中学员生成《个性化方案建议报告》" : "当前角色不能生成方案"}
          </button>
        </section>
        <PlanTargetPanel
          plan={plan}
          plansByStudent={plansByStudent}
          studentOptions={studentOptions}
          selectedStudent={selectedPlanStudent}
          onSelectStudent={onSelectPlanStudent}
          onCreatePlan={onCreatePlan}
          canGeneratePlan={canGeneratePlan}
        />
      </div>

      <section className="rounded-lg border border-[var(--line)] bg-white p-5">
        <h3 className="font-bold">总知识库调用素材</h3>
        <div className="mt-4 space-y-3">
          {knowledgeBase.slice(0, 6).map((entry) => (
            <div key={entry.id} className="rounded-lg border border-[var(--line)] p-4">
              <p className="font-semibold">{entry.title}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{entry.source}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{entry.summary}</p>
            </div>
          ))}
        </div>
        {plan && <PlanCard plan={plan} />}
      </section>
    </div>
  );
}

function TransformationPanel({
  plan,
  draft,
  setDraft,
  attachments,
  setAttachments,
  onUploadImage,
  transformationItems,
  onSubmit,
  onLike,
  onCreatePlan,
  canSubmit,
  canLike,
  canGeneratePlan,
  role,
  plansByStudent,
  studentOptions,
  selectedPlanStudent,
  onSelectPlanStudent,
  onConfirmPlan
}: {
  plan: PersonalPlan | null;
  draft: { title: string; body: string };
  setDraft: (draft: { title: string; body: string }) => void;
  attachments: UploadedAsset[];
  setAttachments: (assets: UploadedAsset[]) => void;
  onUploadImage: (file: File) => void;
  transformationItems: LearningItem[];
  onSubmit: () => void;
  onLike: (id: string) => void;
  onCreatePlan: (studentName?: string) => void;
  canSubmit: boolean;
  canLike: boolean;
  canGeneratePlan: boolean;
  role: (typeof roleProfiles)[number];
  plansByStudent: PlansByStudent;
  studentOptions: string[];
  selectedPlanStudent: string;
  onSelectPlanStudent: (student: string) => void;
  onConfirmPlan: (studentName?: string) => void;
}) {
  const blueprint = submissionBlueprints.transformation;
  const delivery = deliveryByPhase.transformation;

  return (
    <div className="grid grid-cols-[0.85fr_1.15fr] gap-5 max-xl:grid-cols-1">
      <aside className="space-y-4">
        <section className="rounded-lg border border-[var(--line)] bg-white p-5">
          <p className="text-sm font-semibold text-[#a43f5a]">{role.id === "student" ? "我的转化任务" : "转化教练 Agent"}</p>
          <h2 className="mt-2 text-2xl font-bold">{role.id === "student" ? "我的行动计划与成果提交" : "训后行动计划与进展追踪"}</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {role.id === "student"
              ? "查看班主任下发的个人行动计划，按 D+30、D+90 节点准备成果物和转化案例。"
              : "接收总教练下发的“我的方案”，在 D+30、D+90 节点提醒学员提交成果，并对成果物做初步评估。"}
          </p>
          {role.id !== "student" && (
            <div className="mt-5">
              <PlanTargetSelector
                plansByStudent={plansByStudent}
                studentOptions={studentOptions}
                selectedStudent={selectedPlanStudent}
                onSelectStudent={onSelectPlanStudent}
              />
            </div>
          )}
          <button
            onClick={() => onCreatePlan(selectedPlanStudent)}
            disabled={!canGeneratePlan}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${
              canGeneratePlan ? "bg-[#b94a66] text-white" : "bg-slate-100 text-slate-400"
            }`}
          >
            {canGeneratePlan ? <TimerReset size={16} /> : <Lock size={16} />}
            {canGeneratePlan ? "为选中学员生成或刷新行动计划" : "等待班主任生成方案"}
          </button>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-white p-5">
          <p className="text-sm font-semibold text-[#a43f5a]">转化环交付说明</p>
          <h3 className="mt-2 text-xl font-bold">成果怎么才算可交付</h3>
          <div className="mt-4 space-y-3 text-sm">
            <DeliveryLine label="提交内容" value={typeByPhase.transformation} />
            <DeliveryLine label="证明材料" value={delivery.evidence} />
            <DeliveryLine label="交付给" value={delivery.receiver} />
            <DeliveryLine label="达标后" value={delivery.next} />
          </div>
        </section>
      </aside>

      <section className="space-y-4">
        {plan ? (
          <PlanCard plan={plan} onConfirm={() => onConfirmPlan(plan.student)} canConfirm={role.id === "student" && plan.status === "待确认"} />
        ) : (
          <EmptyPlan onCreatePlan={onCreatePlan} canGeneratePlan={canGeneratePlan} />
        )}

        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-3 max-md:block">
            <div>
              <h3 className="text-xl font-bold">提交转化成果</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{blueprint.outputHint}</p>
            </div>
            <div className="flex flex-wrap gap-2 max-md:mt-3">
              {blueprint.qualityChecks.map((check) => (
                <span key={check} className="rounded-md bg-[#fde9ef] px-2 py-1 text-xs font-semibold text-[#a43f5a]">
                  {check}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_0.8fr] gap-3 max-md:grid-cols-1">
            <label className="text-sm font-semibold">
              {blueprint.titleLabel}
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                disabled={!canSubmit}
                placeholder={blueprint.titlePlaceholder}
                className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2 font-normal outline-none focus:border-[#b94a66] disabled:bg-slate-50 disabled:text-slate-400"
              />
            </label>
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] p-3 text-sm">
              <p className="font-semibold">填写结构</p>
              <p className="mt-1 text-[var(--muted)]">应用场景、结果证据、改进计划</p>
            </div>
          </div>

          <label className="mt-4 block text-sm font-semibold">
            {blueprint.bodyLabel}
            <textarea
              value={draft.body}
              onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              rows={8}
              disabled={!canSubmit}
              placeholder={blueprint.bodyPlaceholder}
              className="mt-2 w-full resize-none rounded-lg border border-[var(--line)] px-3 py-2 font-normal leading-6 outline-none focus:border-[#b94a66] disabled:bg-slate-50 disabled:text-slate-400"
            />
          </label>
          <ImageUploadBox attachments={attachments} setAttachments={setAttachments} onUploadImage={onUploadImage} disabled={!canSubmit} />

          <div className="mt-4 grid grid-cols-3 gap-2 max-md:grid-cols-1">
            {blueprint.templateSections.map((section) => (
              <div key={section.label} className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm">
                <p className="font-semibold">{section.label}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{section.detail}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${
              canSubmit ? "bg-[#b94a66] text-white" : "bg-slate-100 text-slate-400"
            }`}
          >
            {canSubmit ? <Send size={16} /> : <Lock size={16} />}
            {canSubmit ? blueprint.submitLabel : "当前角色不能提交成果"}
          </button>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-white">
          <div className="border-b border-[var(--line)] px-5 py-4">
            <h3 className="font-bold">转化成果池</h3>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {transformationItems.map((item) => (
              <div key={item.id} className="p-4">
                <LearningItemCard item={item} onLike={onLike} canLike={canLike} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function KnowledgePanel({
  knowledgeBase,
  role,
  onUpdate,
  onDelete
}: {
  knowledgeBase: KnowledgeEntry[];
  role: (typeof roleProfiles)[number];
  onUpdate: (id: string, patch: Partial<KnowledgeEntry>) => void;
  onDelete: (id: string) => void;
}) {
  const [filter, setFilter] = useState<PhaseId | "all">("all");
  const [editingId, setEditingId] = useState("");
  const [editDraft, setEditDraft] = useState({ title: "", summary: "", tags: "" });
  const visibleKnowledge = role.id === "admin" ? knowledgeBase : knowledgeBase.filter((entry) => entry.status !== "hidden");
  const filtered = filter === "all" ? visibleKnowledge : visibleKnowledge.filter((entry) => entry.phase === filter);
  const tabs: Array<{ id: PhaseId | "all"; label: string; count: number }> = [
    { id: "all", label: "总知识库", count: visibleKnowledge.length },
    ...coachModules.map((module) => ({
      id: module.id,
      label: `${module.title}知识库`,
      count: visibleKnowledge.filter((entry) => entry.phase === module.id).length
    }))
  ];
  const canManage = role.id === "admin";

  function startEdit(entry: KnowledgeEntry) {
    setEditingId(entry.id);
    setEditDraft({ title: entry.title, summary: entry.summary, tags: entry.tags.join("、") });
  }

  return (
    <section className="rounded-lg border border-[var(--line)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
        <div>
          <h2 className="text-xl font-bold">{role.id === "admin" ? "全量知识库治理" : "五环智慧知识库"}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {role.id === "admin" ? "管理员可查看全量来源、标签和沉淀质量，用于系统治理。" : "所有条目都保留来源、标签和环节，供总教练生成方案时引用。"}
          </p>
        </div>
        <Database className="text-[var(--teal)]" size={22} />
      </div>
      <div className="flex flex-wrap gap-2 border-b border-[var(--line)] px-5 py-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              filter === tab.id
                ? "bg-[var(--teal)] text-white"
                : "border border-[var(--line)] bg-[var(--surface-strong)] text-slate-600 hover:border-[var(--teal)]"
            }`}
          >
            {tab.label} · {tab.count}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-[var(--surface-strong)] text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">条目</th>
              <th className="px-5 py-3">环节</th>
              <th className="px-5 py-3">类型</th>
              <th className="px-5 py-3">来源</th>
              <th className="px-5 py-3">标签</th>
              <th className="px-5 py-3">日期</th>
              {canManage && <th className="px-5 py-3">管理</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {filtered.map((entry) => {
              const phaseName = coachModules.find((module) => module.id === entry.phase)?.title || entry.phase;
              const editing = editingId === entry.id;
              return (
                <tr key={entry.id}>
                  <td className="px-5 py-4">
                    {editing ? (
                      <div className="space-y-2">
                        <input value={editDraft.title} onChange={(event) => setEditDraft({ ...editDraft, title: event.target.value })} className="w-full rounded-lg border border-[var(--line)] px-3 py-2 font-normal" />
                        <textarea value={editDraft.summary} onChange={(event) => setEditDraft({ ...editDraft, summary: event.target.value })} rows={3} className="w-full resize-none rounded-lg border border-[var(--line)] px-3 py-2 font-normal" />
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold">{entry.title}</p>
                        <p className="mt-1 max-w-lg text-[var(--muted)]">{entry.summary}</p>
                      </>
                    )}
                  </td>
                  <td className="px-5 py-4">{phaseName}</td>
                  <td className="px-5 py-4">{entry.type}</td>
                  <td className="px-5 py-4">{entry.source}</td>
                  <td className="px-5 py-4">
                    {editing ? (
                      <input value={editDraft.tags} onChange={(event) => setEditDraft({ ...editDraft, tags: event.target.value })} className="w-full rounded-lg border border-[var(--line)] px-3 py-2 font-normal" />
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map((tag) => (
                          <span key={tag} className="rounded-md bg-[var(--surface-strong)] px-2 py-1 text-xs">
                            {tag}
                          </span>
                        ))}
                        {entry.status === "hidden" && <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">已隐藏</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">{entry.createdAt}</td>
                  {canManage && (
                    <td className="px-5 py-4">
                      {editing ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              onUpdate(entry.id, {
                                title: editDraft.title,
                                summary: editDraft.summary,
                                tags: editDraft.tags.split(/[、,，]/).map((tag) => tag.trim()).filter(Boolean)
                              });
                              setEditingId("");
                            }}
                            className="rounded-md bg-[var(--teal)] px-2 py-1 text-xs font-semibold text-white"
                          >
                            保存
                          </button>
                          <button onClick={() => setEditingId("")} className="rounded-md border border-[var(--line)] px-2 py-1 text-xs font-semibold">取消</button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => startEdit(entry)} className="rounded-md border border-[var(--line)] px-2 py-1 text-xs font-semibold">编辑</button>
                          <button onClick={() => onUpdate(entry.id, { status: entry.status === "hidden" ? "active" : "hidden" })} className="rounded-md border border-[var(--line)] px-2 py-1 text-xs font-semibold">
                            {entry.status === "hidden" ? "恢复" : "隐藏"}
                          </button>
                          <button onClick={() => onDelete(entry.id)} className="rounded-md border border-[#f2c5bf] px-2 py-1 text-xs font-semibold text-[#bd5145]">删除</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {!filtered.length && (
              <tr>
                <td colSpan={canManage ? 7 : 6} className="px-5 py-10 text-center text-sm text-[var(--muted)]">该分库暂无条目，请先完成相应环节的提交与点赞达标。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ModelSettingsPanel({
  config,
  onSave,
  onTest
}: {
  config: ModelConfig;
  onSave: (config: ModelConfig) => void;
  onTest: (config: ModelConfig) => Promise<string>;
}) {
  const [draft, setDraft] = useState<ModelConfig>(config);
  const [testStatus, setTestStatus] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  const presets = [
    {
      name: "MiniMax",
      baseUrl: "https://api.minimax.io/v1",
      model: "MiniMax-M2.7"
    },
    {
      name: "OpenAI Compatible",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o-mini"
    },
    {
      name: "自定义",
      baseUrl: "https://your-provider.example/v1",
      model: "your-model-name"
    }
  ];

  return (
    <div className="grid grid-cols-[0.8fr_1.2fr] gap-5 max-xl:grid-cols-1">
      <section className="rounded-lg border border-[var(--line)] bg-white p-5">
        <p className="text-sm font-semibold text-[var(--teal)]">模型配置</p>
        <h2 className="mt-2 text-2xl font-bold">接入自定义审核模型</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          这里配置的是 OpenAI-compatible Chat Completions 接口。API Key 只保存在当前浏览器 localStorage，提交内容时随请求发送到本地服务端调用。
        </p>
        <div className="mt-5 space-y-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setDraft({ ...draft, enabled: true, providerName: preset.name, baseUrl: preset.baseUrl, model: preset.model })}
              className="flex w-full items-center justify-between rounded-lg border border-[var(--line)] px-4 py-3 text-left text-sm hover:border-[var(--teal)]"
            >
              <span>
                <span className="block font-semibold">{preset.name}</span>
                <span className="mt-1 block text-xs text-[var(--muted)]">{preset.baseUrl}</span>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-white p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold">当前调用配置</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">{draft.enabled ? "提交内容时优先调用此模型。" : "当前未启用自定义模型，将使用服务器默认 MiniMax 环境变量或本地审核。"}</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })}
              className="h-4 w-4 accent-[var(--teal)]"
            />
            启用
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <label className="text-sm font-semibold">
            供应商名称
            <input
              value={draft.providerName}
              onChange={(event) => setDraft({ ...draft, providerName: event.target.value })}
              className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2 font-normal outline-none focus:border-[var(--teal)]"
            />
          </label>
          <label className="text-sm font-semibold">
            模型名
            <input
              value={draft.model}
              onChange={(event) => setDraft({ ...draft, model: event.target.value })}
              className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2 font-normal outline-none focus:border-[var(--teal)]"
            />
          </label>
        </div>

        <label className="mt-4 block text-sm font-semibold">
          Base URL
          <input
            value={draft.baseUrl}
            onChange={(event) => setDraft({ ...draft, baseUrl: event.target.value })}
            placeholder="https://api.example.com/v1"
            className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2 font-normal outline-none focus:border-[var(--teal)]"
          />
        </label>

        <label className="mt-4 block text-sm font-semibold">
          API Key
          <input
            type="password"
            value={draft.apiKey}
            onChange={(event) => setDraft({ ...draft, apiKey: event.target.value })}
            placeholder="在此输入你的模型访问密钥"
            className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2 font-normal outline-none focus:border-[var(--teal)]"
          />
        </label>

        <div className="mt-5 rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] p-4 text-sm leading-6 text-slate-600">
          调用路径：前端提交内容 → 本地 API `{appBasePath || ""}/api/items` → `{draft.baseUrl || "Base URL"}/chat/completions` → 返回质量等级、标签和摘要。
        </div>

        <div className="mt-5 flex gap-3 max-md:block">
          <button onClick={() => onSave(draft)} className="flex items-center gap-2 rounded-lg bg-[var(--teal)] px-4 py-2.5 text-sm font-semibold text-white max-md:w-full max-md:justify-center">
            <Check size={16} />
            保存配置
          </button>
          <button
            onClick={async () => {
              setTesting(true);
              setTestStatus("");
              try {
                setTestStatus(await onTest(draft));
              } catch (error) {
                setTestStatus(error instanceof Error ? error.message : "模型连接失败。");
              } finally {
                setTesting(false);
              }
            }}
            disabled={testing}
            className="flex items-center gap-2 rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm font-semibold max-md:mt-3 max-md:w-full max-md:justify-center"
          >
            <FlaskConical size={16} />
            {testing ? "测试中" : "测试连接"}
          </button>
          <button
            onClick={() => onSave({ ...draft, enabled: false })}
            className="rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm font-semibold max-md:mt-3 max-md:w-full"
          >
            关闭自定义模型
          </button>
        </div>
        {testStatus && <p className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-slate-700">{testStatus}</p>}
      </section>
    </div>
  );
}

function RoleCard({ role, account }: { role: (typeof roleProfiles)[number]; account: DemoAccount }) {
  return (
    <div className="mt-4 rounded-lg border border-[var(--line)] bg-white p-4 max-lg:hidden">
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} className="text-[var(--teal)]" />
        <p className="text-sm font-bold">账号权限</p>
      </div>
      <p className="mt-2 text-sm font-semibold">{account.name} · {role.name}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{account.title}，账号：{account.username}，小组：{account.groupName || "全班"}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {role.allowed.slice(0, 5).map((permission) => (
          <span key={permission} className="rounded-md bg-[var(--surface-strong)] px-2 py-1 text-xs text-slate-600">
            {permissionLabels[permission]}
          </span>
        ))}
      </div>
    </div>
  );
}

function PermissionMatrix({ role }: { role: (typeof roleProfiles)[number] }) {
  const importantPermissions: PermissionKey[] = [
    "submitLearningContent",
    "likeContent",
    "submitCoCreationIdeas",
    "runCoCreation",
    "generatePlan",
    "trackTransformation",
    "viewKnowledgeBase",
    "configureModel",
    "managePermissions"
  ];

  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">权限矩阵</h2>
        <span className="rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-700">{role.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 max-md:grid-cols-1">
        {importantPermissions.map((permission) => {
          const allowed = role.allowed.includes(permission);
          return (
            <div key={permission} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${allowed ? "border-teal-200 bg-teal-50" : "border-[var(--line)] bg-slate-50 text-slate-400"}`}>
              <span>{permissionLabels[permission]}</span>
              {allowed ? <Check size={15} className="text-[var(--teal)]" /> : <Lock size={15} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlanCard({ plan, onConfirm, canConfirm = false }: { plan: PersonalPlan; onConfirm?: () => void; canConfirm?: boolean }) {
  const dueCheckpoints = getDueCheckpoints(plan);
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#a43f5a]">{plan.student} · 我的方案</p>
          <h3 className="mt-2 text-xl font-bold">《个人行动计划》</h3>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-lg bg-[#fde9ef] px-3 py-1.5 text-sm font-semibold text-[#a43f5a]">{plan.status}</span>
          {canConfirm && (
            <button onClick={onConfirm} className="flex items-center gap-2 rounded-lg bg-[#b94a66] px-3 py-1.5 text-sm font-semibold text-white">
              <CheckCircle2 size={15} />
              确认方案
            </button>
          )}
        </div>
      </div>
      {!!dueCheckpoints.length && (
        <div className="mt-4 rounded-lg border border-[#f2bdcd] bg-[#fde9ef] px-3 py-2 text-sm font-semibold text-[#a43f5a]">
          {dueCheckpoints.map((checkpoint) => `${checkpoint.day} ${checkpoint.label}`).join("、")} 已到期，请提交转化成果。
        </div>
      )}
      <p className="mt-4 text-sm leading-7 text-slate-700">{plan.recommendation}</p>
      <div className="mt-5 grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <div className="rounded-lg border border-[var(--line)] p-4">
          <p className="font-semibold">行动步骤</p>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-[var(--muted)]">
            {plan.actions.map((action, index) => (
              <li key={action}>{index + 1}. {action}</li>
            ))}
          </ol>
        </div>
        <div className="rounded-lg border border-[var(--line)] p-4">
          <p className="font-semibold">追踪节点</p>
          <div className="mt-3 space-y-2">
            {plan.checkpoints.map((checkpoint) => (
              <div key={checkpoint.day} className="rounded-lg bg-[var(--surface-strong)] px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span>{checkpoint.day} · {checkpoint.label}</span>
                  <span className="font-semibold text-[#a43f5a]">{checkpoint.status}</span>
                </div>
                {checkpoint.date && (
                  <p className="mt-1 text-xs text-[var(--muted)]">预计节点：{checkpoint.date}{checkpoint.evidenceItemId ? " · 成果已提交" : ""}</p>
                )}
              </div>
            ))}
          </div>
          {plan.generatedAt && <p className="mt-2 text-xs text-[var(--muted)]">方案生成时间：{plan.generatedAt}</p>}
          {plan.confirmedAt && <p className="mt-1 text-xs text-[var(--muted)]">学员确认时间：{plan.confirmedAt}</p>}
          <p className="mt-4 text-sm font-semibold">引用案例</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{plan.citedCases.join("、") || "等待更多知识库素材"}</p>
          {!!plan.sourceNotes?.length && <p className="mt-2 text-xs leading-5 text-[var(--muted)]">来源：{plan.sourceNotes.join("；")}</p>}
        </div>
      </div>
    </div>
  );
}

function EmptyPlan({ onCreatePlan, canGeneratePlan }: { onCreatePlan: () => void; canGeneratePlan: boolean }) {
  return (
    <div className="grid min-h-[360px] place-items-center rounded-lg border border-dashed border-[var(--line)] bg-white p-8 text-center">
      <div>
        <Sparkles className="mx-auto text-[#a43f5a]" size={28} />
        <h3 className="mt-4 text-xl font-bold">还没有个人行动计划</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">点击生成后，总教练会调用知识库素材，转化教练会接管训后节点提醒。</p>
        <button
          onClick={onCreatePlan}
          disabled={!canGeneratePlan}
          className={`mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${
            canGeneratePlan ? "bg-[#b94a66] text-white" : "bg-slate-100 text-slate-400"
          }`}
        >
          {canGeneratePlan ? <Plus size={16} /> : <Lock size={16} />}
          {canGeneratePlan ? "生成行动计划" : "暂无生成权限"}
        </button>
      </div>
    </div>
  );
}

function PermissionButton({
  permission,
  allowed,
  onClick,
  className,
  children
}: {
  permission: PermissionKey;
  allowed: boolean;
  onClick: () => void;
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!allowed}
      title={allowed ? "" : `暂无${permissionLabels[permission]}权限`}
      className={`mt-0 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm max-md:mt-0 ${
        allowed ? className : "bg-slate-100 text-slate-400"
      }`}
    >
      {allowed ? children : <><Lock size={16} /> 无生成权限</>}
    </button>
  );
}

function getRatio(part: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(1, part / total));
}

function getPercentNumber(part: number, total: number) {
  return Math.round(getRatio(part, total) * 100);
}

function formatPercent(part: number, total: number) {
  return `${getPercentNumber(part, total)}%`;
}

function getDateValue(value?: string) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function isDueDate(value?: string) {
  const time = getDateValue(value);
  if (!time) return false;
  return time <= Date.now();
}

function formatShortDate(value?: string) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getPhaseTitle(phase: PhaseId) {
  return coachModules.find((module) => module.id === phase)?.title || phase;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
