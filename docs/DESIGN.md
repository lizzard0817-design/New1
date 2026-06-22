# 五环共创培训智能体 — 技术设计文档

## 1. 设计目标与约束

### 1.1 核心设计原则

| 原则 | 说明 |
| --- | --- |
| **角色驱动** | 系统以"角色"（学员 / 教师 / 管理员）为第一维度切分数据、功能和页面，而非以"模块"为中心。 |
| **交付闭环** | 每个角色首页展示其专属交付路径，明确任务 → 交付物 → 接收方，操作入口直接跳转到对应模块。 |
| **智能体协作** | 总教练 Agent 作为统一调度入口，五个专业教练 Agent 各司其职，通过共享状态和知识库协作。 |
| **离线兜底** | 外部 AI 模型不可用时，系统自动降级为本地规则（正则 + 长度判断），不阻塞核心提交流程。 |
| **数据主权** | 用户 API Key 仅存储于浏览器 localStorage，不下发到环境变量，不出现在日志和错误信息中。 |
| **渐进增强** | 当前为单页演示级应用（文件持久化），架构预留数据库、真实认证、消息队列等生产化路径。 |

### 1.2 技术栈

| 层 | 技术 | 当前状态 |
| --- | --- | --- |
| 框架 | Next.js 16 (App Router) | 已使用 |
| 前端 | React 19 + TypeScript + Tailwind CSS 4 | 已使用 |
| 图标 | Lucide React | 已使用 |
| 后端 | Next.js API Routes | 已使用 |
| 持久化 | 服务端 JSON 文件 | 当前方案（生产应迁移为数据库） |
| AI 集成 | OpenAI-compatible Chat Completions API | 已支持（MiniMax / 用户自定义） |
| 部署 | Docker 容器 + 持久化卷 | 已配置 |

---

## 2. 系统架构

### 2.1 架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                        浏览器层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ 学员端 SPA│  │ 教师端 SPA│  │ 管理员端  │                 │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
│       │              │              │                         │
│       └──────────────┼──────────────┘                         │
│                      │ localStorage: account, modelConfig     │
└──────────────────────┼──────────────────────────────────────┘
                       │ HTTP + JSON
