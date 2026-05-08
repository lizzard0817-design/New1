import {
  BookOpenCheck,
  Brain,
  ClipboardCheck,
  Database,
  GitBranch,
  GraduationCap,
  LucideIcon,
  MessageSquareText,
  Rocket,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";

export type PhaseId =
  | "deep-study"
  | "practice"
  | "reflection"
  | "co-creation"
  | "transformation";

export type ContentType =
  | "批注"
  | "即时贴"
  | "问答"
  | "反思案例"
  | "观点"
  | "共识报告"
  | "转化案例";

export type RoleId = "admin" | "teacher" | "student";

export type PermissionKey =
  | "viewDashboard"
  | "viewSupervisor"
  | "viewLearningWorkflows"
  | "submitLearningContent"
  | "likeContent"
  | "submitCoCreationIdeas"
  | "runCoCreation"
  | "generatePlan"
  | "trackTransformation"
  | "viewKnowledgeBase"
  | "configureModel"
  | "managePermissions";

export type RoleProfile = {
  id: RoleId;
  name: string;
  description: string;
  allowed: PermissionKey[];
};

export type DemoAccount = {
  id: string;
  username: string;
  password: string;
  name: string;
  role: RoleId;
  className: string;
  title: string;
};

export type ModelConfig = {
  enabled: boolean;
  providerName: string;
  baseUrl: string;
  model: string;
  apiKey: string;
};

export type KnowledgeEntry = {
  id: string;
  phase: PhaseId;
  type: ContentType;
  title: string;
  summary: string;
  source: string;
  tags: string[];
  createdAt: string;
};

export type UploadedAsset = {
  url: string;
  name: string;
  mimeType: string;
  size: number;
};

export type LearningItem = {
  id: string;
  phase: PhaseId;
  type: ContentType;
  title: string;
  body: string;
  author: string;
  likes: number;
  threshold: number;
  quality: "待补充" | "合规" | "优秀";
  tags: string[];
  attachments?: UploadedAsset[];
  aiSummary?: string;
  reviewSource?: "local" | "minimax" | "custom";
  inKnowledgeBase: boolean;
};

type ReviewSnapshot = Pick<LearningItem, "quality" | "tags">;

export type CoachModule = {
  id: PhaseId;
  title: string;
  coach: string;
  icon: LucideIcon;
  tone: "teal" | "coral" | "violet" | "amber" | "rose";
  purpose: string;
  does: string[];
  input: string;
  output: string;
  successRule: string;
};

export type DeliveryStep = {
  title: string;
  actor: RoleId;
  goal: string;
  deliverable: string;
  receiver: string;
  view: ViewId;
};

export type CoCreationState = {
  topic: string;
  round: number;
  maxRounds: number;
  ideas: string[];
  categories: Record<string, string[]>;
  votes: Record<string, number>;
  converged: boolean;
  report: string;
};

export type PersonalPlan = {
  student: string;
  recommendation: string;
  actions: string[];
  checkpoints: Array<{
    label: string;
    day: string;
    status: "待提醒" | "待提交" | "已评估";
  }>;
  citedCases: string[];
};

export const participantCount = 9;
export const likeThreshold = Math.ceil(participantCount / 3);

export const coachModules: CoachModule[] = [
  {
    id: "deep-study",
    title: "深学环",
    coach: "深学教练 Agent",
    icon: BookOpenCheck,
    tone: "teal",
    purpose: "把课程学习从被动阅读变成主动批注和课堂改进方法提炼。",
    does: ["引导学员提交批注", "判断批注是否合规", "按 1/3 点赞阈值筛选优秀批注", "把优秀批注沉淀到深学知识库"],
    input: "学习批注",
    output: "优秀批注",
    successRule: "能说清看到了什么、为什么重要、准备如何迁移。"
  },
  {
    id: "practice",
    title: "跟练环",
    coach: "跟练教练 Agent",
    icon: ClipboardCheck,
    tone: "coral",
    purpose: "把实训现场的关键发现及时记录成可复用技能证据。",
    does: ["收集照片和说明", "识别关键发现与技能要点", "过滤无效即时贴", "把优秀即时贴沉淀到跟练知识库"],
    input: "照片 + 说明",
    output: "优秀即时贴",
    successRule: "能还原现场问题、处理动作和下次复用方法。"
  },
  {
    id: "reflection",
    title: "反思环",
    coach: "反思教练 Agent",
    icon: Brain,
    tone: "violet",
    purpose: "用 GROW 模型把问答和案例写作变成结构化深度反思。",
    does: ["校验问题质量", "校验答案深度", "提供反思案例模板", "把优秀问答和案例沉淀到反思知识库"],
    input: "问答内容、反思案例",
    output: "优秀问答、反思案例",
    successRule: "围绕目标、现状、选择和下一步行动组织表达。"
  },
  {
    id: "co-creation",
    title: "共创环",
    coach: "共创教练 Agent",
    icon: GitBranch,
    tone: "amber",
    purpose: "把分散观点收敛成可投票、可执行、可入库的群体共识。",
    does: ["自动收集和打标观点", "语义去重与合并", "动态分类并生成投票卡片", "新增观点少于等于 3 条时智能终止", "生成《共识报告》"],
    input: "共创主题、分组、学员观点",
    output: "观点分类汇总、《共识报告》",
    successRule: "多轮后新增观点下降，高票观点能转成行动建议。"
  },
  {
    id: "transformation",
    title: "转化环",
    coach: "转化教练 Agent",
    icon: Rocket,
    tone: "rose",
    purpose: "把个性化方案变成训后行动计划，并追踪真实成果。",
    does: ["接收总教练下发的我的方案", "生成个人行动计划", "在 D+30、D+90 自动提醒", "初评成果物和转化案例", "把成功案例反哺转化知识库"],
    input: "我的方案、成果物、转化案例",
    output: "个人行动计划、转化案例",
    successRule: "成果物能证明方案被真实应用，并可作为下一期案例素材。"
  }
];

export const navItems = [
  { id: "dashboard", label: "仪表盘", icon: GraduationCap },
  { id: "coach", label: "总教练", icon: Sparkles },
  { id: "deep-study", label: "深学环", icon: BookOpenCheck },
  { id: "practice", label: "跟练环", icon: ClipboardCheck },
  { id: "reflection", label: "反思环", icon: MessageSquareText },
  { id: "co-creation", label: "共创环", icon: GitBranch },
  { id: "transformation", label: "转化环", icon: Rocket },
  { id: "knowledge", label: "知识库", icon: Database },
  { id: "model-settings", label: "模型配置", icon: SlidersHorizontal }
] as const;

export type ViewId = (typeof navItems)[number]["id"];

export const deliveryFlows: Record<RoleId, DeliveryStep[]> = {
  student: [
    {
      title: "完成学习证据",
      actor: "student",
      goal: "围绕课程、实训和反思提交一条高质量学习产出。",
      deliverable: "批注 / 即时贴 / 反思案例",
      receiver: "班主任与同学",
      view: "deep-study"
    },
    {
      title: "参与班级共创",
      actor: "student",
      goal: "提交可被讨论、去重、投票的观点。",
      deliverable: "共创观点",
      receiver: "共创教练 Agent",
      view: "co-creation"
    },
    {
      title: "接收个人方案",
      actor: "student",
      goal: "查看总教练生成并下发的个人行动计划。",
      deliverable: "我的方案 / 行动计划",
      receiver: "学员本人",
      view: "transformation"
    },
    {
      title: "回传转化成果",
      actor: "student",
      goal: "在训后节点提交真实应用证据。",
      deliverable: "转化成果 / 转化案例",
      receiver: "转化知识库",
      view: "transformation"
    }
  ],
  teacher: [
    {
      title: "收齐班级产出",
      actor: "teacher",
      goal: "检查学员提交、AI 初审和互动数据。",
      deliverable: "班级内容池",
      receiver: "班主任",
      view: "deep-study"
    },
    {
      title: "沉淀优秀素材",
      actor: "teacher",
      goal: "推动点赞达标内容进入知识库。",
      deliverable: "优秀批注 / 即时贴 / 问答",
      receiver: "五环知识库",
      view: "knowledge"
    },
    {
      title: "完成群体共识",
      actor: "teacher",
      goal: "运行观点收敛、投票统计和报告生成。",
      deliverable: "《共识报告》",
      receiver: "全班学员",
      view: "co-creation"
    },
    {
      title: "交付训后方案",
      actor: "teacher",
      goal: "调用总知识库生成个性化方案并跟踪转化。",
      deliverable: "方案建议报告 / 追踪清单",
      receiver: "学员与转化教练",
      view: "coach"
    }
  ],
  admin: [
    {
      title: "配置进入规则",
      actor: "admin",
      goal: "确认账号、角色、导航和操作权限。",
      deliverable: "账号权限清单",
      receiver: "系统运营方",
      view: "dashboard"
    },
    {
      title: "监控模块运行",
      actor: "admin",
      goal: "查看五个教练模块提交量、入库率和异常状态。",
      deliverable: "模块运行看板",
      receiver: "管理员",
      view: "dashboard"
    },
    {
      title: "治理知识资产",
      actor: "admin",
      goal: "检查来源、标签、入库质量和复用价值。",
      deliverable: "结构化知识库",
      receiver: "总教练 Agent",
      view: "knowledge"
    },
    {
      title: "维护模型能力",
      actor: "admin",
      goal: "配置可用模型，保障审核和生成链路可用。",
      deliverable: "模型调用配置",
      receiver: "全系统",
      view: "model-settings"
    }
  ]
};

export const roleProfiles: RoleProfile[] = [
  {
    id: "admin",
    name: "管理员",
    description: "配置系统、查看全量数据、管理角色权限和所有智能体工作流。",
    allowed: [
      "viewDashboard",
      "viewSupervisor",
      "viewLearningWorkflows",
      "submitLearningContent",
      "likeContent",
      "submitCoCreationIdeas",
      "runCoCreation",
      "generatePlan",
      "trackTransformation",
      "viewKnowledgeBase",
      "configureModel",
      "managePermissions"
    ]
  },
  {
    id: "teacher",
    name: "班主任",
    description: "运营班级流程，发起共创、生成方案、追踪转化和查看知识库。",
    allowed: [
      "viewDashboard",
      "viewSupervisor",
      "viewLearningWorkflows",
      "likeContent",
      "submitCoCreationIdeas",
      "runCoCreation",
      "generatePlan",
      "trackTransformation",
      "viewKnowledgeBase",
      "configureModel"
    ]
  },
  {
    id: "student",
    name: "学员",
    description: "提交学习产出、参与点赞和查看自己的行动计划，不管理班级工作流。",
    allowed: ["viewDashboard", "viewLearningWorkflows", "submitLearningContent", "likeContent", "submitCoCreationIdeas", "trackTransformation", "configureModel"]
  }
];

export const demoAccounts: DemoAccount[] = [
  {
    id: "account-admin",
    username: "admin",
    password: "admin123",
    name: "系统管理员",
    role: "admin",
    className: "平台管理组",
    title: "系统配置与权限治理"
  },
  {
    id: "account-teacher",
    username: "teacher",
    password: "teacher123",
    name: "周老师",
    role: "teacher",
    className: "青年教师研修一班",
    title: "班级运营负责人"
  },
  {
    id: "account-student",
    username: "student",
    password: "student123",
    name: "李同学",
    role: "student",
    className: "青年教师研修一班",
    title: "参训学员"
  },
  {
    id: "account-student-wang",
    username: "student2",
    password: "student123",
    name: "王同学",
    role: "student",
    className: "青年教师研修一班",
    title: "参训学员"
  },
  {
    id: "account-student-chen",
    username: "student3",
    password: "student123",
    name: "陈同学",
    role: "student",
    className: "青年教师研修一班",
    title: "参训学员"
  }
];

export const permissionLabels: Record<PermissionKey, string> = {
  viewDashboard: "查看仪表盘",
  viewSupervisor: "访问总教练",
  viewLearningWorkflows: "查看五环学习流程",
  submitLearningContent: "提交批注/即时贴/反思",
  likeContent: "点赞互动",
  submitCoCreationIdeas: "提交共创观点",
  runCoCreation: "运行共创收敛",
  generatePlan: "生成个性化方案",
  trackTransformation: "查看转化追踪",
  viewKnowledgeBase: "查看全量知识库",
  configureModel: "配置调用模型",
  managePermissions: "管理角色权限"
};

export function can(role: RoleId, permission: PermissionKey) {
  return roleProfiles.find((item) => item.id === role)?.allowed.includes(permission) || false;
}

export function viewPermission(view: ViewId): PermissionKey {
  if (view === "dashboard") return "viewDashboard";
  if (view === "coach") return "viewSupervisor";
  if (view === "co-creation") return "viewLearningWorkflows";
  if (view === "transformation") return "trackTransformation";
  if (view === "knowledge") return "viewKnowledgeBase";
  if (view === "model-settings") return "configureModel";
  return "viewLearningWorkflows";
}

const tagRules: Array<[string, string[]]> = [
  ["教学设计", ["教学", "提问", "课堂", "导入", "活动"]],
  ["课堂观察", ["观察", "发现", "现象", "问题"]],
  ["实训技能", ["操作", "实训", "步骤", "技能", "照片"]],
  ["结构化反思", ["目标", "现状", "选择", "下一步", "反思"]],
  ["群体共创", ["共创", "观点", "投票", "共识"]],
  ["行动转化", ["行动", "计划", "应用", "成果", "转化"]]
];

export function reviewLearningItem(input: Pick<LearningItem, "title" | "body" | "phase">): ReviewSnapshot {
  const text = `${input.title} ${input.body}`;
  const tags = tagRules.filter(([, words]) => words.some((word) => text.includes(word))).map(([tag]) => tag);
  const quality: LearningItem["quality"] = text.length >= 85 ? "优秀" : text.length >= 28 ? "合规" : "待补充";
  return {
    quality,
    tags: tags.length ? tags : [fallbackTag(input.phase)]
  };
}

export function createLearningItem(input: {
  phase: PhaseId;
  type: ContentType;
  title: string;
  body: string;
  author?: string;
  attachments?: UploadedAsset[];
}): LearningItem {
  const reviewed = reviewLearningItem(input);
  return {
    id: `item-${Date.now()}`,
    phase: input.phase,
    type: input.type,
    title: input.title,
    body: input.body,
    author: input.author || "李同学",
    likes: 0,
    threshold: likeThreshold,
    quality: reviewed.quality,
    tags: reviewed.tags,
    attachments: input.attachments || [],
    reviewSource: "local",
    inKnowledgeBase: false
  };
}

export function shouldEnterKnowledgeBase(item: LearningItem) {
  return item.quality !== "待补充" && item.likes >= item.threshold;
}

export function toKnowledgeEntry(item: LearningItem): KnowledgeEntry {
  return {
    id: `kb-${item.id}`,
    phase: item.phase,
    type: item.type,
    title: item.title,
    summary: item.body.length > 96 ? `${item.body.slice(0, 96)}...` : item.body,
    source: `${item.author} · ${item.type}`,
    tags: item.tags,
    createdAt: new Date().toISOString().slice(0, 10)
  };
}

export function categorizeIdeas(ideas: string[]) {
  const categories: Record<string, string[]> = {
    学员支持: [],
    教学方法: [],
    实训设计: [],
    评价反馈: [],
    转化落地: []
  };

  for (const idea of ideas) {
    if (/提醒|辅导|答疑|支持|陪跑/.test(idea)) categories["学员支持"].push(idea);
    else if (/实训|练习|任务|操作|模板/.test(idea)) categories["实训设计"].push(idea);
    else if (/评价|反馈|互评|评分|复盘/.test(idea)) categories["评价反馈"].push(idea);
    else if (/转化|行动|成果|应用|案例/.test(idea)) categories["转化落地"].push(idea);
    else categories["教学方法"].push(idea);
  }

  return Object.fromEntries(Object.entries(categories).filter(([, list]) => list.length > 0));
}

export function mergeNewIdeas(existing: string[], incoming: string[]) {
  const normalized = new Set(existing.map(normalizeIdea));
  const accepted: string[] = [];

  for (const idea of incoming.map((item) => item.trim()).filter(Boolean)) {
    const key = normalizeIdea(idea);
    if (!normalized.has(key)) {
      normalized.add(key);
      accepted.push(idea);
    }
  }

  return accepted;
}

export function generateConsensusReport(state: CoCreationState) {
  const ranked = Object.entries(state.votes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const categoryText = Object.entries(state.categories)
    .map(([category, ideas]) => `${category}：${ideas.slice(0, 3).join("；")}`)
    .join(" / ");

  return [
    `共创主题：${state.topic}`,
    `核心共识：${ranked.map(([idea, votes]) => `${idea}（${votes}票）`).join("；")}`,
    `分类洞察：${categoryText}`,
    "行动建议：由班主任将前 2 条高票观点纳入班级行动计划，并交给转化教练在 D+30、D+90 节点追踪。"
  ].join("\n");
}

export function generatePersonalPlan(knowledgeBase: KnowledgeEntry[], student = "李同学"): PersonalPlan {
  const citedCases = knowledgeBase
    .filter((entry) => entry.phase === "co-creation" || entry.phase === "transformation" || entry.phase === "reflection")
    .slice(-3)
    .map((entry) => entry.title);

  return {
    student,
    recommendation: `建议 ${student} 围绕“提升课堂提问质量和学生参与度”形成小步行动方案，先选定一节真实课作为转化场景，再复用深学、跟练、反思和共创知识库中的方法素材。`,
    actions: [
      "选择一节 2 周内可实施的真实课作为转化场景。",
      "引用 1 条优秀批注、1 条即时贴和 1 个反思案例完善课堂设计。",
      "在课堂中收集学生发言记录、观察量表和改进证据。",
      "D+30 提交初步成果，D+90 形成完整转化案例。"
    ],
    checkpoints: [
      { label: "训后 1 个月提醒", day: "D+30", status: "待提交" },
      { label: "训后 3 个月追踪", day: "D+90", status: "待提醒" }
    ],
    citedCases
  };
}

export const initialItems: LearningItem[] = [
  {
    id: "annotation-001",
    phase: "deep-study",
    type: "批注",
    title: "课堂提问链观察批注",
    body: "我发现优秀课堂会先用事实性问题帮助学生进入情境，再用解释性问题推动学生说出理由，最后用迁移性问题引导学生联系自己的经验。这种提问链能避免课堂只停留在抢答层面。",
    author: "李同学",
    likes: 3,
    threshold: likeThreshold,
    quality: "优秀",
    tags: ["教学设计", "课堂观察"],
    inKnowledgeBase: true
  },
  {
    id: "sticky-001",
    phase: "practice",
    type: "即时贴",
    title: "小组讨论即时贴",
    body: "照片记录了第三组讨论时只有组长发言，其他成员沉默。跟练后发现任务卡没有分配角色，导致学生不知道自己负责什么。下次可加入记录员、汇报员、质询员三类角色。",
    author: "王同学",
    likes: 3,
    threshold: likeThreshold,
    quality: "优秀",
    tags: ["实训技能", "课堂观察"],
    inKnowledgeBase: true
  },
  {
    id: "reflection-001",
    phase: "reflection",
    type: "反思案例",
    title: "GROW 反思案例：学生讨论参与不均衡",
    body: "目标是让每个小组成员都能参与讨论。现状是部分学生等待组长给答案，发言集中在少数人身上。选择包括角色分工、发言计时和同伴追问。下一步会在任务卡中明确每个角色的产出。",
    author: "李同学",
    likes: 3,
    threshold: likeThreshold,
    quality: "优秀",
    tags: ["结构化反思", "行动转化"],
    inKnowledgeBase: true
  },
  {
    id: "case-001",
    phase: "transformation",
    type: "转化案例",
    title: "训后 1 个月课堂转化案例",
    body: "我把培训中的提问链模板用于一节项目导入课，先设计事实性问题，再设计解释性问题和迁移性问题。一个月后，学生回答更愿意说明理由，小组汇报也更聚焦。",
    author: "李同学",
    likes: 3,
    threshold: likeThreshold,
    quality: "优秀",
    tags: ["行动转化", "成功经验"],
    inKnowledgeBase: true
  }
];

export const initialKnowledgeBase: KnowledgeEntry[] = initialItems.map(toKnowledgeEntry);

export const initialCoCreation: CoCreationState = {
  topic: "如何提升培训成果转化率",
  round: 1,
  maxRounds: 3,
  ideas: ["设置训后 1 个月提醒", "建立课堂观察模板", "增加同伴互评反馈", "将优秀转化案例纳入下期素材"],
  categories: categorizeIdeas(["设置训后 1 个月提醒", "建立课堂观察模板", "增加同伴互评反馈", "将优秀转化案例纳入下期素材"]),
  votes: {
    "设置训后 1 个月提醒": 6,
    "建立课堂观察模板": 5,
    "增加同伴互评反馈": 4,
    "将优秀转化案例纳入下期素材": 7
  },
  converged: false,
  report: ""
};

export const supervisorFunctions = [
  {
    title: "统一入口",
    body: "接收培训需求、学习记录和各环节产出，决定交给哪个专业教练处理。"
  },
  {
    title: "方案生成",
    body: "调用总知识库，把优秀案例作为底层素材，生成《个性化方案建议报告》。"
  },
  {
    title: "知识沉淀",
    body: "把点赞达标且合规的批注、即时贴、问答、案例和共识报告结构化入库。"
  },
  {
    title: "训后调度",
    body: "把学员确认后的“我的方案”交给转化教练，持续追踪 D+30、D+90 节点。"
  }
];

function fallbackTag(phase: PhaseId) {
  const module = coachModules.find((item) => item.id === phase);
  return module?.title || "学习记录";
}

function normalizeIdea(value: string) {
  return value.replace(/[，。,.、\s]/g, "").slice(0, 24);
}
