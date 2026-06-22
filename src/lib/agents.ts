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
  groupName: string;
  title: string;
  active?: boolean;
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
  originalItemId?: string;
  phase: PhaseId;
  type: ContentType;
  title: string;
  summary: string;
  source: string;
  tags: string[];
  createdAt: string;
  status?: "active" | "hidden";
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
  submitterId?: string;
  submitterRole?: RoleId;
  createdAt?: string;
  updatedAt?: string;
  likes: number;
  threshold: number;
  quality: "待补充" | "合规" | "优秀";
  tags: string[];
  attachments?: UploadedAsset[];
  aiSummary?: string;
  reviewSource?: "local" | "minimax" | "custom";
  isExcellent?: boolean;
  inKnowledgeBase: boolean;
  voters?: string[];
};

type ReviewSnapshot = Pick<LearningItem, "quality" | "tags" | "aiSummary">;

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
  groups: string[];
  ideas: string[];
  ideaGroups?: Record<string, string>;
  hiddenIdeas?: string[];
  categories: Record<string, string[]>;
  votes: Record<string, number>;
  groupVotes?: Record<string, Record<string, number>>;
  voters?: Record<string, string[]>;
  converged: boolean;
  report: string;
  archives?: CoCreationArchive[];
};

export type CoCreationArchive = {
  id: string;
  topic: string;
  createdAt: string;
  ideas: string[];
  hiddenIdeas: string[];
  categories: Record<string, string[]>;
  votes: Record<string, number>;
  groupVotes: Record<string, Record<string, number>>;
  report: string;
};

export type PersonalPlan = {
  student: string;
  status: "待确认" | "已确认";
  recommendation: string;
  actions: string[];
  checkpoints: Array<{
    label: string;
    day: string;
    date?: string;
    status: "待提醒" | "待提交" | "已评估";
    evidenceItemId?: string;
  }>;
  generatedAt?: string;
  confirmedAt?: string;
  sourceNotes?: string[];
  citedCases: string[];
};

export const participantCount = 9;
export const likeThreshold = Math.ceil(participantCount / 3);

export type SubmissionBlueprint = {
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
};

