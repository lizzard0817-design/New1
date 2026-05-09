import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";

/* ── Users ── */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "teacher", "student"] }).notNull(),
  className: text("class_name").notNull().default(""),
  title: text("title").notNull().default(""),
  disabled: integer("disabled", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

/* ── Learning Items ── */
export const learningItems = sqliteTable("learning_items", {
  id: text("id").primaryKey(),
  phase: text("phase", { enum: ["deep-study", "practice", "reflection", "co-creation", "transformation"] }).notNull(),
  type: text("type").notNull(),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""),
  submitterId: text("submitter_id").notNull().references(() => users.id),
  submitterRole: text("submitter_role", { enum: ["admin", "teacher", "student"] }).notNull(),
  author: text("author").notNull().default(""),
  likes: integer("likes").notNull().default(0),
  threshold: integer("threshold").notNull().default(3),
  quality: text("quality", { enum: ["待补充", "合规", "优秀"] }).notNull().default("待补充"),
  inKnowledgeBase: integer("in_knowledge_base", { mode: "boolean" }).notNull().default(false),
  isExcellent: integer("is_excellent", { mode: "boolean" }).notNull().default(false),
  reviewSource: text("review_source"),
  aiSummary: text("ai_summary"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const learningItemTags = sqliteTable("learning_item_tags", {
  itemId: text("item_id").notNull().references(() => learningItems.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
}, (t) => [uniqueIndex("lit_pk").on(t.itemId, t.tag)]);

export const learningItemAttachments = sqliteTable("learning_item_attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemId: text("item_id").notNull().references(() => learningItems.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
});

export const learningItemVoters = sqliteTable("learning_item_voters", {
  itemId: text("item_id").notNull().references(() => learningItems.id, { onDelete: "cascade" }),
  voterId: text("voter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (t) => [uniqueIndex("liv_pk").on(t.itemId, t.voterId)]);

/* ── Knowledge Entries ── */
export const knowledgeEntries = sqliteTable("knowledge_entries", {
  id: text("id").primaryKey(),
  originalItemId: text("original_item_id").references(() => learningItems.id),
  phase: text("phase", { enum: ["deep-study", "practice", "reflection", "co-creation", "transformation"] }).notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  source: text("source").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const knowledgeEntryTags = sqliteTable("knowledge_entry_tags", {
  entryId: text("entry_id").notNull().references(() => knowledgeEntries.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
}, (t) => [uniqueIndex("ket_pk").on(t.entryId, t.tag)]);

/* ── Co-Creation Topics ── */
export const coCreationTopics = sqliteTable("co_creation_topics", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  round: integer("round").notNull().default(1),
  maxRounds: integer("max_rounds").notNull().default(3),
  converged: integer("converged", { mode: "boolean" }).notNull().default(false),
  report: text("report").notNull().default(""),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const coCreationIdeas = sqliteTable("co_creation_ideas", {
  id: text("id").primaryKey(),
  topicId: text("topic_id").notNull().references(() => coCreationTopics.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  category: text("category").notNull().default(""),
  submitterId: text("submitter_id").references(() => users.id),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const coCreationVotes = sqliteTable("co_creation_votes", {
  ideaId: text("idea_id").notNull().references(() => coCreationIdeas.id, { onDelete: "cascade" }),
  voterId: text("voter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (t) => [uniqueIndex("ccv_pk").on(t.ideaId, t.voterId)]);

/* ── Personal Plans ── */
export const personalPlans = sqliteTable("personal_plans", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id),
  recommendation: text("recommendation").notNull().default(""),
  generatedAt: text("generated_at"),
  confirmed: integer("confirmed", { mode: "boolean" }).notNull().default(false),
  confirmedAt: text("confirmed_at"),
});

export const personalPlanActions = sqliteTable("personal_plan_actions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planId: text("plan_id").notNull().references(() => personalPlans.id, { onDelete: "cascade" }),
  actionText: text("action_text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const personalPlanCheckpoints = sqliteTable("personal_plan_checkpoints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planId: text("plan_id").notNull().references(() => personalPlans.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  day: text("day").notNull(),
  dueDate: text("due_date"),
  status: text("status", { enum: ["待提醒", "待提交", "已评估"] }).notNull().default("待提醒"),
  evidenceItemId: text("evidence_item_id").references(() => learningItems.id),
});

export const personalPlanCitedCases = sqliteTable("personal_plan_cited_cases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planId: text("plan_id").notNull().references(() => personalPlans.id, { onDelete: "cascade" }),
  caseTitle: text("case_title").notNull(),
});

/* ── Model Configs ── */
export const modelConfigs = sqliteTable("model_configs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  providerName: text("provider_name").notNull().default(""),
  baseUrl: text("base_url").notNull().default(""),
  model: text("model").notNull().default(""),
  apiKeyEncrypted: text("api_key_encrypted").notNull().default(""),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (t) => [uniqueIndex("mc_user").on(t.userId)]);

/* ── Class Groups ── */
export const classGroups = sqliteTable("class_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const classGroupMembers = sqliteTable("class_group_members", {
  groupId: text("group_id").notNull().references(() => classGroups.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (t) => [uniqueIndex("cgm_pk").on(t.groupId, t.userId)]);

/* ── Content Assessments ── */
export const contentAssessments = sqliteTable("content_assessments", {
  id: text("id").primaryKey(),
  itemId: text("item_id").notNull().references(() => learningItems.id),
  completeness: integer("completeness").notNull().default(0),
  practicality: integer("practicality").notNull().default(0),
  improvementSpace: integer("improvement_space").notNull().default(0),
  comment: text("comment").notNull().default(""),
  assessedAt: text("assessed_at").notNull().$defaultFn(() => new Date().toISOString()),
});

/* ── GROW Sessions ── */
export const growSessions = sqliteTable("grow_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  currentStep: text("current_step", { enum: ["goal", "reality", "options", "will", "complete"] }).notNull().default("goal"),
  goalAnswer: text("goal_answer").notNull().default(""),
  realityAnswer: text("reality_answer").notNull().default(""),
  optionsAnswer: text("options_answer").notNull().default(""),
  willAnswer: text("will_answer").notNull().default(""),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

/* ── Reminders ── */
export const reminders = sqliteTable("reminders", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id),
  planId: text("plan_id").notNull().references(() => personalPlans.id),
  checkpointDay: text("checkpoint_day").notNull(),
  dueDate: text("due_date").notNull(),
  status: text("status", { enum: ["pending", "notified", "resolved"] }).notNull().default("pending"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

/* ── Indexes ── */
export const learningItemsPhaseIdx = index("li_phase_idx").on(learningItems.phase);
export const learningItemsSubmitterIdx = index("li_submitter_idx").on(learningItems.submitterId);
export const coCreationIdeasTopicIdx = index("cci_topic_idx").on(coCreationIdeas.topicId);
export const personalPlansStudentIdx = index("pp_student_idx").on(personalPlans.studentId);
