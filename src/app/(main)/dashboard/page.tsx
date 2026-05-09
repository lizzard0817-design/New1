"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { coachModules, deliveryFlows, can, type RoleId } from "@/lib/agents";
import { toneClass } from "@/lib/constants";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, ClipboardCheck, Brain, GitBranch, Rocket, Database, Sparkles, Users, Settings } from "lucide-react";
import { useEffect, useState } from "react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "deep-study": BookOpenCheck,
  practice: ClipboardCheck,
  reflection: Brain,
  "co-creation": GitBranch,
  transformation: Rocket,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const role = (user?.role || "student") as RoleId;
  const [reminders, setReminders] = useState<{ planId: string; checkpointDay: string; dueDate: string }[]>([]);

  useEffect(() => {
    fetch("/api/reminders").then(r => r.json()).then(setReminders).catch(() => {});
  }, []);

  const flows = deliveryFlows[role] || [];
  const phaseStats = coachModules.map((m) => ({ ...m, icon: iconMap[m.id] }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--foreground)]">
          {role === "admin" ? "系统治理工作台" : role === "teacher" ? "班级运营工作台" : "个人学习工作台"}
        </h2>
        <p className="text-sm text-[var(--muted)] mt-1">{user?.name} · {user?.className}</p>
      </div>

      {reminders.length > 0 && (
        <div className="bg-[var(--coral-soft)] border border-[var(--coral)] rounded-lg p-4">
          <h3 className="font-medium text-[var(--coral)] mb-2">训后提醒</h3>
          {reminders.map((r, i) => (
            <p key={i} className="text-sm text-[var(--coral)]">
              {r.checkpointDay} 节点已于 {r.dueDate} 到期，请提交转化成果。
            </p>
          ))}
          <Link href="/transformation" className="text-sm text-[var(--teal)] underline mt-2 inline-block">
            前往提交 →
          </Link>
        </div>
      )}

      <div className="grid gap-4">
        <h3 className="text-sm font-medium text-[var(--muted)]">交付路径</h3>
        {flows.map((step, i) => {
          const routeMap: Record<string, string> = {
            "deep-study": "/deep-study",
            "co-creation": "/co-creation",
            "transformation": "/transformation",
            "coach": "/coach",
            "knowledge": "/knowledge",
            "dashboard": "/dashboard",
            "model-settings": "/model-settings",
          };
          return (
            <Link
              key={i}
              href={routeMap[step.view] || "/dashboard"}
              className="flex items-center gap-4 p-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-strong)]"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--teal-soft)] text-[var(--teal)] flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-[var(--foreground)]">{step.title}</h4>
                <p className="text-sm text-[var(--muted)]">{step.goal}</p>
                <p className="text-xs text-[var(--muted)] mt-1">交付物：{step.deliverable} → {step.receiver}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--muted)]" />
            </Link>
          );
        })}
      </div>

      {role === "student" && (
        <div>
          <h3 className="text-sm font-medium text-[var(--muted)] mb-3">公开优秀内容</h3>
          <Link href="/knowledge" className="text-sm text-[var(--teal)] hover:underline">
            查看优秀内容池和共识报告 →
          </Link>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-[var(--muted)] mb-3">五个教练模块</h3>
        <div className="grid grid-cols-5 gap-3">
          {phaseStats.map((m) => {
            const Icon = m.icon || BookOpenCheck;
            return (
              <Link
                key={m.id}
                href={`/${m.id}`}
                className={`p-3 rounded-lg border text-center ${toneClass[m.tone]}`}
              >
                <Icon className="w-5 h-5 mx-auto mb-1" />
                <p className="text-xs font-medium">{m.title}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