export const submissionBlueprints: Record<PhaseId, SubmissionBlueprint> = {
  "deep-study": {
    titleLabel: "批注标题",
    bodyLabel: "学习批注",
    titlePlaceholder: "例如：课堂提问链观察",
    bodyPlaceholder: "按「我看到什么、我理解什么、我准备怎么迁移」来写。",
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
    bodyPlaceholder: "按「照片内容、现场发现、操作经验、下次复用」来写。",
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
    bodyPlaceholder: "按「应用场景、采取动作、结果证据、下一步改进」来写。",
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

export function defaultDraftForPhase(phase: PhaseId) {
  const blueprint = submissionBlueprints[phase];
  return {
    title: blueprint.defaultTitle,
    body: blueprint.defaultBody
  };
}

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
    allowed: [
      "viewDashboard",
      "viewLearningWorkflows",
      "submitLearningContent",
      "likeContent",
      "submitCoCreationIdeas",
      "trackTransformation",
      "viewKnowledgeBase",
      "configureModel"
    ]
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
    groupName: "系统治理组",
    title: "系统配置与权限治理",
    active: true
  },
  {
    id: "account-teacher",
    username: "teacher",
    password: "teacher123",
    name: "周老师",
    role: "teacher",
    className: "青年教师研修一班",
    groupName: "班主任组",
    title: "班级运营负责人",
    active: true
  },
  {
    id: "account-student",
    username: "student",
    password: "student123",
    name: "李同学",
    role: "student",
    className: "青年教师研修一班",
    groupName: "第一小组",
    title: "参训学员",
    active: true
  },
  {
    id: "account-student-wang",
    username: "student2",
    password: "student123",
    name: "王同学",
    role: "student",
    className: "青年教师研修一班",
    groupName: "第二小组",
    title: "参训学员",
    active: true
  },
  {
    id: "account-student-chen",
    username: "student3",
    password: "student123",
    name: "陈同学",
    role: "student",
    className: "青年教师研修一班",
    groupName: "第三小组",
    title: "参训学员",
    active: true
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

const phaseReviewRules: Record<
  PhaseId,
  {
    compliant: number;
    excellent: number;
    checks: Array<{ tag: string; pattern: RegExp }>;
  }
> = {
  "deep-study": {
    compliant: 2,
    excellent: 3,
    checks: [
      { tag: "具体观察", pattern: /看到|观察|发现|现象|记录|我发现/ },
      { tag: "个人理解", pattern: /理解|重要|因为|价值|启发|意味着/ },
      { tag: "迁移动作", pattern: /迁移|行动|下次|准备|应用|尝试|调整/ }
    ]
  },
  practice: {
    compliant: 2,
    excellent: 3,
    checks: [
      { tag: "现场证据", pattern: /照片|现场|记录|场景|小组|实训/ },
      { tag: "技能发现", pattern: /发现|问题|变化|技能|要点|经验/ },
      { tag: "复用方法", pattern: /复用|下次|操作|步骤|方法|任务卡|角色/ }
    ]
  },
  reflection: {
    compliant: 3,
    excellent: 4,
    checks: [
      { tag: "Goal目标", pattern: /goal|目标|希望|改变/iu },
      { tag: "Reality现状", pattern: /reality|现状|真实|证据|当前/iu },
      { tag: "Options选择", pattern: /options|选择|方案|可以|包括/iu },
      { tag: "Will行动", pattern: /will|行动|下一步|准备|会在|承诺/iu }
    ]
  },
  "co-creation": {
    compliant: 2,
    excellent: 3,
    checks: [
      { tag: "明确建议", pattern: /建议|建立|设置|增加|优化|可以/ },
      { tag: "理由充分", pattern: /因为|理由|便于|避免|促进|提升|有助于/ },
      { tag: "落地条件", pattern: /条件|需要|由|节点|模板|机制|负责人/ }
    ]
  },
  transformation: {
    compliant: 3,
    excellent: 4,
    checks: [
      { tag: "应用场景", pattern: /场景|课堂|班级|任务|课程|环节/ },
      { tag: "采取动作", pattern: /动作|使用|采用|设计|组织|引导|实施/ },
      { tag: "结果证据", pattern: /结果|证据|学生|数据|作品|表现|观察/ },
      { tag: "改进计划", pattern: /改进|下一步|继续|优化|复盘|迭代/ }
    ]
  }
};

export function reviewLearningItem(input: Pick<LearningItem, "title" | "body" | "phase">): ReviewSnapshot {
  const text = `${input.title} ${input.body}`;
  const baseTags = tagRules.filter(([, words]) => words.some((word) => text.includes(word))).map(([tag]) => tag);
  const rule = phaseReviewRules[input.phase];
  const matchedChecks = rule.checks.filter((check) => check.pattern.test(text));
  const lineCount = input.body.split(/\n+/).map((line) => line.trim()).filter(Boolean).length;
  const enoughDetail = input.body.trim().length >= (input.phase === "co-creation" ? 36 : 64);
  const enoughCoCreationLines = input.phase !== "co-creation" || lineCount >= 2;
  const score = matchedChecks.length;
  const quality: LearningItem["quality"] =
    score >= rule.excellent && enoughDetail && enoughCoCreationLines
      ? "优秀"
      : score >= rule.compliant && input.body.trim().length >= 28
        ? "合规"
        : "待补充";
  const tags = [...baseTags, ...matchedChecks.map((check) => check.tag)];
  const aiSummary =
    input.phase === "transformation"
      ? buildTransformationAssessment(matchedChecks.map((check) => check.tag))
      : undefined;

  return {
    quality,
    tags: Array.from(new Set(tags.length ? tags : [fallbackTag(input.phase)])).slice(0, 5),
    aiSummary
  };
}

export function createLearningItem(input: {
  phase: PhaseId;
  type: ContentType;
  title: string;
  body: string;
  author?: string;
  submitterId?: string;
  submitterRole?: RoleId;
  attachments?: UploadedAsset[];
}): LearningItem {
  const reviewed = reviewLearningItem(input);
  const now = new Date().toISOString();
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    phase: input.phase,
    type: input.type,
    title: input.title,
    body: input.body,
    author: input.author || "李同学",
    submitterId: input.submitterId,
    submitterRole: input.submitterRole,
    createdAt: now,
    updatedAt: now,
    likes: 0,
    threshold: likeThreshold,
    quality: reviewed.quality,
    tags: reviewed.tags,
    attachments: input.attachments || [],
    aiSummary: reviewed.aiSummary,
    reviewSource: "local",
    isExcellent: false,
    inKnowledgeBase: false
  };
}

export function shouldEnterExcellentPool(item: LearningItem) {
  return item.quality !== "待补充" && item.likes >= item.threshold;
}

export function shouldEnterKnowledgeBase(item: LearningItem) {
  return Boolean(item.isExcellent) && item.quality !== "待补充";
}

export function toKnowledgeEntry(item: LearningItem): KnowledgeEntry {
  return {
    id: `kb-${item.id}`,
    originalItemId: item.id,
    phase: item.phase,
    type: item.type,
    title: item.title,
    summary: item.body.length > 96 ? `${item.body.slice(0, 96)}...` : item.body,
    source: `${item.author} · ${item.type}`,
    tags: item.tags,
    createdAt: new Date().toISOString().slice(0, 10),
    status: "active"
  };
}

export function isUsefulCoCreationIdea(idea: string) {
  const text = idea.trim();
  if (text.length < 12) return false;
  const hasAction = /建议|建立|设置|增加|优化|可以|需要|形成|设计|安排|推进|复盘/.test(text);
  const hasReasonOrCondition = /因为|便于|避免|促进|提升|有助于|需要|条件|由|节点|模板|机制|负责人|证据/.test(text);
  return hasAction && hasReasonOrCondition;
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
  const hidden: string[] = [];

  for (const idea of incoming.map((item) => item.trim()).filter(Boolean)) {
    if (!isUsefulCoCreationIdea(idea)) {
      hidden.push(idea);
      continue;
    }
    const key = normalizeIdea(idea);
    const isDuplicate = Array.from(normalized).some((existingKey) => existingKey === key || ideaSimilarity(existingKey, key) >= 0.86);
    if (!isDuplicate) {
      normalized.add(key);
      accepted.push(idea);
    } else {
      hidden.push(idea);
    }
  }

  return { accepted, hidden };
}

export function isCoCreationSaturated(existing: string[], accepted: string[], nextRound: number, maxRounds: number) {
  if (nextRound >= maxRounds) return true;
  if (accepted.length <= 3) return true;
  const prior = existing.map(normalizeIdea);
  const nearDuplicateCount = accepted
    .map(normalizeIdea)
    .filter((idea) => prior.some((oldIdea) => ideaSimilarity(oldIdea, idea) >= 0.66)).length;
  return accepted.length > 0 && nearDuplicateCount / accepted.length >= 0.5;
}

export function generateConsensusReport(state: CoCreationState) {
  const ranked = Object.entries(state.votes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const categoryText = Object.entries(state.categories)
    .map(([category, ideas]) => `${category}：${ideas.slice(0, 3).join("；")}`)
    .join(" / ");
  const groupText = Object.entries(state.groupVotes || {})
    .slice(0, 3)
    .map(([idea, groups]) => {
      const topGroup = Object.entries(groups).sort((a, b) => b[1] - a[1])[0];
      return topGroup ? `${topGroup[0]}支持“${idea}”` : "";
    })
    .filter(Boolean)
    .join("；");

  return [
    `共创主题：${state.topic}`,
    `核心共识：${ranked.map(([idea, votes]) => `${idea}（${votes}票）`).join("；")}`,
    `分类洞察：${categoryText}`,
    groupText ? `分组观察：${groupText}` : "",
    "行动建议：由班主任将前 2 条高票观点纳入班级行动计划，并交给转化教练在 D+30、D+90 节点追踪。"
  ].filter(Boolean).join("\n");
}

export function generatePersonalPlan(knowledgeBase: KnowledgeEntry[], student = "李同学", studentHistory: LearningItem[] = []): PersonalPlan {
  const focus = inferStudentFocus(studentHistory);
  const relevantEntries = rankKnowledgeEntries(knowledgeBase, studentHistory, focus).slice(0, 4);
  const citedCases = relevantEntries.map((entry) => entry.title);

  const now = new Date();
  const generatedAt = now.toISOString().slice(0, 10);
  const d30 = addDays(now, 30).toISOString().slice(0, 10);
  const d90 = addDays(now, 90).toISOString().slice(0, 10);
  const sourceSummary = relevantEntries.length
    ? `优先引用 ${relevantEntries.map((entry) => `“${entry.title}”`).join("、")}。`
    : "当前知识库素材较少，先以个人历史提交和五环通用模板生成方案。";
  const historySummary = studentHistory.length
    ? `${student} 已提交 ${studentHistory.length} 条记录，重点能力画像为：${focus.join("、")}。`
    : `${student} 暂无个人历史提交，建议先完成一条深学批注和一条反思案例，再进入训后转化。`;

  return {
    student,
    status: "待确认",
    recommendation: `${historySummary}${sourceSummary}建议围绕“${focus[0] || "课堂改进"}”形成小步行动方案，先选定一节真实课作为转化场景，再把可复用案例转成可观察、可提交的成果证据。`,
    actions: [
      `选择一节 2 周内可实施的真实课，聚焦“${focus[0] || "学生参与"}”这个单点目标。`,
      citedCases.length
        ? `引用 ${citedCases.slice(0, 2).map((title) => `“${title}”`).join("、")} 中的方法，改写成自己的课堂任务卡。`
        : "先补充一条深学批注和一条 GROW 反思案例，形成可引用的个人素材。",
      "在课堂中收集学生发言记录、作品照片、观察量表或同伴反馈作为结果证据。",
      `${d30} 提交初步成果，${d90} 形成完整转化案例。`
    ],
    checkpoints: [
      { label: "训后 1 个月提醒", day: "D+30", date: d30, status: "待提交" },
      { label: "训后 3 个月追踪", day: "D+90", date: d90, status: "待提醒" }
    ],
    citedCases,
    generatedAt,
    sourceNotes: relevantEntries.map((entry) => `${entry.source} · ${entry.phase}`)
  };
}

function buildTransformationAssessment(matchedTags: string[]) {
  const has = (tag: string) => matchedTags.includes(tag);
  const completeness = has("应用场景") && has("采取动作") ? "完成度较完整" : "完成度待补充";
  const grounded = has("结果证据") ? "落地性有证据" : "落地性需补结果证据";
  const iteration = has("改进计划") ? "改进空间已说明" : "改进空间需写清下一步";
  return `成果初评：${completeness}，${grounded}，${iteration}。`;
}

function inferStudentFocus(studentHistory: LearningItem[]) {
  const tags = studentHistory.flatMap((item) => item.tags || []);
  const tagCount = new Map<string, number>();
  for (const tag of tags) tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
  const fromTags = Array.from(tagCount.entries()).sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
  if (fromTags.length) return fromTags.slice(0, 3);

  const phases = new Set(studentHistory.map((item) => item.phase));
  if (phases.has("reflection")) return ["结构化反思", "行动转化", "课堂改进"];
  if (phases.has("practice")) return ["实训技能", "课堂观察", "复用方法"];
  if (phases.has("deep-study")) return ["教学设计", "迁移动作", "课堂观察"];
  return ["课堂改进", "学生参与", "成果转化"];
}

function rankKnowledgeEntries(knowledgeBase: KnowledgeEntry[], studentHistory: LearningItem[], focus: string[]) {
  const historyText = studentHistory.map((item) => `${item.title} ${item.body} ${(item.tags || []).join(" ")}`).join(" ");
  const focusSet = new Set(focus);
  return [...knowledgeBase].sort((a, b) => scoreKnowledgeEntry(b, historyText, focusSet) - scoreKnowledgeEntry(a, historyText, focusSet));
}

function scoreKnowledgeEntry(entry: KnowledgeEntry, historyText: string, focusSet: Set<string>) {
  const tagScore = entry.tags.reduce((sum, tag) => sum + (focusSet.has(tag) ? 4 : historyText.includes(tag) ? 2 : 0), 0);
  const phaseScore = entry.phase === "transformation" ? 3 : entry.phase === "reflection" || entry.phase === "co-creation" ? 2 : 1;
  const keywordScore = tokenize(entry.title + entry.summary).filter((token) => token.length > 1 && historyText.includes(token)).length;
  return tagScore + phaseScore + Math.min(keywordScore, 4);
}

function addDays(base: Date, days: number) {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export const initialItems: LearningItem[] = [
  {
    id: "annotation-001",
    phase: "deep-study",
    type: "批注",
    title: "课堂提问链观察批注",
    body: "我发现优秀课堂会先用事实性问题帮助学生进入情境，再用解释性问题推动学生说出理由，最后用迁移性问题引导学生联系自己的经验。这种提问链能避免课堂只停留在抢答层面。",
    author: "李同学",
    submitterId: "account-student",
    submitterRole: "student",
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: "2026-05-01T09:00:00.000Z",
    likes: 3,
    threshold: likeThreshold,
    quality: "优秀",
    tags: ["教学设计", "课堂观察"],
    isExcellent: true,
    inKnowledgeBase: true
  },
  {
    id: "sticky-001",
    phase: "practice",
    type: "即时贴",
    title: "小组讨论即时贴",
    body: "照片记录了第三组讨论时只有组长发言，其他成员沉默。跟练后发现任务卡没有分配角色，导致学生不知道自己负责什么。下次可加入记录员、汇报员、质询员三类角色。",
    author: "王同学",
    submitterId: "account-student-wang",
    submitterRole: "student",
    createdAt: "2026-05-01T10:00:00.000Z",
    updatedAt: "2026-05-01T10:00:00.000Z",
    likes: 3,
    threshold: likeThreshold,
    quality: "优秀",
    tags: ["实训技能", "课堂观察"],
    isExcellent: true,
    inKnowledgeBase: true
  },
  {
    id: "reflection-001",
    phase: "reflection",
    type: "反思案例",
    title: "GROW 反思案例：学生讨论参与不均衡",
    body: "目标是让每个小组成员都能参与讨论。现状是部分学生等待组长给答案，发言集中在少数人身上。选择包括角色分工、发言计时和同伴追问。下一步会在任务卡中明确每个角色的产出。",
    author: "李同学",
    submitterId: "account-student",
    submitterRole: "student",
    createdAt: "2026-05-02T09:00:00.000Z",
    updatedAt: "2026-05-02T09:00:00.000Z",
    likes: 3,
    threshold: likeThreshold,
    quality: "优秀",
    tags: ["结构化反思", "行动转化"],
    isExcellent: true,
    inKnowledgeBase: true
  },
  {
    id: "case-001",
    phase: "transformation",
    type: "转化案例",
    title: "训后 1 个月课堂转化案例",
    body: "我把培训中的提问链模板用于一节项目导入课，先设计事实性问题，再设计解释性问题和迁移性问题。一个月后，学生回答更愿意说明理由，小组汇报也更聚焦。",
    author: "李同学",
    submitterId: "account-student",
    submitterRole: "student",
    createdAt: "2026-05-03T09:00:00.000Z",
    updatedAt: "2026-05-03T09:00:00.000Z",
    likes: 3,
    threshold: likeThreshold,
    quality: "优秀",
    tags: ["行动转化", "成功经验"],
    aiSummary: "成果初评：完成度较完整，落地性有证据，改进空间需写清下一步。",
    isExcellent: true,
    inKnowledgeBase: true
  }
];

export const initialKnowledgeBase: KnowledgeEntry[] = initialItems.map(toKnowledgeEntry);

export const initialCoCreation: CoCreationState = {
  topic: "如何提升培训成果转化率",
  round: 1,
  maxRounds: 1,
  groups: ["第一小组", "第二小组", "第三小组"],
  ideas: ["设置训后 1 个月提醒", "建立课堂观察模板", "增加同伴互评反馈", "将优秀转化案例纳入下期素材"],
  ideaGroups: {
    "设置训后 1 个月提醒": "第一小组",
    "建立课堂观察模板": "第二小组",
    "增加同伴互评反馈": "第三小组",
    "将优秀转化案例纳入下期素材": "第一小组"
  },
  hiddenIdeas: [],
  categories: categorizeIdeas(["设置训后 1 个月提醒", "建立课堂观察模板", "增加同伴互评反馈", "将优秀转化案例纳入下期素材"]),
  votes: {
    "设置训后 1 个月提醒": 6,
    "建立课堂观察模板": 5,
    "增加同伴互评反馈": 4,
    "将优秀转化案例纳入下期素材": 7
  },
  groupVotes: {
    "设置训后 1 个月提醒": { 第一小组: 3, 第二小组: 2, 第三小组: 1 },
    "建立课堂观察模板": { 第二小组: 3, 第一小组: 1, 第三小组: 1 },
    "增加同伴互评反馈": { 第三小组: 2, 第一小组: 1, 第二小组: 1 },
    "将优秀转化案例纳入下期素材": { 第一小组: 3, 第二小组: 2, 第三小组: 2 }
  },
  voters: {},
  converged: false,
  report: "",
  archives: []
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
  return value
    .toLowerCase()
    .replace(/[，。,.、；;：:“”"'\s]/g, "")
    .slice(0, 80);
}

function ideaSimilarity(a: string, b: string) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if ((a.includes(b) || b.includes(a)) && Math.min(a.length, b.length) >= 8) return 0.78;
  const aTokens = new Set(tokenize(a));
  const bTokens = new Set(tokenize(b));
  const intersection = Array.from(aTokens).filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size || 1;
  return intersection / union;
}

function tokenize(value: string) {
  const compact = value.replace(/[，。,.、；;：:“”"'\s]/g, "");
  if (compact.length <= 2) return compact ? [compact] : [];
  const tokens: string[] = [];
  for (let index = 0; index < compact.length - 1; index += 1) {
    tokens.push(compact.slice(index, index + 2));
  }
  return tokens;
}
