# 五环共创培训智能体 — 更新日志

> 分支: `glm-edited` | 基线: `main` | 变更: 75 文件, +8221 / -2646 行

---

## 一、架构重构

### 1.1 前端单体拆分为多页面路由

**移除:** `src/components/TrainingAgentApp.tsx`（~2443 行单体组件）

**替换为** Next.js App Router 路由组架构：

| 路由 | 文件 | 功能 |
|------|------|------|
| `/login` | `(auth)/login/page.tsx` | 登录页 + 演示账号快捷登录 |
| `/dashboard` | `(main)/dashboard/page.tsx` | 角色化工作台（提醒/交付路径/模块入口） |
| `/coach` | `(main)/coach/page.tsx` | 总教练面板（生成个性化方案） |
| `/deep-study` | `(main)/deep-study/page.tsx` | 深学环（通用工作流页面） |
| `/practice` | `(main)/practice/page.tsx` | 实践环（通用工作流页面） |
| `/reflection` | `(main)/reflection/page.tsx` | 反思环（GROW 引导 / 直接提交双模式） |
| `/co-creation` | `(main)/co-creation/page.tsx` | 共创环（主题管理/观点提交/收敛） |
| `/transformation` | `(main)/transformation/page.tsx` | 转化环（方案确认/证据提交） |
| `/knowledge` | `(main)/knowledge/page.tsx` | 知识库（阶段筛选 + 分页） |
| `/model-settings` | `(main)/model-settings/page.tsx` | 模型配置（加密存储 + 连接测试） |
| `/admin/accounts` | `(main)/admin/accounts/page.tsx` | 账号管理 CRUD（仅 admin） |

共享组件拆分：
- `AuthProvider.tsx` — 认证上下文（user/login/logout/hasPermission）
- `Sidebar.tsx` — 左侧导航栏（角色可见性控制）
- `SharedComponents.tsx` — `LearningItemCard` + `ImageUploadBox`
- `hooks.tsx` — `useFetch<T>` + `Pagination`
- `WorkflowPanel.tsx` — `PhaseWorkflowPage` 通用阶段工作流

### 1.2 JSON 文件存储替换为 SQLite

**移除:** `src/lib/server-state.ts`（读写 `.wuhuan-data/state.json`）

**替换为** SQLite + Drizzle ORM 持久化层：

- 数据库: `better-sqlite3`，WAL 模式，外键约束开启
- ORM: `drizzle-orm`，类型安全查询
- 数据目录: `WUHUA_DATA_DIR` 环境变量控制，默认 `.wuhuan-data/wuhuan.db`
- 迁移: `CREATE TABLE IF NOT EXISTS` 幂等建表
- 种子: 5 个演示账号（admin/teacher/student/student2/student3），bcrypt 密码哈希

Schema 共 **16 张表**，详见第四节"数据模型"。

### 1.3 客户端硬编码登录替换为 JWT 认证

**旧逻辑:** 组件内硬编码匹配 demoAccounts
**新逻辑:**

- JWT 签发: `jose` 库，HS256 算法，24h 有效期
- 密码哈希: `bcryptjs`，10 轮 salt
- Cookie: `wuhuan_session`，httpOnly，SameSite=Lax，生产环境 Secure
- 服务端获取用户: `getCurrentUser()` / `getUserFromRequest()`
- 中间件守卫: 所有非公开路由强制验证 JWT，未认证 API 返回 401 JSON，页面重定向到 `/login?from=原路径`

---

## 二、新增功能

### 2.1 GROW 反思引导 Q&A 流程

- 服务端状态机: `grow_sessions` 表，步骤 goal → reality → options → will → complete，不可回退
- 引导问题: 每步显示对应提示（"你希望达成什么目标？" / "目前的实际情况？" / "可选行动方案？" / "决定采取哪个行动？"）
- 完成后一键合成四步答案为完整反思案例提交
- 支持"重新开始"重置 session

### 2.2 共创主题管理

