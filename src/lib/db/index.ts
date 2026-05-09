import BetterSqlite3 from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dataRoot = process.env.WUHUA_DATA_DIR || path.join(process.cwd(), ".wuhuan-data");

let _db: ReturnType<typeof drizzle> | null = null;
let _sqlite: InstanceType<typeof BetterSqlite3> | null = null;

export function getDb() {
  if (_db) return _db;

  if (!fs.existsSync(dataRoot)) {
    fs.mkdirSync(dataRoot, { recursive: true });
  }

  const dbPath = path.join(dataRoot, "wuhuan.db");
  _sqlite = new BetterSqlite3(dbPath);
  _sqlite.pragma("journal_mode = WAL");
  _sqlite.pragma("foreign_keys = ON");

  _db = drizzle(_sqlite, { schema });
  return _db;
}

export function runMigrations() {
  getDb();
  if (!_sqlite) return;
  const sqlite = _sqlite;

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','teacher','student')),
      class_name TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      disabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS learning_items (
      id TEXT PRIMARY KEY,
      phase TEXT NOT NULL CHECK(phase IN ('deep-study','practice','reflection','co-creation','transformation')),
      type TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      submitter_id TEXT NOT NULL REFERENCES users(id),
      submitter_role TEXT NOT NULL CHECK(submitter_role IN ('admin','teacher','student')),
      author TEXT NOT NULL DEFAULT '',
      likes INTEGER NOT NULL DEFAULT 0,
      threshold INTEGER NOT NULL DEFAULT 3,
      quality TEXT NOT NULL DEFAULT '待补充' CHECK(quality IN ('待补充','合规','优秀')),
      in_knowledge_base INTEGER NOT NULL DEFAULT 0,
      is_excellent INTEGER NOT NULL DEFAULT 0,
      review_source TEXT,
      ai_summary TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS learning_item_tags (
      item_id TEXT NOT NULL REFERENCES learning_items(id) ON DELETE CASCADE,
      tag TEXT NOT NULL,
      PRIMARY KEY (item_id, tag)
    );

    CREATE TABLE IF NOT EXISTS learning_item_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT NOT NULL REFERENCES learning_items(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS learning_item_voters (
      item_id TEXT NOT NULL REFERENCES learning_items(id) ON DELETE CASCADE,
      voter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (item_id, voter_id)
    );

    CREATE TABLE IF NOT EXISTS knowledge_entries (
      id TEXT PRIMARY KEY,
      original_item_id TEXT REFERENCES learning_items(id),
      phase TEXT NOT NULL CHECK(phase IN ('deep-study','practice','reflection','co-creation','transformation')),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      source TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS knowledge_entry_tags (
      entry_id TEXT NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
      tag TEXT NOT NULL,
      PRIMARY KEY (entry_id, tag)
    );

    CREATE TABLE IF NOT EXISTS co_creation_topics (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      round INTEGER NOT NULL DEFAULT 1,
      max_rounds INTEGER NOT NULL DEFAULT 3,
      converged INTEGER NOT NULL DEFAULT 0,
      report TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS co_creation_ideas (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL REFERENCES co_creation_topics(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      submitter_id TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS co_creation_votes (
      idea_id TEXT NOT NULL REFERENCES co_creation_ideas(id) ON DELETE CASCADE,
      voter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (idea_id, voter_id)
    );

    CREATE TABLE IF NOT EXISTS personal_plans (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES users(id),
      recommendation TEXT NOT NULL DEFAULT '',
      generated_at TEXT,
      confirmed INTEGER NOT NULL DEFAULT 0,
      confirmed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS personal_plan_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id TEXT NOT NULL REFERENCES personal_plans(id) ON DELETE CASCADE,
      action_text TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS personal_plan_checkpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id TEXT NOT NULL REFERENCES personal_plans(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      day TEXT NOT NULL,
      due_date TEXT,
      status TEXT NOT NULL DEFAULT '待提醒' CHECK(status IN ('待提醒','待提交','已评估')),
      evidence_item_id TEXT REFERENCES learning_items(id)
    );

    CREATE TABLE IF NOT EXISTS personal_plan_cited_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id TEXT NOT NULL REFERENCES personal_plans(id) ON DELETE CASCADE,
      case_title TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS model_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      enabled INTEGER NOT NULL DEFAULT 0,
      provider_name TEXT NOT NULL DEFAULT '',
      base_url TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL DEFAULT '',
      api_key_encrypted TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id)
    );

    CREATE TABLE IF NOT EXISTS class_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS class_group_members (
      group_id TEXT NOT NULL REFERENCES class_groups(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (group_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS content_assessments (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL REFERENCES learning_items(id),
      completeness INTEGER NOT NULL DEFAULT 0,
      practicality INTEGER NOT NULL DEFAULT 0,
      improvement_space INTEGER NOT NULL DEFAULT 0,
      comment TEXT NOT NULL DEFAULT '',
      assessed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS grow_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      current_step TEXT NOT NULL DEFAULT 'goal' CHECK(current_step IN ('goal','reality','options','will','complete')),
      goal_answer TEXT NOT NULL DEFAULT '',
      reality_answer TEXT NOT NULL DEFAULT '',
      options_answer TEXT NOT NULL DEFAULT '',
      will_answer TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES users(id),
      plan_id TEXT NOT NULL REFERENCES personal_plans(id),
      checkpoint_day TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','notified','resolved')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS li_phase_idx ON learning_items(phase);
    CREATE INDEX IF NOT EXISTS li_submitter_idx ON learning_items(submitter_id);
    CREATE INDEX IF NOT EXISTS cci_topic_idx ON co_creation_ideas(topic_id);
    CREATE INDEX IF NOT EXISTS pp_student_idx ON personal_plans(student_id);
  `);
}
