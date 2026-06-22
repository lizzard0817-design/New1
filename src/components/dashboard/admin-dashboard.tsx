"use client";
import { useAuth } from "@/hooks/use-auth";
import { useSharedState } from "@/hooks/use-shared-state";
import { Card, Metric } from "@/components/ui";
import { ShieldCheck, CheckCircle2, Circle } from "lucide-react";
import { coachModules } from "@/lib/agents";
import Link from "next/link";
import type { PhaseId } from "@/lib/agents";

const ringLabels: Record<string, string> = {
  "deep-study": "深学环", practice: "跟练环", reflection: "反思环",
};

export function AdminDashboard() {
  const { currentRole } = useAuth();
  const { items, knowledgeBase, coCreation, accounts, approvedCount } = useSharedState();

  const totalSubmissions = items.length;
  const pendingItems = items.filter((i) => !i.inKnowledgeBase).length;
  const activeStudents = accounts.filter((a) => a.role === "student" && a.active !== false);
  const disabledAccounts = accounts.filter((a) => a.active === false);

  // ---- build admin task list ----
  const tasks: Array<{ done: boolean; text: string; action: string; href: string }> = [];

  // 1) pending review items
  ["deep-study","practice","reflection"].forEach((phase) => {
    const pending = items.filter((i) => i.phase === phase && !i.inKnowledgeBase).length;
    if (pending > 0) {
      tasks.push({ done: false, text: `${ringLabels[phase] || phase}：${pending} 条待入库`, action: "查看", href: `/ring/${phase}` });
    }
  });

  // 2) co-creation
  if (coCreation.converged) {
    tasks.push({ done: false, text: "共创已收敛，等待教师更新主题", action: "查看", href: "/ring/co-creation" });
  } else {
    tasks.push({ done: true, text: `共创运行中 · ${coCreation.ideas.length} 条观点 ✓`, action: "查看", href: "/ring/co-creation" });
  }

  // 3) disabled accounts
  if (disabledAccounts.length > 0) {
    tasks.push({ done: false, text: `${disabledAccounts.length} 个账号已停用`, action: "管理", href: "/settings" });
  }

  // 4) knowledge base health
  if (knowledgeBase.length > 0) {
    tasks.push({ done: true, text: `知识库 ${knowledgeBase.length} 条条目 ✓`, action: "查看", href: "/knowledge" });
  } else {
    tasks.push({ done: false, text: "知识库为空，提交达标后自动入库", action: "", href: "/knowledge" });
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--teal-soft)]">
            <ShieldCheck size={16} className="text-[var(--accent)]" />
          </div>
          <p className="text-xs font-medium text-[var(--accent)]">管理员</p>
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight">系统治理</h1>
      </div>

      {/* ---- TASK LIST ---- */}
      <Card className="p-6">
        <h3 className="font-semibold mb-5 flex items-center gap-2">📋 系统状态</h3>
        <div className="space-y-1">
          {tasks.map((t, i) => (
            <Link key={i} href={t.href}
              className={`flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors ${
                t.done ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)]" : "bg-[var(--teal-soft)]/60 hover:bg-[var(--teal-soft)]"
              }`}>
              {t.done ? <CheckCircle2 size={18} className="text-[var(--accent)] shrink-0" /> : <Circle size={18} className="text-[var(--accent)] shrink-0" />}
              <span className={`flex-1 text-sm ${t.done ? "" : "font-medium text-[var(--text)]"}`}>{t.text}</span>
              {t.action && <span className="text-xs font-medium text-[var(--accent)] shrink-0">{t.action} →</span>}
            </Link>
          ))}
        </div>
      </Card>

      {/* ---- Quick metrics ---- */}
      <div className="grid grid-cols-4 gap-4">
        <Metric label="总提交" value={String(totalSubmissions)} />
        <Metric label="已入库" value={String(approvedCount)} />
        <Metric label="待沉淀" value={String(pendingItems)} />
        <Metric label="活跃学员" value={String(activeStudents.length)} />
      </div>

      {/* ---- Module cards (thin, just for monitoring) ---- */}
      <Card className="p-6">
        <h3 className="font-semibold mb-5">模块入库率</h3>
        <div className="grid grid-cols-5 gap-3">
          {coachModules.map((module) => {
            const submissions = items.filter((i) => i.phase === module.id).length;
            const entries = knowledgeBase.filter((e) => e.phase === module.id).length;
            const rate = submissions ? Math.round((entries / submissions) * 100) : 0;
            const Icon = module.icon;
            return (
              <Link key={module.id} href={`/ring/${module.id}`} className="rounded-xl bg-[var(--bg-secondary)] p-4 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-[var(--border)]">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-white mb-3">
                  <Icon size={16} className="text-[var(--text)]" />
                </div>
                <p className="text-sm font-semibold">{module.title}</p>
                <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{submissions} 提交 · {entries} 入库</p>
                <div className="mt-3 h-1.5 rounded-full bg-white">
                  <div className="h-1.5 rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(rate, 100)}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