- 多主题支持: 可创建/切换共创主题，新主题自动停用旧主题
- 观点提交: 每行一条观点，自动去重合并
- 投票机制: 为观点投票，防重复
- 收敛判断: 新增观点 ≤ 3 条自动收敛；AI 语义判断重复 > 80% 收敛；最多 `maxRounds` 轮
- 共识报告: 收敛后自动生成

### 2.3 班级分组管理

- 创建分组 + 设置成员
- admin/teacher 可操作

### 2.4 个人计划确认流程

- 教练为学员生成方案: 从知识库取 5 条相关条目动态引用，生成 recommendation + actions + checkpoints（D+30 / D+90）
- 学员确认方案: 设 confirmed=true，自动创建 D+30/D+90 reminders
- Checkpoint 证据提交: 关联学习条目作为落地证据

### 2.5 训后提醒

- D+30 / D+90 两个关键节点自动创建提醒
- 学生看自己的到期提醒，admin/teacher 看全部
- 提醒状态: pending → notified → resolved

### 2.6 AI 成果评估

- 三维度评分: completeness（完整性）、practicality（落地性）、improvementSpace（改进空间），0-100 分
- 结构化评估: 基于正则模式匹配场景/行动/证据/改进关键词
- AI 增强评估: 若用户有已启用的模型配置，请求 AI 返回评分 JSON，解析失败 fallback 到结构化评估

### 2.7 学员访问公开内容

- Dashboard 展示"公开优秀内容"入口
- 知识库页面支持阶段筛选
- 所有内容列表支持分页

### 2.8 管理员账号管理

- 账号列表 + 创建/编辑/启用禁用/删除
- 禁止自删自禁
- 密码可选更新（留空保留原值）

### 2.9 模型连接测试

- 保存前测试 API 连通性
- 显示响应延迟（ms）
- 30s 超时保护

### 2.10 内容列表分页

- 所有列表 API 统一分页参数: `page`, `pageSize`
- 响应格式: `{ data: T[], total, page, pageSize }`
- 前端 `Pagination` 组件

---

## 三、业务逻辑修正

### 3.1 各阶段结构化质量检查

替换原有的纯字数判断（<20字=待补充），改为正则模板匹配：

| 阶段 | 必须匹配模式 | 默认标签 |
|------|-------------|----------|
| deep-study | 看到/观察/发现 + 理解/重要/意义 + 迁移/应用/复用 | 教学设计, 课堂观察 |
| practice | 照片/现场/记录 + 发现/操作/步骤/技能 + 复用/下次/改进 | 实训技能, 课堂观察 |
| reflection | 目标/Goal/希望 + 现状/Reality/实际 + 选择/Options/方案 + 行动/Will/决定 | 结构化反思 |
| co-creation | 任意非空 + 含"因为/理由"行=优秀 | 群体共创 |
| transformation | 场景/情境/应用 + 动作/行动/执行 + 证据/结果/效果 + 改进/下一步/优化 | 行动转化 |

质量判定: requiredRatio=1 且 partial 命中 → 优秀; requiredRatio ≥ 0.5 → 合规; 否则 → 待补充

### 3.2 动态知识库引用

生成个人方案时，从知识库检索最近 5 条相关条目作为 `citedCases`，不再硬编码。

### 3.3 优秀内容池与知识库条目区分

- `isExcellent`: 达到 likes threshold 自动标记，进入"优秀内容池"
- `inKnowledgeBase`: 需人工/审核入库，要求 isExcellent 且 quality≠待补充
- 入库时同步创建 `knowledge_entries` 记录，两个体系独立运作

### 3.4 语义收敛判断

共创收敛不再仅看观点数量，增加 AI 语义判断:
- 新增观点 ≤ 3 → 自动收敛
- AI 判断语义重复率 > 80% → 收敛
- 超过 maxRounds → 强制收敛

### 3.5 标签系统增强

- `extractKeywordTags()` 按六类关键词自动提取标签
- 每个阶段有默认标签兜底
- 标签独立存储在 `learning_item_tags` / `knowledge_entry_tags` 联合主键表

---

