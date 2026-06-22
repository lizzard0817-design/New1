"use client";
import { useAuth } from "@/hooks/use-auth";
import { useSharedState } from "@/hooks/use-shared-state";
import { Card, Metric, Button } from "@/components/ui";
import { Sparkles, Users, CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { useCreatePlan } from "@/hooks/use-api";
import { coachModules } from "@/lib/agents";
import Link from "next/link";
import type { PhaseId } from "@/lib/agents";

const ringLabels: Record<string, string> = {
  "deep-study": "深学批注", practice: "跟练即时贴", reflection: "反思案例",
};

export function TeacherDashboard() {
  const { has } = useAuth();
  const { items, knowledgeBase, coCreation, phaseStats, studentOptions, selectedPlanStudent,
          setSelectedPlanStudent, setPermissionNotice, reportReady, approvedCount, accounts, plansByStudent } = useSharedState();
  const { createPlan } = useCreatePlan();
  const canGeneratePlan = has("generatePlan");

  const activeStudents = accounts.filter((a) => a.role === "student" && a.active !== false);
  const today = new Date().toISOString().slice(0, 10);

  // ---- build teacher task list ----
  const tasks: Array<{ done: boolean; text: string; action: string; href: string }> = [];

  // 1) ring submission check: which rings have un-submitted students today
  ["deep-study","practice","reflection"].forEach((phase) => {
    const submitters = new Set(items.filter((i) => i.phase === phase).map((i) => i.author));
    const missing = activeStudents.filter((s) => !submitters.has(s.name));
    if (missing.length > 0) {
      tasks.push({
        done: false,
        text: `${ringLabels[phase] || phase}：${missing.length} 名学员未提交`,
        action: `查看`,
        href: `/ring/${phase}`,
      });
    } else {
      tasks.push({
        done: true,
        text: `${ringLabels[phase] || phase}：全部提交 ✓`,
        action: "查看",
        href: `/ring/${phase}`,
      });
    }
  });

  // 2) co-creation
  if (coCreation.converged) {
    tasks.push({ done: false, text: "共创已收敛，需要更新新主题", action: "更新主题", href: "/ring/co-creation" });
  } else {
    tasks.push({ done: coCreation.ideas.length > 0, text: `共创开放中 · ${coCreation.ideas.length} 条观点`, action: "查看", href: "/ring/co-creation" });
  }

  // 3) plan generation for each student
  const studentsWithoutPlan = activeStudents.filter((s) => !plansByStudent[s.name]);
  if (studentsWithoutPlan.length > 0) {
    tasks.push({
      done: false,
      text: `${studentsWithoutPlan.length} 名学员尚未生成行动计划`,
      action: "生成方案",
      href: "/ring/transformation",
    });
  } else {
    tasks.push({ done: true, text: "全部学员已有行动计划 ✓", action: "查看", href: "/ring/transformation" });
  }

  // 4) unconfirmed plans
  const unconfirmed = activeStudents.filter((s) => plansByStudent[s.name]?.status === "待确认");
  if (unconfirmed.length > 0) {
    tasks.push({ done: false, text: `${unconfirmed.length} 名学员未确认方案`, action: "提醒", href: "/ring/transformation" });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">课堂驾驶舱</h1>
        <p className="mt-2 text-[15px] text-[var(--text-secondary)]">青年教师研修一班 · {activeStudents.length} 名学员 · 3 个小组</p>
      </div>

      {/* ---- TASK LIST - main content ---- */}
      <Card className="p-6">
        <h3 className="font-semibold mb-5 flex items-center gap-2">📋 今日课堂任务</h3>
        <div className="space-y-1">
          {tasks.map((t, i) => (
            <Link key={i} href={t.href}
              className={`flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors ${
                t.done ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)]" : "bg-[var(--teal-soft)]/60 hover:bg-[var(--teal-soft)]"
              }`}>
              {t.done ? <CheckCircle2 size={18} className="text-[var(--accent)] shrink-0" /> : <Circle size={18} className="text-[var(--accent)] shrink-0" />}
              <span className={`flex-1 text-sm ${t.done ? "" : "font-medium text-[var(--text)]"}`}>{t.text}</span>
              <span className="text-xs font-medium text-[var(--accent)] shrink-0">{t.action} →</span>
            </Link>
          ))}
        </div>
      </Card>

      {/* ---- Quick metrics ---- */}
      <div className="grid grid-cols-3 gap-4">
        <Metric label="已提交学员" value={`${new Set(items.map(i => i.author)).size}/${activeStudents.length}`} />
        <Metric label="入库素材" value={String(approvedCount)} />
        <Metric label="共创" value={coCreation.converged ? "待更新主题" : `${coCreation.ideas.length} 观点`} />
      </div>

      {/* ---- Quick plan generation ---- */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">生成行动计划</h3>
        <div className="flex items-end gap-3">
          <label className="flex-1">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">选择学员</span>
            <select value={selectedPlanStudent} onChange={(e) => setSelectedPlanStudent(e.target.value)}
              className="mt-2 w-full rounded-xl bg-[var(--bg-secondary)] border-0 px-4 py-2.5 text-sm text-[var(--text)] outline-none">
              {studentOptions.map((s) => (
                <option key={s} value={s}>{s}{plansByStudent[s] ? " · 已有方案" : ""}</option>
              ))}
            </select>
          </label>
          <Button onClick={() => createPlan(selectedPlanStudent, setPermissionNotice)} disabled={!canGeneratePlan}>
            <Sparkles size={14} /> 生成方案
          </Button>
        </div>
      </Card>
    </div>
  );
}