┌──────────────────────┼──────────────────────────────────────┐
│                 Next.js Server                               │
│                      │                                       │
│  ┌───────────────────┼───────────────────────────┐          │
│  │           API Routes (/api/*)                   │          │
│  │  ┌─────────┬─────────┬──────────┬────────────┐ │          │
│  │  │ /items  │ /state  │ /uploads │ /co-creation│ │          │
│  │  │ CRUD    │ 同步    │ 图片上传  │ 观点/投票   │ │          │
│  │  ├─────────┼─────────┼──────────┼────────────┤ │          │
│  │  │ /items/ │ /plans/ │ /plans/  │ /health    │ │          │
│  │  │ like    │ generate│checkpoint│ 健康检查   │ │          │
│  │  └─────────┴─────────┴──────────┴────────────┘ │          │
│  └───────────────────────┬───────────────────────┘          │
│                          │                                    │
│  ┌───────────────────────┼───────────────────────┐          │
│  │              服务层 (src/lib/)                  │          │
│  │  ┌──────────┐  ┌───────────┐  ┌────────────┐ │          │
│  │  │agents.ts │  │minimax.ts │  │server-state│ │          │
│  │  │业务逻辑   │  │AI 模型调用 │  │状态持久化   │ │          │
│  │  └──────────┘  └───────────┘  └────────────┘ │          │
│  └───────────────────────┬───────────────────────┘          │
│                          │                                    │
│  ┌───────────────────────┼───────────────────────┐          │
│  │              持久化层                            │          │
│  │  .wuhuan-data/state.json (JSON 文件)            │          │
│  │  public/uploads/       (图片文件)                │          │
│  └─────────────────────────────────────────────────┘          │
│                          │                                    │
└──────────────────────────┼────────────────────────────────────┘
                           │ HTTP (OpenAI-compatible)
┌──────────────────────────┼────────────────────────────────────┐
│               外部 AI 模型服务                                  │
│  MiniMax / OpenAI / 通义 / DeepSeek / ...                     │
│  POST /v1/chat/completions                                    │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 数据流

```
学员提交内容 → API /api/items
                    │
                    ├──→ minimax.ts: 调用外部模型审核（可选）
                    │         │
                    │         └──→ 返回 quality + tags + aiSummary
                    │
                    └──→ server-state.ts: addSharedItem()
                              │
                              ├── agents.ts: createLearningItem() 本地审核兜底
                              ├── JSON 文件写入
                              └── 如果是转化成果 → 自动关联行动计划节点
```

---

## 3. 前端架构

### 3.1 组件树

```
TrainingAgentApp (根组件, "use client")
├── LoginScreen                          # 登录页
│   ├── 账号密码表单
│   └── 快速登录入口（演示账号）
│
├── [sidebar]                            # 左侧导航
│   ├── 导航菜单 (按角色过滤)
│   ├── 入库规则卡片
│   └── RoleCard: 当前账号权限
│
├── Dashboard                            # 仪表盘（按角色分支）
│   ├── AdminDashboard                   # 管理员：系统治理看板
│   │   ├── 系统健康指标
│   │   ├── PermissionMatrix             # 权限矩阵
│   │   ├── DeliveryFlowPanel            # 治理链路
│   │   ├── ClassSubmissionPanel         # 全班提交审阅
│   │   └── 模块运行监控
│   │
│   ├── TeacherDashboard                 # 教师/班主任：班级运营看板
│   │   ├── TeacherHero                  # 运营概览
│   │   ├── ClassSubmissionPanel         # 班级内容池（按学员/环节/状态筛选）
│   │   ├── PlanTargetPanel              # 行动计划生成对象
│   │   ├── DeliveryFlowPanel            # 班主任交付闭环
│   │   └── 总教练中枢 + 共创收敛状态
│   │
│   └── StudentDashboard                 # 学员：个人学习看板
│       ├── 个人任务概览
│       ├── DeliveryFlowPanel            # 我的学习交付路径
│       └── 五环模块入口卡片
│
├── WorkflowPanel                        # 通用五环提交工作流
│   ├── 环节说明 + 交付说明
│   ├── 提交模板（每环不同）
│   ├── 提交表单（标题 + 正文 + 图片）
│   ├── 质量判断标签
│   └── 互动内容池（按环过滤）
│
├── CoCreationPanel                      # 共创工作流
│   ├── 观点提交区
│   ├── 观点分类汇总
│   ├── 投票卡片
│   └── 共识报告展示
│
├── TransformationPanel                  # 转化工作流
│   ├── 行动计划展示
│   ├── 转化成果提交表单
│   └── 转化成果池
│
├── SupervisorPanel                      # 总教练控制台
│   ├── 总教练功能说明
│   ├── 学员选择器
│   ├── 知识库素材展示
│   └── 方案生成入口
│
├── KnowledgePanel                       # 知识库浏览
│   └── 分库表格（总/深学/跟练/反思/共创/转化）
│
└── ModelSettingsPanel                   # 模型配置
    ├── 预设选择
    └── 自定义配置表单
```

### 3.2 路由设计

当前为单页 SPA，通过 `view` 状态切换。生产化时应迁移为 Next.js 路由：

| 路由 | 角色 | 内容 |
| --- | --- | --- |
| `/login` | 全角色 | 登录页 |
| `/student/dashboard` | 学员 | 个人仪表盘 |
| `/student/deep-study` | 学员 | 深学环提交 |
| `/student/practice` | 学员 | 跟练环提交 |
| `/student/reflection` | 学员 | 反思环提交 |
| `/student/co-creation` | 学员 | 共创观点提交 |
| `/student/transformation` | 学员 | 行动计划与转化成果 |
| `/student/model-config` | 学员 | 模型配置 |
| `/teacher/dashboard` | 教师 | 班级仪表盘 |
| `/teacher/content` | 教师 | 班级内容管理 |
| `/teacher/co-creation` | 教师 | 共创管理 |
| `/teacher/transformation` | 教师 | 转化追踪 |
| `/teacher/coach` | 教师 | 总教练方案生成 |
| `/teacher/model-config` | 教师 | 模型配置 |
| `/admin/dashboard` | 管理员 | 系统仪表盘 |
| `/admin/accounts` | 管理员 | 账号权限管理 |
| `/admin/knowledge` | 管理员 | 知识库治理 |
| `/admin/model-config` | 管理员 | 模型配置 |

### 3.3 状态管理

当前方案：React `useState` + `localStorage` + 服务端 JSON 文件同步。

| 状态 | 存储位置 | 说明 |
| --- | --- | --- |
| 当前登录账号 | `localStorage` + `useState` | 角色、名称、班级 |
| 模型配置 | `localStorage` + `useState` | 用户自填 API Key |
| 视图 ID | `useState` | 当前选中的 page/view |
| 当前环节 | `useState` | 深学/跟练/反思/共创/转化 |
| 草稿内容 | `useState` | 标题 + 正文 + 附件 |
| 学习条目列表 | 服务端 JSON → `fetch` → `useState` | 共享状态 |
| 知识库 | 服务端 JSON → `fetch` → `useState` | 共享状态 |
| 共创状态 | 服务端 JSON → `fetch` → `useState` | 共享状态 |
| 个人方案 | 服务端 JSON → `fetch` → `useState` | 按学员分组 |

### 3.4 角色前端分流

```
用户登录 → 确定角色
  ├── student → 导航显示: 仪表盘、五环模块、模型配置
  │             Dashboard 渲染 StudentDashboard
  │             可提交学习内容、点赞、提交共创观点
  │
  ├── teacher → 导航显示: 仪表盘、总教练、五环模块、知识库、模型配置
  │             Dashboard 渲染 TeacherDashboard
  │             可查看所有学员内容、运行共创、生成方案
  │
  └── admin  → 导航显示: 仪表盘、总教练、五环模块、知识库、模型配置
              Dashboard 渲染 AdminDashboard
              全权限，可查看权限矩阵和模块监控
```

---

## 4. 后端架构

### 4.1 API 设计

| 端点 | 方法 | 功能 | 权限 |
| --- | --- | --- | --- |
| `/api/health` | GET | 健康检查 | 公开 |
| `/api/state` | GET | 获取完整共享状态 | 登录 |
| `/api/items` | POST | 提交学习内容 | 学员 |
| `/api/items/like` | POST | 点赞 | 所有登录用户 |
| `/api/uploads` | POST | 上传图片 | 学员 |
| `/api/uploads/[file]` | GET | 查看已上传图片 | 登录 |
| `/api/co-creation/ideas` | POST | 提交共创观点 | 学员/教师/管理员 |
| `/api/co-creation/run` | POST | 运行共创收敛 | 教师/管理员 |
| `/api/co-creation/vote` | POST | 投票 | 所有登录用户 |
| `/api/plans/generate` | POST | 生成个性化方案 | 教师/管理员 |
| `/api/plans/checkpoint` | POST | 更新节点状态 | 教师/管理员 |

### 4.2 请求/响应模式

**POST /api/items**

```typescript
// Request Body
{
  phase: "deep-study" | "practice" | "reflection" | "co-creation" | "transformation";
  type: "批注" | "即时贴" | "反思案例" | "观点" | "转化案例";
  title: string;
  body: string;
  author: string;
  attachments?: { url: string; name: string; mimeType: string; size: number }[];
  modelConfig?: { enabled: boolean; providerName: string; baseUrl: string; model: string; apiKey: string };
}

// Response
{
  state: SharedState;   // 更新后的全量共享状态
  item: LearningItem;   // 新建的条目
}
```

### 4.3 中间件

当前中间件处理路径重写（`/wuhuan/*` → `/*`），无需扩展。未来可增加：
- 会话鉴权中间件
- 请求日志脱敏中间件（屏蔽 API Key）
- 限流中间件

### 4.4 持久化层

```
.wuhuan-data/
  state.json          → 全量共享状态（items + knowledgeBase + coCreation + plansByStudent）

public/uploads/
  <uuid>.<ext>        → 用户上传的图片文件
```

**当前约束**：
- 无并发控制（单进程读写 JSON，不适合多实例部署）
- 无数据隔离（所有班级共享一个 state.json）
- 无备份机制

**生产化路径**：
- 使用 SQLite/PostgreSQL 替代 JSON 文件
- 添加数据隔离（按班级/organization）
- 使用对象存储（S3/R2）替代本地文件系统存储图片

---

## 5. 数据模型

### 5.1 核心实体

```
LearningItem（学习条目）
├── id: string                    # 唯一标识，格式: item-{timestamp}-{random}
├── phase: PhaseId               # 所属环节
├── type: ContentType            # 内容类型（批注/即时贴/反思案例/观点/转化案例）
├── title: string                # 标题
├── body: string                 # 正文
├── author: string               # 提交人姓名
├── likes: number                # 点赞数
├── threshold: number            # 入库阈值（= ceil(参训人数/3)）
├── quality: "待补充" | "合规" | "优秀"   # 质量评级
├── tags: string[]               # 标签（来自 AI 或本地规则）
├── attachments?: UploadedAsset[] # 附件列表
├── aiSummary?: string           # AI 生成的摘要
├── reviewSource?: "local" | "minimax" | "custom"  # 审核来源
├── inKnowledgeBase: boolean     # 是否已入库
└── voters?: string[]            # 已投票者列表

KnowledgeEntry（知识库条目）
├── id: string                    # 格式: kb-{itemId}
├── phase: PhaseId
├── type: ContentType
├── title: string
├── summary: string               # 摘要（截取前96字）
├── source: string                # 来源: "{author} · {type}"
├── tags: string[]
└── createdAt: string             # ISO date

CoCreationState（共创状态）
├── topic: string                 # 共创主题
├── round: number                 # 当前轮次（1-3）
├── maxRounds: number             # 最大轮次（3）
├── ideas: string[]               # 已收集观点
├── categories: Record<string, string[]>  # 分类汇总
├── votes: Record<string, number>         # 投票统计
├── voters?: Record<string, string[]>     # 投票记录（防重复）
├── converged: boolean            # 是否已收敛
└── report: string                # 共识报告正文

PersonalPlan（个人方案）
├── student: string               # 目标学员
├── recommendation: string        # 方案建议正文
├── actions: string[]             # 行动步骤列表
├── checkpoints: Checkpoint[]     # 追踪节点
│   ├── label: string             # 节点名称
│   ├── day: string               # "D+30" | "D+90"
│   ├── date?: string             # 预计日期
│   ├── status: "待提醒" | "待提交" | "已评估"
│   └── evidenceItemId?: string   # 关联的转化成果 ID
├── generatedAt?: string          # 生成时间
└── citedCases: string[]          # 引用的知识库案例标题
```

### 5.2 状态聚合

```typescript
SharedState {
  items: LearningItem[];           // 所有学习条目
  knowledgeBase: KnowledgeEntry[]; // 所有入库条目
  coCreation: CoCreationState;     // 当前共创会话
  plansByStudent: Record<string, PersonalPlan>;  // 按学员分组
}
```

### 5.3 实体关系

```
LearningItem ──(点赞达标)──→ KnowledgeEntry
LearningItem ──(转化成果)──→ PersonalPlan.checkpoints[n].evidenceItemId
KnowledgeEntry ──(引用)──→ PersonalPlan.citedCases
CoCreationState ──(收敛)──→ KnowledgeEntry (共识报告)
```

---

## 6. 智能体架构

### 6.1 智能体拓扑

```
                      ┌──────────────┐
                      │  总教练 Agent  │
                      │  统一调度入口   │
                      └──────┬───────┘
                             │
        ┌────────┬───────────┼───────────┬──────────┐
        │        │           │           │          │
   ┌────▼──┐ ┌──▼───┐ ┌────▼───┐ ┌────▼──┐ ┌─────▼───┐
   │深学教练│ │跟练   │ │反思教练│ │共创   │ │转化教练  │
   │批注   │ │教练   │ │GROW    │ │教练   │ │行动计划  │
   │合规   │ │即时贴 │ │问答    │ │观点   │ │节点提醒  │
   │优秀池 │ │合规   │ │案例    │ │去重   │ │成果评估  │
   └───┬───┘ └──┬───┘ └───┬────┘ └──┬───┘ └────┬────┘
       │        │         │         │          │
       └────────┴─────────┴─────────┴──────────┘
                        │
                  ┌─────▼──────┐
                  │  知识库系统  │
                  │  总库 + 5子库│
                  └────────────┘
```

### 6.2 智能体职责矩阵

| Agent | 输入 | 核心处理 | 输出 | 当前实现 |
| --- | --- | --- | --- | --- |
| 总教练 | 培训需求、各环产出 | 调度模块、方案生成、知识沉淀 | 方案建议报告、入库记录 | `supervisorFunctions` + `generatePersonalPlan()` |
| 深学教练 | 学员批注 | 合规判断（长度/内容） | 合规结果、优秀批注 | `reviewLearningItem()` + 本地规则 |
| 跟练教练 | 照片+说明 | 合规判断、技能识别 | 合规结果、优秀即时贴 | 同上 |
| 反思教练 | GROW 问答 | 结构完整性检查 | 合规结果、反思案例 | 同上 |
| 共创教练 | 观点列表 | 去重、分类、饱和判断 | 分类池、投票卡片、共识报告 | `categorizeIdeas()` + `mergeNewIdeas()` + `generateConsensusReport()` |
| 转化教练 | 我的方案 | 计划生成、节点提醒、成果评估 | 行动计划、提醒、初评结果 | `generatePersonalPlan()` + `submitTransformationEvidence()` |

### 6.3 智能体智能演进路线

智能体能力分为三个阶段演进，从确定性规则逐步过渡到 LLM 驱动的多 Agent 协作。

#### 阶段一：确定性规则（当前实现）

每个 Agent 的核心逻辑是纯函数，基于正则匹配、字符串长度、关键词表等确定性规则。不依赖外部 LLM。

**特点**：
- 零延迟、零成本
- 可预测、可测试
- 覆盖常见场景，边界 case 漏判
- 无法理解语义、上下文和隐含信息

**适用场景**：原型验证、演示、开发环境、LLM 不可用时的兜底。

#### 阶段二：LLM 增强审核（当前已部分实现）

在内容提交环节引入外部 LLM 做质量审核，规则仍作为兜底。

**架构**：

```
┌──────────────────────────────────────────────┐
│              Agent 调用链                      │
│                                                │
│  请求 → try LLM call (3s timeout)              │
│            │                                   │
│            ├── 成功 → 解析 JSON 响应            │
│            │         提取 quality/tags/summary │
│            │                                   │
│            ├── 超时 → 降级本地规则              │
│            ├── 格式错误 → 降级本地规则          │
│            └── 网络错误 → 降级本地规则          │
│                                                │
│  LLM 调用参数:                                  │
│  - temperature: 0.2 (低随机性)                  │
│  - max_tokens: 220 (短响应)                    │
│  - response_format: 未强制 JSON (兼容性好)      │
│  - 超时: 10s (fetch 默认，建议显式设置)         │
└──────────────────────────────────────────────┘
```

**已实现的 LLM 调用**（`src/lib/minimax.ts`）：
- 仅用于内容审核（`/api/items` POST）
- 各 Agent 的专项逻辑（观点分类、GROW 校验、方案生成）仍为本地规则

#### 阶段三：多 Agent LLM 协作 + RAG（目标架构）

每个专业教练 Agent 拥有独立的 system prompt、知识库检索能力和输出格式。总教练负责编排调用顺序和数据传递。

**目标架构图**：

```
用户请求（例：为李同学生成个性化方案）
         │
         ▼
┌─────────────────────────────────────────────────┐
│               总教练 Agent (Orchestrator)         │
│                                                   │
│  1. 解析请求意图                                   │
│  2. 确定需要调用的 Agent 链                        │
│  3. 从总知识库 RAG 检索相关素材                    │
│  4. 依次调用各 Agent，传递中间结果                  │
│  5. 聚合输出为《个性化方案建议报告》               │
│                                                   │
│  System Prompt:                                   │
│  "你是五环培训系统的总教练，负责调度专业教练       │
│   完成培训任务。你需要理解教师的意图，确定哪些      │
│   教练模块需要介入，并从知识库中检索相关案例。      │
│   输出 JSON 格式的行动建议。"                      │
└──────┬──────────────────────────────────────────┘
       │
       │  按需调用
       │
       ├──→ 深学教练: RAG 检索深学知识库 → 推荐教学理论
       ├──→ 跟练教练: RAG 检索跟练知识库 → 推荐实训方法
       ├──→ 反思教练: RAG 检索反思知识库 → 推荐反思框架
       ├──→ 共创教练: RAG 检索共创知识库 → 推荐群体智慧
       └──→ 转化教练: 生成行动计划 + 节点提醒模板
```

### 6.4 各 Agent 的 LLM Prompt 设计

#### 深学教练 — 批注审核

```
System:
你是五环培训系统的深学教练。你的任务是审核学员的学习批注质量。
批注应包含三个要素：看到了什么（具体观察）、为什么重要（个人理解）、如何迁移（行动计划）。

User:
课程主题：{topic}
批注标题：{title}
批注内容：{body}

请输出 JSON：
{
  "quality": "优秀" | "合规" | "待补充",
  "feedback": "针对性改进建议（若待补充，给出具体引导）",
  "tags": ["标签1", "标签2"],
  "strengths": ["亮点1"],
  "weaknesses": ["不足1"]
}

判断标准：
- 优秀：三个要素齐全，有具体例子，迁移动作可执行
- 合规：至少包含两个要素，内容基本完整
- 待补充：只有一个要素、过于空泛、或与培训无关
```

#### 反思教练 — GROW 结构校验

```
System:
你是五环培训系统的反思教练。你的任务是基于 GROW 模型审核学员的反思案例。
GROW = Goal (目标) + Reality (现状) + Options (选择) + Will (行动)。
优秀的反思案例必须有清晰的目标、有证据的现状描述、可执行的选择和明确的下一步行动。

User:
案例标题：{title}
案例内容：{body}

请输出 JSON：
{
  "quality": "优秀" | "合规" | "待补充",
  "groWScore": { "goal": 0-10, "reality": 0-10, "options": 0-10, "will": 0-10 },
  "feedback": "针对性改进建议",
  "tags": ["标签"]
}
```

#### 共创教练 — 观点分类与饱和判断

```
System:
你是五环培训系统的共创教练。你的任务是：
1. 对学员提交的观点进行语义去重——意思相同的只保留一条
2. 将去重后的观点分类到：学员支持、教学方法、实训设计、评价反馈、转化落地
3. 判断本轮是否有足够的新观点（新增有效观点 ≤ 3 条即判定智慧饱和）
4. 如果智慧饱和，生成《共识报告》

User:
当前主题：{topic}
已有观点（{existingCount}条）：{existingIdeas}
本轮新增：{incomingIdeas}

请输出 JSON：
{
  "accepted": ["去重后接受的观点"],
  "rejected": ["与已有观点重复的"],
  "categorization": { "类别": ["观点"] },
  "saturated": true/false,
  "saturationReason": "说明饱和或未饱和的原因"
}
```

#### 总教练 — RAG 方案生成

这是最复杂的 Agent 调用，需要将知识库检索结果注入 prompt 作为上下文。

```
System:
你是五环培训系统的总教练。你的任务是基于知识库中的优秀案例，
为指定学员生成一份《个性化方案建议报告》。

报告结构：
1. 学员画像（基于其历史提交总结优势和改进方向）
2. 方案建议（引用 2-3 个知识库案例，说明如何借鉴）
3. 行动步骤（3-5 个可执行的具体步骤）
4. 追踪节点（D+30 和 D+90 的检查要点）

引用案例时必须注明来源（作者 + 环节 + 标题）。

User:
目标学员：{studentName}
该学员历史提交：{studentHistory}
知识库相关案例：
{检索到的相关案例，按相关度排序}

请输出 JSON：
{
  "studentProfile": "学员画像",
  "recommendation": "方案建议完整文本",
  "actions": ["步骤1", "步骤2", ...],
  "checkpoints": [
    { "day": "D+30", "focus": "30天检查要点" },
    { "day": "D+90", "focus": "90天检查要点" }
  ],
  "citedCases": ["案例标题1", "案例标题2"]
}
```

### 6.5 RAG 架构设计

方案生成是系统中对知识库依赖最重的场景。RAG（Retrieval-Augmented Generation）流程如下：

```
┌─────────────────────────────────────────────────────┐
│                  RAG Pipeline                        │
│                                                      │
│  1. 索引阶段（提交流程中实时完成）                    │
│     LearningItem → 入库 → KnowledgeEntry             │
│                              │                       │
│                              ▼                       │
│                        文本分块 + 存储               │
│                        (当前: 仅摘要)                │
│                        (未来: 完整正文 + 嵌入向量)    │
│                                                      │
│  2. 检索阶段（方案生成时触发）                        │
│     用户请求 → 意图解析                              │
│                    │                                 │
│                    ▼                                 │
│             关键字检索 (当前)                         │
│             或 向量相似度检索 (未来)                   │
│                    │                                 │
│                    ▼                                 │
│             Top-K 相关案例 (K=3-5)                   │
│                    │                                 │
│                    ▼                                 │
│  3. 增强生成阶段                                    │
│     Prompt = System + Context(检索结果) + User Query  │
│                    │                                 │
│                    ▼                                 │
│             LLM 生成 → 解析 → PersonalPlan           │
└─────────────────────────────────────────────────────┘
```

**检索策略对比**：

| 策略 | 当前实现 | 阶段二 | 阶段三 |
| --- | --- | --- | --- |
| 检索方法 | 按 phase 过滤，取最近 3 条 | 关键词 TF-IDF 匹配 | 嵌入向量语义检索 |
| 检索范围 | 共创 + 转化 + 反思 | 全知识库 | 全知识库 + 跨期培训 |
| 排序 | 无（按创建时间） | TF-IDF 得分 | 余弦相似度 |
| 分块 | 整条记录（前96字） | 固定 256 字滑动窗口 | 语义分块 |
| 向量模型 | 无 | text-embedding-3-small | 本地部署模型（可控成本） |

**当前 `generatePersonalPlan()` 的局限**：

```typescript
// 当前：不调用 LLM，不检索，硬编码模板
const citedCases = knowledgeBase
  .filter(entry => entry.phase.match(/co-creation|transformation|reflection/))
  .slice(-3)  // 取最近 3 条，无相关度排序
  .map(entry => entry.title);

return {
  recommendation: `建议 ${student} 围绕"提升课堂提问质量..."形成小步行动方案...`,
  // ↑ 完全硬编码，不针对具体学员
  actions: ["选择一节 2 周内可实施的真实课...", ...],
  // ↑ 所有学员收到的步骤相同
};
```

**改造为 RAG 方案**：在 `/api/plans/generate` 中增加 LLM 调用步骤，将知识库案例注入 prompt，由 LLM 生成个性化内容。即使 LLM 不可用，仍降级为当前模板方案。

### 6.6 降级策略（Graceful Degradation）

所有 Agent 调用必须遵循三级降级链：

```
Level 1: LLM 调用（用户配置的模型）
  │  超时 10s / 网络错误 / 格式错误
  ▼
Level 2: 内置模型（服务端环境变量配置的默认模型，如 MiniMax）
  │  超时 10s / 不可用
  ▼
Level 3: 本地规则（确定性函数，零依赖）
  - reviewLearningItem(): 长度 + 正则
  - categorizeIdeas(): 关键词分类
  - generatePersonalPlan(): 模板生成
  - generateConsensusReport(): 模板拼接
```

**降级标记**：每个 `LearningItem.reviewSource` 记录实际使用的审核层级（`"local"` / `"minimax"` / `"custom"`），方便事后审计。

### 6.7 LLM 调用优化策略

| 优化项 | 方案 | 效果 |
| --- | --- | --- |
| 超时控制 | AbortController, 10s timeout | 防止 LLM 卡死阻塞提交流程 |
| 重试策略 | 不重试（写操作不适合自动重试） | 避免重复提交 |
| 响应缓存 | 不做缓存（审核需要实时上下文） | — |
| Prompt 缓存 | Anthropic prompt caching 前缀复用 | 降低 API 费用（若使用 Claude） |
| 并发控制 | 单请求单调用，不批量 | 简单可靠 |
| Token 预算 | 输入 ≤ 2K tokens, 输出 ≤ 256 tokens | 控制成本和延迟 |
| 模型路由 | 简单审核用 mini 模型，方案生成用 pro 模型 | 成本与质量平衡 |

### 6.8 质量评估框架

每个 Agent 的输出应有评估指标，用于持续改进 prompt 和规则：

| Agent | 关键指标 | 评估方式 |
| --- | --- | --- |
| 深学/跟练/反思教练 | 审核准确率、漏判率 | 人工抽检 10% 的审核结果 |
| 共创教练 | 去重准确率、饱和判断合理性 | 对比人工去重结果 |
| 总教练 | 方案引用准确率、方案可执行率 | 教师反馈 + 训后转化率 |
| 转化教练 | 评估与真实成果的一致性 | 训后节点的人工复核 |

评估数据通过 `aiSummary`、`reviewSource` 和 `tags` 字段记录，便于离线分析。

---

## 7. 共创引擎设计

### 7.1 多轮收敛流程

```
第 N 轮
  ├── 学员提交观点
  │     └── mergeNewIdeas(): 语义去重（基于标准化字符串比较）
  │           └── 接受唯一观点
  │
  ├── 教师/管理员运行收敛
  │     └── runSharedCoCreationRound():
  │           ├── 接受新增观点
  │           ├── 更新轮次 (round++)
  │           ├── 计算投票初始值
  │           ├── categorizeIdeas(): 基于关键词分类
  │           │     └── 学员支持 / 教学方法 / 实训设计 / 评价反馈 / 转化落地
  │           ├── 饱和判断：accepted.length <= 3 || round >= maxRounds
  │           └── 如果收敛 → generateConsensusReport()
  │                           └── 高票观点 + 分类洞察 + 行动建议
  │
  └── 学员投票
        └── voteSharedIdea(): 一人一票制，去重
```

### 7.2 智慧饱和判断

```
收敛条件（满足任一即收敛）：
1. 本轮新增有效观点 ≤ 3 条
2. 当前轮次 ≥ maxRounds (3)
```

---

## 8. 知识库架构

### 8.1 入库流水线

```
学员提交 → AI/本地 审核
               │
               ├── 不合规 → 退回（仍保留在 items 列表，可查看）
               └── 合规 → 进入班级内容池
                             │
                             ├── 点赞数 < threshold → 等待点赞
                             └── 点赞数 ≥ threshold → 标记优秀
                                                         │
                                                         └── 写入对应子知识库
                                                              + 同步到总知识库
```

### 8.2 知识库分类

| 知识库 | 来源环节 | 入库条件 | 主要用途 |
| --- | --- | --- | --- |
| 总知识库 | 全环节 | 各子库聚合 | 个性化方案生成 |
| 深学知识库 | 深学环 | 合规 + 点赞 ≥ threshold | 教学理论素材 |
| 跟练知识库 | 跟练环 | 合规 + 点赞 ≥ threshold | 实训技能素材 |
| 反思知识库 | 反思环 | 合规 + 点赞 ≥ threshold + GROW 完整 | 深度反思素材 |
| 共创知识库 | 共创环 | 收敛后 + 高票观点 + 共识报告 | 群体智慧素材 |
| 转化知识库 | 转化环 | 合规 + AI 初评合格 + 点赞 ≥ threshold | 成功案例素材 |

---

## 9. 认证与授权

### 9.1 认证方案

**当前**：演示账号模式。用户从预置的账号列表中选择登录，无真实密码验证，无会话管理。

```typescript
// 账号记忆：localStorage
localStorage.setItem("wuhuan-current-account", JSON.stringify(account));
```

**未来**：基于 NextAuth.js / JWT / 数据库的正式认证系统。

### 9.2 授权模型

采用 **ACL（访问控制列表）** 模式，基于角色的权限列表：

```typescript
// 角色 → 权限集合
roleProfiles: RoleProfile[] = [
  { id: "admin",   allowed: [全部12项权限] },
  { id: "teacher", allowed: [10项权限，不含 submitLearningContent, managePermissions] },
  { id: "student", allowed: [7项权限，仅查看/提交/点赞/配置模型] },
]

// 前端判断：can(role, permission) → boolean
// 后端判断：API Route 内暂无强制鉴权，依赖前端角色信息传递
```

### 9.3 权限矩阵

| 权限 | 学员 | 教师 | 管理员 |
| --- | --- | --- | --- |
| viewDashboard | ✓ | ✓ | ✓ |
| viewSupervisor | ✗ | ✓ | ✓ |
| viewLearningWorkflows | ✓ | ✓ | ✓ |
| submitLearningContent | ✓ | ✗ | ✓ |
| likeContent | ✓ | ✓ | ✓ |
| submitCoCreationIdeas | ✓ | ✓ | ✓ |
| runCoCreation | ✗ | ✓ | ✓ |
| generatePlan | ✗ | ✓ | ✓ |
| trackTransformation | ✓ | ✓ | ✓ |
| viewKnowledgeBase | 部分 | ✓ | ✓ |
| configureModel | ✓ | ✓ | ✓ |
| managePermissions | ✗ | ✗ | ✓ |

---

## 10. 模型集成架构

### 10.1 配置流

```
用户前端
  ├── localStorage: { enabled, providerName, baseUrl, model, apiKey }
  │     写入：ModelSettingsPanel → saveModelConfig()
  │     读取：useEffect → window.localStorage.getItem("wuhuan-model-config")
  │
  └── 提交内容时：
       POST /api/items { ..., modelConfig }
         │
         └── server: reviewWithMiniMax({ modelConfig })
               ├── 用户配置了 enabled + apiKey → 调用用户指定的模型
               ├── 未配置 → 返回 null → 降级为本地规则
               └── 调用失败 → catch → 降级为本地规则
```

### 10.2 安全约束

- API Key 仅存储于 `localStorage`，不写入服务端文件系统
- 服务端日志不输出 `apiKey`
- 错误响应不包含完整 `apiKey`
- API Key 通过 HTTPS 传输（生产环境强制 TLS）
- 前端不暴露在 SSR/SSG 产物中

---

## 11. 部署架构

### 11.1 容器化部署

```
┌─────────────────────────────────────┐
│           Docker Host               │
│  ┌───────────────────────────┐      │
│  │   next (Node.js)          │      │
│  │   Port: 3000              │      │
│  │                           │      │
│  │   Volumes:                │      │
│  │   /data → .wuhuan-data/   │      │
│  │   /app/public/uploads     │      │
│  └───────────────────────────┘      │
└─────────────────────────────────────┘

环境变量：
  WUHUA_DATA_DIR=/data        # 状态文件持久化目录
  NEXT_PUBLIC_BASE_PATH=""    # 子路径部署时设置
```

### 11.2 健康检查

```
GET /api/health → 200 { status: "ok", timestamp: "..." }
```

### 11.3 静态资源

Next.js standalone 模式构建，静态资源（CSS/JS/图片）由 Next.js 自身服务，不依赖外部 CDN。

---

## 12. 安全设计

### 12.1 已实现

- API Key 不写入环境变量和源码仓库（`.gitignore` 忽略 `.env.local`）
- API Key 不记录到服务端日志
- API Key 不完整出现在错误信息中
- 前端密码输入框使用 `type="password"`
- 图片上传限类型（png/jpeg/webp/gif）和大小（5MB）
- 用户提交内容不做 HTML 渲染（XSS 防护）

### 12.2 待实现

- 服务端请求体大小限制（见额外问题 E）
- API 限流
- CSRF 保护
- CSP 头设置
- 真实密码哈希（当前密码为明文比对）
- 会话管理和过期（见问题 3）
- 后端强制鉴权（见问题 21、额外问题 A/L）
- API Key 后端安全存储（见问题 22：当前经请求体明文传输）
- 模型调用超时控制（见问题 23：`minimax.ts:20` 无 AbortController）
- 统一错误响应格式（见问题 25）
- 并发写入保护（见额外问题 K：JSON 文件 last-write-wins 竞态条件）
- 内容删除/编辑机制（见额外问题 C）
- 上传文件认证保护（见额外问题 I）
- 审计日志（见额外问题 M）

---

## 13. 页面与组件对照

### 13.1 PRD 页面需求 → 当前组件

| PRD 页面 | 当前组件 | 状态 |
| --- | --- | --- |
| 登录页 | `LoginScreen` | 已实现 |
| 学员仪表盘 | `StudentDashboard` | 已实现 |
| 深学提交页 | `WorkflowPanel` (phase="deep-study") | 已实现 |
| 跟练提交页 | `WorkflowPanel` (phase="practice") | 已实现 |
| 反思问答页 | `WorkflowPanel` (phase="reflection") | 已实现 |
| 共创观点页 | `CoCreationPanel` | 已实现 |
| 转化成果页 | `TransformationPanel` | 已实现 |
| 模型配置页 | `ModelSettingsPanel` | 已实现 |
| 班级仪表盘 | `TeacherDashboard` | 已实现 |
| 学员内容管理 | `ClassSubmissionPanel` | 已实现 |
| 共创主题管理 | `CoCreationPanel` (role=teacher) | 已实现 |
| 投票与共识报告 | `CoCreationPanel` (投票卡片 + 报告区) | 已实现 |
| 转化追踪 | `TransformationPanel` (role=teacher) | 已实现 |
| 系统仪表盘 | `AdminDashboard` | 已实现 |
| 账号权限管理 | `PermissionMatrix` + 账号清单 | 已实现（只读） |
| 知识库管理 | `KnowledgePanel` | 已实现 |

### 13.2 每个环的提交模板差异化

已按 PRD §4.6 要求实现差异化提交模板（`submissionBlueprints`），每个环有独立的：
- 标题/正文标签
- 占位提示
- 模板section
- 质量检查维度
- 提交按钮文案

---

## 14. 当前实现差距分析（Code-to-PRD Gap Analysis）

以下是对当前代码库与 PRD 要求之间的系统性差距分析。每项差距均经过代码验证。

### 14.1 已验证的 PRD 功能实现状态

| PRD 需求 | 状态 | 当前实现 | 差距 |
| --- | --- | --- | --- |
| 三类角色登录 | ✓ | 演示账号选择，localStorage 记忆 | 无真实验证 |
| 角色权限控制 | ⚠ 仅前端 | `can()` 函数控制 UI 显隐；后端零鉴权 | 后端无强制 |
| 学员提交内容 | ✓ | `addItem()` → `POST /api/items` | 缺少 try-catch |
| 教师查看内容 | ✓ | `ClassSubmissionPanel` + 筛选 | — |
| 合规判断 | ⚠ 简陋 | `text.length >= 85` 判断质量 | 无结构检查 |
| 点赞与优秀池 | ⚠ 合并实现 | `inKnowledgeBase` 直接标记，无独立的优秀池概念 | 缺 `isExcellent` 字段 |
| 模型配置 | ✓ | `ModelSettingsPanel` + localStorage | API Key 经 body 传输 |
| AI 审核 | ⚠ 仅提交 | `reviewWithMiniMax()` 无超时、无重试 | 缺降级标记 |
| 共创多轮 + 饱和 | ⚠ 仅数量判断 | `accepted.length <= 3` 纯计数 | 无语义判断 |
| 共识报告 | ✓ | `generateConsensusReport()` | — |
| 方案生成 | ⚠ 硬编码 | `generatePersonalPlan()` 固定模板 + `.slice(-3)` | 非动态引用 |
| 训后转化追踪 | ⚠ 被动 | 仅在提交证据时更新节点状态 | 无主动提醒检查 |
| 知识库分类 | ✓ | 6 类知识库 Tab 筛选 | — |
| 真实认证 | ✗ | 无 session/JWT/cookie | 全部缺失 |
| 数据库持久化 | ✗ | 单 JSON 文件 | 全部缺失 |
| 多班级隔离 | ✗ | 单 state.json | 全部缺失 |
| 后端鉴权 | ✗ | API 无任何身份/角色校验 | 全部缺失 |

### 14.2 架构重构差距（对应问题清单 一.1–4）

#### 问题 1：单文件巨石组件 — 2516 行

**验证结果：Confirmed** — `src/components/TrainingAgentApp.tsx` 确认为 2516 行。

当前文件中内联了 30+ 个函数/组件：`LoginScreen`、`Dashboard`、`AdminDashboard`、`TeacherDashboard`、`StudentDashboard`、`WorkflowPanel`、`CoCreationPanel`、`TransformationPanel`、`SupervisorPanel`、`KnowledgePanel`、`ModelSettingsPanel`、`ClassSubmissionPanel`、`PlanTargetPanel`、`DeliveryFlowPanel`、`LearningItemCard`、`ImageUploadBox`、`PlanCard`、`EmptyPlan`、`RoleCard`、`PermissionMatrix`、`PermissionButton`、`Metric`、`AccountBadge`、`QueueButton`、`DeliveryLine`、`PlanTargetSelector`、`TeacherHero`、`Metric`。

**应拆分为**：
```
src/components/
├── login/LoginScreen.tsx
├── dashboard/AdminDashboard.tsx
├── dashboard/TeacherDashboard.tsx
├── dashboard/StudentDashboard.tsx
├── workflow/WorkflowPanel.tsx
├── cocreation/CoCreationPanel.tsx
├── transformation/TransformationPanel.tsx
├── supervisor/SupervisorPanel.tsx
├── knowledge/KnowledgePanel.tsx
├── models/ModelSettingsPanel.tsx
├── shared/LearningItemCard.tsx
├── shared/ImageUploadBox.tsx
├── shared/PlanCard.tsx
├── shared/DeliveryFlowPanel.tsx
├── shared/ClassSubmissionPanel.tsx
├── shared/Metric.tsx
└── shared/RoleCard.tsx
```

#### 问题 2：无 App Router 路由

**验证结果：Confirmed** — 所有导航通过 `useState<ViewId>` 切换。仅存在两个路由：`/` 和 `/train`，二者渲染同一组件。无 `/login`、`/dashboard`、`/deep-study` 等独立路由。URL 不反映当前视图，不支持书签和直接访问。

#### 问题 3：无真实登录认证

**验证结果：Confirmed** — 在所有 11 个 API route 中零认证：无 `session`、`jwt`、`token`、`cookie`、`verify`、`401`、`403`。当前"认证"为：用户在前端选择预置账号 → 存入 `localStorage` → 后端信任 `body.author` 字段。

#### 问题 4：JSON 文件持久化

**验证结果：Confirmed** — 全量状态存储于 `.wuhuan-data/state.json`。每次写操作模式为 `readFile → modify → writeFile`，无事务保护，无并发锁。多请求同时写入时存在竞态条件（last-write-wins）。

### 14.3 缺失功能差距（对应问题清单 二.5–14）

#### 问题 5：反思环缺少"你问我答"分步引导

**验证结果：Confirmed** — 当前反思环为单一 textarea，GROW 四要素在同一输入框中一次性填写。PRD §5.4 要求的逐步交互（先问 Goal → 判断深度 → 再问 Reality → ...→ 汇总为完整案例）完全未实现。

**涉及文件**：`TrainingAgentApp.tsx:139-186`（`submissionBlueprints.reflection`）、`agents.ts:reviewLearningItem()`

#### 问题 6：共创主题硬编码

**验证结果：Confirmed** — 主题 `"如何提升培训成果转化率"` 硬编码在 `agents.ts:672` 的 `initialCoCreation` 中。缺少：
- `POST /api/co-creation/topics` 创建主题
- `GET /api/co-creation/topics` 列表
- 前端主题选择器和创建入口

#### 问题 7：无班级分组

**验证结果：Confirmed** — `CoCreationState` 类型（`agents.ts:132-142`）中无 `group` 字段。"分组"仅在描述性文本中出现。无法按小组组织共创、无法分组统计投票。

#### 问题 8：无"我的方案"确认流程

**验证结果：Confirmed** — 方案生成后立即生效，无中间确认状态。缺少：
- `PersonalPlan` 无 `status` 字段（如 `"待确认" | "已确认"`）
- 无 `POST /api/plans/confirm` 端点
- 学员端无确认按钮

#### 问题 9：无主动训后提醒

**验证结果：Confirmed** — 尽管 checkpoints 存储了 D+30/D+90 日期，但页面加载时不检查"今天是否有到期节点"。不会在仪表盘显示提醒卡片。节点状态仅在学员提交转化证据时才被动更新。

**涉及文件**：`server-state.ts:79-86`（被动更新逻辑）、`agents.ts:599-601`（checkpoint 初始化）

#### 问题 10：无 AI 成果评估

**验证结果：Confirmed** — 转化成果提交后仅将节点状态置为 `"已评估"`（`server-state.ts:83`），不调用任何 AI 做三维评估（完成度/落地性/改进空间）。`reviewWithMiniMax()` 仅用于内容审核，未被转化环复用。

#### 问题 11：学员端无法查看公开优秀内容

**验证结果：Confirmed** — 学员角色不含 `viewKnowledgeBase` 权限（`agents.ts:385-386`）。`KnowledgePanel` 对学员不可见。学员仅能在各环节的"互动内容池"中看到该环节的内容，无跨环节的"公开优秀内容"统一视图。

#### 问题 12：无管理员账号管理

**验证结果：Confirmed** — 演示账号硬编码在 `agents.ts:389-435`。无 CRUD API（`/api/admin/accounts`），无法创建、禁用、修改角色。

#### 问题 13：无模型调用测试

**验证结果：Confirmed** — `ModelSettingsPanel` 仅有"保存配置"按钮，无"测试连接"按钮。无 `POST /api/model/test` 端点。用户无法验证配置是否正确。

#### 问题 14：无内容列表分页

**验证结果：Confirmed** — 所有 API 路由（`/api/items`、`/api/state`、`/api/co-creation/*` 等）均不接受 `page`/`pageSize`/`limit`/`offset` 参数。前端直接渲染全部条目。当内容量增长时无法扩展。

### 14.4 业务逻辑差距（对应问题清单 三.15–20）

#### 问题 15：质量判断仅基于字数

**验证结果：Confirmed** — `agents.ts:478`：
```typescript
const quality = text.length >= 85 ? "优秀" : text.length >= 28 ? "合规" : "待补充";
```
完全忽略 PRD §4.6 定义的结构化质量维度：深学环的"看到/理解/迁移"三段、跟练环的"照片/发现/复用"、反思环的 GROW 四段、共创环的"一行一观点+理由"、转化环的"场景/动作/证据/改进"。

#### 问题 16：方案生成非动态引用

**验证结果：Confirmed** — `generatePersonalPlan()` (`agents.ts:579-606`)：
- 推荐文本硬编码：`建议 ${student} 围绕"提升课堂提问质量和学生参与度"形成小步行动方案...`
- 行动步骤所有学员相同
- 引用案例仅为 `.filter(phase).slice(-3)` 取最近 3 条，无相关性排序
- 不调用 LLM

#### 问题 17：标签系统过于简单

**验证结果：Confirmed** — `agents.ts:466-473`：6 组关键词数组，通过 `String.includes()` 匹配。前端知识库表格仅展示标签，管理员无法手动编辑。

#### 问题 18：共创收敛无语义判断

**验证结果：Confirmed** — `agents.ts:563` 收敛条件为纯计数：`accepted.length <= 3 || nextRound >= maxRounds`。即使配置了模型，也不调用语义相似度判断。`normalizeIdea()` (`agents.ts:712-714`) 去重仅去除标点和空白后取前 24 字符，过于激进。

#### 问题 19：未区分"优秀内容池"与"知识库入库"

**验证结果：Confirmed** — `LearningItem` 仅有 `inKnowledgeBase: boolean` 一个字段。点赞达标时直接设为 `true`（`server-state.ts:116-118`），省略了 PRD 定义的中间状态："优秀内容池"（点赞达标）→ 结构化入库（额外条件 + 管理员确认）。缺少 `isExcellent` 字段。

#### 问题 20：数据模型字段缺失

**验证结果：Confirmed** — `LearningItem` 类型（`agents.ts:90-106`）缺少：
- `submitterId`（用户唯一标识，当前仅用 `author: string`）
- `submitterRole`（提交者角色）
- `updatedAt`（更新时间，当前仅有隐式的创建时间在 ID 中）
- `isExcellent`（是否进入优秀内容池，当前与入库合并）

`KnowledgeEntry` 类型（`agents.ts:72-81`）缺少：
- `originalItemId`（追溯源条目，当前为 `kb-{item.id}` 隐含关系但非显式字段）

### 14.5 安全与健壮性差距（对应问题清单 四.21–25）

#### 问题 21：所有 API 路由缺少身份验证中间件

**验证结果：Confirmed** — 全部 11 个 API route 直接执行业务逻辑，零身份或权限验证。`POST /api/items` 信任请求体中的 `author` 字段；`GET /api/state` 向任何人返回全量数据。无统一错误响应格式。

#### 问题 22：API Key 通过请求体传输

**验证结果：Confirmed** — 提交内容时，`modelConfig` 对象（含明文 `apiKey`）通过 `POST /api/items` 的 JSON body 从前端发送到后端（`TrainingAgentApp.tsx:347` → `items/route.ts:16` → `minimax.ts:16-17`）。密钥在请求中为明文，虽通过 HTTPS 传输但增加了暴露面。

#### 问题 23：模型调用无超时控制

**验证结果：Confirmed** — `minimax.ts:20` 的 `fetch()` 调用无 `AbortController`、无 `signal`、无超时参数。如果外部模型服务挂起，请求将无限期阻塞，可能导致 Node.js 事件循环积压。

#### 问题 24：提交失败时前端表单处理不完整

**验证结果：Partially Confirmed（部分正确）** — 当 HTTP 响应状态非 2xx 时（`!response.ok`，`TrainingAgentApp.tsx:350-352`），函数仅设置通知后返回，不清空附件和草稿——这**是正确的**。**但**存在一个真实 bug：整个 `addItem` 函数（行 331-364）**没有 try-catch**。如果 `fetch()` 因网络异常抛出（DNS 失败、连接拒绝），异常未被捕获，可能导致 React 渲染崩溃。

**对比**：`refreshSharedState()` 在行 275 正确使用了 `.catch()`，说明这是一个疏漏而非有意设计。

#### 问题 25：错误响应格式不统一

**验证结果：Confirmed** — 错误格式不一致：
- `plans/generate`、`co-creation/vote`、`uploads` 等返回 `{ error: string }` + HTTP 状态码
- `items/route.ts:21-22` 在 catch 块中仅 `console.error(error)` 后静默继续，不返回错误
- 无统一的 `code` 字段（如 `"UNAUTHORIZED"`、`"VALIDATION_ERROR"`、`"FORBIDDEN"`）
- 所有路由都没有输入验证错误处理

### 14.6 代码验证摘要

所有 25 项问题均已通过阅读源码和 grep 验证。其中 24 项完全确认，1 项部分确认（#24：HTTP 错误时表单保护正确，但网络异常时缺少 try-catch）。以下是每项问题的代码定位：

| # | 主要涉及文件 | 关键行号 |
| --- | --- | --- |
| 1 | `src/components/TrainingAgentApp.tsx` | 全文 2516 行 |
| 2 | `src/app/` | 仅 `/` 和 `/train` 两个路由 |
| 3 | `src/app/api/*/route.ts` | 全部 11 个路由，零认证代码 |
| 4 | `src/lib/server-state.ts` | 32, 48-50（readFile/writeFile） |
| 5 | `TrainingAgentApp.tsx` | 139-186（submissionBlueprints.reflection） |
| 6 | `agents.ts` | 672（硬编码主题） |
| 7 | `agents.ts` | 132-142（CoCreationState 无 group 字段） |
| 8 | `agents.ts`, `server-state.ts` | 579-606, 221-228（无确认流程） |
| 9 | `server-state.ts`, `TrainingAgentApp.tsx` | 79-86, 仪表盘渲染（无主动检查） |
| 10 | `server-state.ts` | 79-86（仅状态标记，无 AI 评估） |
| 11 | `agents.ts` | 385-386（学员无 viewKnowledgeBase） |
| 12 | `agents.ts` | 389-435（硬编码账号列表） |
| 13 | `TrainingAgentApp.tsx`, `src/app/api/` | ModelSettingsPanel，无 /api/model/test |
| 14 | `src/app/api/` | 全部路由，无分页参数 |
| 15 | `agents.ts` | 478（纯字数判断） |
| 16 | `agents.ts` | 579-606（硬编码推荐文本） |
| 17 | `agents.ts` | 466-473（6 组关键词），KnowledgePanel 无编辑 |
| 18 | `agents.ts` | 563, 712-714（计数收敛，弱去重） |
| 19 | `agents.ts` | 90-106（LearningItem 无 isExcellent） |
| 20 | `agents.ts` | 72-106（缺失字段） |
| 21 | `src/app/api/*/route.ts` | 全部路由零中间件 |
| 22 | `TrainingAgentApp.tsx`, `minimax.ts` | 347, 16-17（modelConfig 含 apiKey 经 body） |
| 23 | `minimax.ts` | 20（fetch 无 signal/timeout） |
| 24 | `TrainingAgentApp.tsx` | 331-364（addItem 无 try-catch） |
| 25 | `src/app/api/*/route.ts` | 不一致的 error 响应格式 |

### 14.7 生产化改造路径

```
阶段 1：数据层升级
  JSON 文件 → SQLite（单机）→ PostgreSQL（多实例）
  添加数据库迁移工具（drizzle/prisma）
  解决：问题 4, 19, 20, 额外问题 E/K

阶段 2：认证升级
  演示账号 → NextAuth.js + 密码哈希 + 会话管理
  添加注册、密码重置流程
  解决：问题 3, 12, 21, 22

阶段 3：架构拆分
  拆分 TrainingAgentApp.tsx 为独立组件模块
  引入 App Router 路由（/login, /dashboard, /deep-study, ...）
  添加 API 中间件统一鉴权
  解决：问题 1, 2, 14, 21, 25, 额外问题 A/B/L

阶段 4：业务深度
  GROW 分步引导（问题 5）
  共创主题管理（问题 6）
  班级分组（问题 7）
  方案确认流程（问题 8）
  结构化质量判断（问题 15）
  动态方案生成 + RAG（问题 16, 18）
  区分优秀池与入库（问题 19）
  标签系统增强（问题 17）
  解决：问题 5-11, 13, 15-18

阶段 5：智能化增强
  AI 成果三维评估（问题 10）
  语义去重（问题 18）
  LLM 超时控制（问题 23）
  模型路由和降级策略完善
  解决：问题 10, 18, 23

阶段 6：运维增强
  训后主动提醒（问题 9, 额外问题 M）
  多班级/多租户隔离（额外问题 H）
  日志系统、监控告警、审计日志
  备份策略、CI/CD 流水线
  解决：问题 9, 额外问题 F/H/J/M
```

---

## 15. 关键设计决策记录

| 决策 | 选择 | 原因 |
| --- | --- | --- |
| 状态管理模式 | 服务端 JSON + fetch 同步 | 快速原型验证，无需引入数据库 |
| 前端架构 | 单文件 SPA 组件 | 演示阶段避免过早路由拆分 |
| AI 集成方式 | OpenAI-compatible API | 最大兼容性，用户可接任意厂商 |
| 共创去重策略 | 字符串标准化比较 | 简单可靠，无需嵌入向量 |
| 知识库结构 | 关系型字段 + JSON 文件 | 与 PRD 定义一致，便于未来迁移到数据库 |
| 权限模型 | ACL 列表 | 三种角色差异明确，无需 RBAC 的复杂性 |
| 构建工具 | Next.js standalone | 支持 Docker 部署，输出小 |

---

## 16. 额外发现的问题（未在原始清单中）

以下 13 个问题在代码审查中额外发现，均经过源码验证：

### A. `/api/state` 无认证返回全量数据 [高]

**代码位置**：`src/app/api/state/route.ts:4-7`

`GET /api/state` 返回完整 `SharedState`（所有 items、knowledgeBase、coCreation、plansByStudent）给任何客户端，零认证。学员可通过浏览器 devtools 查看所有其他学员的提交内容、教师为所有学员生成的方案。前端按角色过滤视图，但 API 无任何数据隔离。

### B. `addItem()` 缺少 try-catch [中]

**代码位置**：`TrainingAgentApp.tsx:331-364`

`addItem` 函数中的 `fetch()` 调用无 try-catch 包裹。如果发生网络异常（DNS 失败、连接拒绝），异常未被捕获，可能导致 React 渲染崩溃。对比同文件的 `refreshSharedState()`（行 275）正确使用了 `.catch()`。

### C. 无内容删除或编辑能力 [中]

**代码位置**：`src/app/api/`（全部路由）

整个系统中零 `DELETE`、`PUT` 或 `PATCH` 端点。一旦提交，items、knowledge entries、plans、co-creation 状态永久不可变。无法修复拼写错误或删除不适当内容。

### D. `generatePersonalPlan` 对所有学员返回相同建议 [中]

**代码位置**：`agents.ts:592`

推荐文本为固定模板字符串，仅插值替换学员姓名。无论学员提交了 10 条高质量批注还是零提交，收到的建议完全相同。

### E. 缺少输入验证 [中]

**代码位置**：`src/app/api/items/route.ts:7-15`（及其他路由）

API 路由不验证 title/body 长度、类型或恶意内容。可提交空字符串（`title: ""`）、极长文本（10MB+ body）或未净化的内容。

### F. `normalizeIdea` 去重过于激进 [低]

**代码位置**：`agents.ts:712-714`

```typescript
function normalizeIdea(value: string) {
  return value.replace(/[，。,.、\s]/g, "").slice(0, 24);
}
```

移除所有标点和空白后仅保留前 24 字符。`"建立课堂观察模板系统"` 和 `"建立课堂观察模板工具"` 会被视为重复（均截断为 `"建立课堂观察模板"`）。

### G. `parseJsonObject` 可能误解析 LLM 输出 [低]

**代码位置**：`minimax.ts:85-93`

正则 `/\{[\s\S]*\}/` 贪婪匹配到**最后一个** `}`。如果 LLM 响应中包含嵌套 JSON 示例或代码块（含花括号内容），可能提取错误片段。

### H. 无多班级/多期次数据隔离 [中]

**代码位置**：`server-state.ts:31-32`，`agents.ts:389-435`

整个系统使用单一 `state.json`。所有演示账号共享一个数据空间。无班级（class）、期次（cohort）或组织（organization）概念。运行第二期培训需要部署第二个实例。

### I. 上传图片可无需认证访问 [中]

**代码位置**：`uploads/[file]/route.ts:31-35`

图片服务端点为 `Cache-Control: public, max-age=31536000, immutable`——任何人获取 URL 后可永久无认证访问所有上传图片。

### J. `voteSharedIdea` 不验证观点是否存在 [低]

**代码位置**：`server-state.ts:148-168`

可以向任意字符串投票，即使该字符串不在 `coCreation.ideas` 列表中。孤立投票会持久化在 `votes` 和 `voters` 映射中。

### K. 无并发写入保护 [高]

**代码位置**：`server-state.ts`（全部写操作）

所有写操作遵循 `readSharedState() → 修改内存对象 → writeSharedState()` 模式。两次 `readSharedState()` 调用之间，另一个请求的写入会被静默覆盖（last-write-wins），因为 JSON 文件没有行级锁或乐观并发控制。

### L. 仅前端角色强制 [中]

**代码位置**：`TrainingAgentApp.tsx:323-324`（`can()` 函数）

所有角色检查均在客户端执行。用户可通过浏览器 devtools 修改 React state 以任何角色访问任何视图，并调用任何 API——因为后端从不重新验证角色或权限。

### M. 无审计日志 [低]

**代码位置**：全项目

无提交记录、点赞记录、方案生成记录或投票记录。唯一"日志"为 `items/route.ts:22` 中 AI 调用失败时的 `console.error(error)`。无法追溯谁在何时做了何事。

---

## 17. 文件结构

```
src/
├── middleware.ts                       # 路径重写
├── app/
│   ├── layout.tsx                      # 根布局
│   ├── page.tsx                        # 首页 → TrainingAgentApp
│   ├── globals.css                     # 全局样式（Tailwind + CSS 变量）
│   ├── train/
│   │   └── page.tsx                    # /train 路由（复刻首页）
│   └── api/
│       ├── health/route.ts             # GET 健康检查
│       ├── state/route.ts              # GET 获取全量状态
│       ├── items/
│       │   ├── route.ts                # POST 提交内容
│       │   └── like/route.ts           # POST 点赞
│       ├── uploads/
│       │   ├── route.ts                # POST 上传图片
│       │   └── [file]/route.ts         # GET 查看图片
│       ├── co-creation/
│       │   ├── ideas/route.ts          # POST 提交观点
│       │   ├── run/route.ts            # POST 运行收敛
│       │   └── vote/route.ts           # POST 投票
│       └── plans/
│           ├── generate/route.ts       # POST 生成方案
│           └── checkpoint/route.ts     # POST 更新节点
├── components/
│   └── TrainingAgentApp.tsx            # 主应用组件（所有 UI）
└── lib/
    ├── agents.ts                       # 业务逻辑、类型定义、本地规则
    ├── server-state.ts                 # 服务端状态持久化
    └── minimax.ts                      # AI 模型调用适配层