## 四、数据模型补全

共 16 张表，4 个索引：

| 表 | 关键字段 | 说明 |
|----|---------|------|
| `users` | id, username(UNIQUE), passwordHash, role(admin/teacher/student), className, disabled | 用户 |
| `learning_items` | id, phase(5阶段), body, submitterId→users, likes, threshold(3), quality(待补充/合规/优秀), isExcellent, inKnowledgeBase, reviewSource, aiSummary | 学习条目 |
| `learning_item_tags` | itemId+tag (PK) | 条目标签 |
| `learning_item_attachments` | id(AUTO), itemId, url, name, mimeType, size | 附件 |
| `learning_item_voters` | itemId+voterId (PK) | 点赞记录 |
| `knowledge_entries` | id, originalItemId→items, phase, summary, source | 知识库条目 |
| `knowledge_entry_tags` | entryId+tag (PK) | 知识库标签 |
| `co_creation_topics` | id, title, round, maxRounds, converged, report, isActive | 共创主题 |
| `co_creation_ideas` | id, topicId→topics, content, category | 共创观点 |
| `co_creation_votes` | ideaId+voterId (PK) | 观点投票 |
| `personal_plans` | id, studentId→users, recommendation, confirmed | 个人方案 |
| `personal_plan_actions` | id(AUTO), planId, actionText, sortOrder | 方案行动项 |
| `personal_plan_checkpoints` | id(AUTO), planId, label, day(D+30/D+90), dueDate, status, evidenceItemId | 检查点 |
| `personal_plan_cited_cases` | id(AUTO), planId, caseTitle | 引用案例 |
| `model_configs` | id(AUTO), userId(UNIQUE)→users, apiKeyEncrypted | 模型配置 |
| `class_groups` | id, name | 班级分组 |
| `class_group_members` | groupId+userId (PK) | 分组成员 |
| `content_assessments` | id, itemId→items, completeness, practicality, improvementSpace | 成果评估 |
| `grow_sessions` | id, userId→users, currentStep(goal/reality/options/will/complete) | GROW 会话 |
| `reminders` | id, studentId→users, planId→plans, checkpointDay, dueDate, status(pending/notified/resolved) | 训后提醒 |

索引: `li_phase_idx`, `li_submitter_idx`, `cci_topic_idx`, `pp_student_idx`

---

## 五、安全加固

### 5.1 Auth Middleware 保护所有 API 路由

- `withAuth()` HOC 包装所有需认证路由
- 支持角色白名单: `withAuth(handler, { roles: ["admin"] })`
- 统一错误捕获: `ApiError` 返回对应状态码，未知错误返回 500

### 5.2 API Key 加密存储

- AES-256-GCM 加密，16 字节 IV + 16 字节 AuthTag
- 存储格式: `iv:tag:ciphertext`（HEX）
- 密钥: `ENCRYPTION_KEY` 环境变量，SHA-256 派生 256-bit key
- 读取时脱敏: 显示前 4 后 4 位，中间 `****`

### 5.3 模型调用超时 + 本地降级

- 30s AbortController 超时
- AI 审核失败自动 fallback 到本地结构化审核
- AI 收敛判断失败 fallback 到纯数量判断

### 5.4 统一错误格式

```json
{ "error": "错误描述", "code": "UNAUTHORIZED|FORBIDDEN|VALIDATION_ERROR|INTERNAL_ERROR" }
```

### 5.5 Middleware 中文名称处理

- HTTP Header 仅支持 ByteString（ASCII ≤ 255）
- `x-user-name` 使用 `encodeURIComponent()` 编码中文字符

---

## 六、API 路由清单

