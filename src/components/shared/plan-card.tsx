"use client";
import { Card, Badge, Button } from "@/components/ui";
import { Bell, CheckCircle2, TimerReset } from "lucide-react";
import type { PersonalPlan } from "@/lib/agents";

export function PlanCard({ plan, onConfirm, canConfirm = false }: {
  plan: PersonalPlan;
  onConfirm?: () => void;
  canConfirm?: boolean;
}) {
  const due = plan.checkpoints.filter((c) => c.status !== "已评估" && (!c.date || c.date <= new Date().toISOString().slice(0, 10)));

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--accent)]">{plan.student} · 个人方案</p>
          <h3 className="mt-1.5 text-xl font-semibold">《个人行动计划》</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={plan.status === "已确认" ? "accent" : "default"}>{plan.status}</Badge>
          {canConfirm && (
            <Button size="sm" onClick={onConfirm}>
              <CheckCircle2 size={14} />
              确认方案
            </Button>
          )}
        </div>
      </div>

      {due.length > 0 && (
        <div className="mt-4 rounded-xl bg-[var(--coral-soft)] px-4 py-2.5 text-sm font-medium text-[var(--danger)]">
          <Bell size={14} className="inline mr-1.5" />
          {due.map((c) => `${c.day} ${c.label}`).join("、")} 已到期
        </div>
      )}

      <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed">{plan.recommendation}</p>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-[var(--bg-secondary)] p-4">
          <p className="text-xs font-medium mb-3">行动步骤</p>
          <ol className="space-y-2 text-sm text-[var(--text-secondary)]">
            {plan.actions.map((a, i) => <li key={a}>{i + 1}. {a}</li>)}
          </ol>
        </div>
        <div className="rounded-xl bg-[var(--bg-secondary)] p-4">
          <p className="text-xs font-medium mb-3">追踪节点</p>
          <div className="space-y-2">
            {plan.checkpoints.map((c) => (
              <div key={c.day} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>{c.day} · {c.label}</span>
                  <span className="text-xs font-medium text-[var(--accent)]">{c.status}</span>
                </div>
                {c.date && <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{c.date}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function EmptyPlan({ onCreatePlan, canGeneratePlan }: { onCreatePlan: () => void; canGeneratePlan: boolean }) {
  return (
    <Card className="flex min-h-[240px] items-center justify-center p-8 text-center">
      <div>
        <TimerReset className="mx-auto text-[var(--accent)]" size={24} />
        <h3 className="mt-4 text-lg font-semibold">还没有个人行动计划</h3>
        <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)]">生成后总教练会调用知识库素材，转化教练接管训后节点提醒。</p>
        <Button onClick={onCreatePlan} disabled={!canGeneratePlan} className="mt-5">
          生成行动计划
        </Button>
      </div>
    </Card>
  );
}