docs/
├── AGENT_PRD.md                        # 产品需求文档
└── DESIGN.md                           # 本文档

.wuhuan-data/
└── state.json                          # 运行时状态文件（.gitignore）
```

---

## 附录 A：术语对照

| 中文 | 英文/代码标识 |
| --- | --- |
| 五环共创培训智能体 | Wuhuan Co-creation Training Agent |
| 总教练 | Head Coach / supervisor |
| 深学环 | Deep Study / `deep-study` |
| 跟练环 | Practice / `practice` |
| 反思环 | Reflection / `reflection` |
| 共创环 | Co-creation / `co-creation` |
| 转化环 | Transformation / `transformation` |
| 批注 | Annotation |
| 即时贴 | Sticky Note |
| GROW 模型 | Goal-Reality-Options-Will |
| 智慧饱和 | Wisdom Saturation / convergence |
| 共识报告 | Consensus Report |
| 个性化方案建议报告 | Personalized Plan Recommendation |
| 我的方案 | My Plan |
| 个人行动计划 | Personal Action Plan |
| 转化成果 | Transformation Evidence |
| 知识库 | Knowledge Base |

---

## 附录 B：PRD 覆盖检查

| PRD 章节 | 设计覆盖 |
| --- | --- |
| §1 产品概述 | §1 设计目标与约束 |
| §2 用户与角色 | §9 认证与授权 |
| §3 核心业务流程 | §7 共创引擎、§8 知识库、§6 智能体 |
| §4 用户交付逻辑优化 | §3 前端架构（交付路径、差异化模板） |
| §5 功能需求 | §6 智能体架构 |
| §6 模型配置需求 | §10 模型集成架构 |
| §7 数据与知识库设计 | §5 数据模型、§8 知识库 |
| §8 页面需求 | §13 页面与组件对照 |
| §9 权限规则 | §9.3 权限矩阵 |
| §10 非功能需求 | §11 部署、§12 安全 |
| §11 验收标准 | §14 里程碑与技术债务 |
| §12 里程碑建议 | §14.2 生产化改造路径 |
| §13 风险与约束 | §16 待解决的设计问题 |