| 路由 | 方法 | 认证 | 角色 | 功能 |
|------|------|------|------|------|
| `/api/auth/login` | POST | 公开 | — | 登录，签发 JWT |
| `/api/auth/logout` | POST | 公开 | — | 清除 session cookie |
| `/api/auth/me` | GET | JWT | — | 获取当前用户 |
| `/api/items` | GET | JWT | — | 分页查询学习条目 |
| `/api/items` | POST | JWT | — | 创建学习条目 |
| `/api/items/like` | POST | JWT | — | 点赞 |
| `/api/knowledge` | GET | JWT | — | 分页查询知识库 |
| `/api/co-creation/topics` | GET | JWT | — | 列出共创主题 |
| `/api/co-creation/topics` | POST | JWT | admin/teacher | 创建共创主题 |
| `/api/co-creation/ideas` | POST | JWT | — | 提交共创观点 |
| `/api/co-creation/vote` | POST | JWT | — | 投票 |
| `/api/co-creation/run` | POST | JWT | admin/teacher | 运行收敛轮次 |
| `/api/reflection/grow` | GET | JWT | — | 获取 GROW session |
| `/api/reflection/grow` | POST | JWT | — | 保存步骤答案 / 重置 |
| `/api/plans/generate` | POST | JWT | admin/teacher | 生成个人方案 |
| `/api/plans/confirm` | GET | JWT | — | 获取方案列表 |
| `/api/plans/confirm` | POST | JWT | — | 确认方案 |
| `/api/plans/checkpoint` | POST | JWT | — | 提交 checkpoint 证据 |
| `/api/groups` | GET | JWT | admin/teacher | 列出班级分组 |
| `/api/groups` | POST | JWT | admin/teacher | 创建分组 |
| `/api/reminders` | GET | JWT | — | 获取到期提醒 |
| `/api/admin/accounts` | GET | JWT | admin | 列出所有账号 |
| `/api/admin/accounts` | POST | JWT | admin | 创建账号 |
| `/api/admin/accounts/[id]` | PUT | JWT | admin | 更新账号 |
| `/api/admin/accounts/[id]` | DELETE | JWT | admin | 删除账号 |
| `/api/model/config` | GET | JWT | — | 获取模型配置(脱敏) |
| `/api/model/config` | POST | JWT | — | 保存模型配置 |
| `/api/model/test` | POST | JWT | — | 测试模型连接 |
| `/api/health` | GET | 公开 | — | 健康检查 |
| `/api/state` | GET | JWT | — | 兼容旧接口 |

---

## 七、依赖与部署

### 7.1 新增运行时依赖

| 包 | 版本 | 用途 |
|----|------|------|
| `bcryptjs` | ^3.0.3 | 密码哈希 |
| `better-sqlite3` | ^12.9.0 | SQLite 驱动 |
| `drizzle-orm` | ^0.45.2 | ORM |
| `jose` | ^6.2.3 | JWT 签发/验证 |

### 7.2 新增开发依赖

| 包 | 版本 | 用途 |
|----|------|------|
| `@types/bcryptjs` | ^2.4.6 | 类型定义 |
| `@types/better-sqlite3` | ^7.6.13 | 类型定义 |
| `drizzle-kit` | ^0.31.10 | 数据库迁移工具 |

### 7.3 Docker 变更

- 新增环境变量: `JWT_SECRET`, `ENCRYPTION_KEY`, `WUHUA_DATA_DIR=/data`
- 持久化卷: `wuhuan_data` 挂载到 `/data`
- 构建阶段增加 `python3 make g++`（编译 better-sqlite3 native 模块）

---

## 八、已知待优化项

| 优先级 | 问题 | 位置 |
|--------|------|------|
| 高 | 共创详情页 `loadTopicDetail()` 调用 `/api/state` 数据不匹配，需新增主题详情 API | `co-creation/page.tsx` |
| 中 | `coach/page.tsx` 使用 `useState()` 初始化 fetch，应改用 `useEffect` | `coach/page.tsx:17` |
| 中 | `listItems()` / `listGroups()` 存在 N+1 查询，数据增长后需优化 | `services/items.ts`, `services/groups.ts` |
| 中 | `getEntriesForStudent()` 未使用 `submitterId` 参数筛选 | `services/knowledge.ts:81` |
| 中 | 登录接口每次执行 `runMigrations()` + `seedDatabase()`，应移至应用启动 | `api/auth/login/route.ts` |
