"use client";
import { useSharedState } from "@/hooks/use-shared-state";
import { useAuth } from "@/hooks/use-auth";
import { useSubmitItem, useLikeItem, useCreatePlan, useConfirmPlan } from "@/hooks/use-api";
import { Card, Button, Input, Textarea, Tag } from "@/components/ui";
import { PageShell } from "@/components/layout";
import { PlanCard, EmptyPlan } from "@/components/shared/plan-card";
import { RingContentPool } from "@/components/shared/ring-content-pool";
import { Send, TimerReset } from "lucide-react";
import { submissionBlueprints } from "@/lib/agents";

export function TransformationPage() {
  const { has, currentAccount } = useAuth();
  const { plan, items, draft, setDraft, attachments, setAttachments, setPermissionNotice, plansByStudent, studentOptions, selectedPlanStudent, setSelectedPlanStudent } = useSharedState();
  const { submit } = useSubmitItem();
  const { like } = useLikeItem();
  const { createPlan } = useCreatePlan();
  const { confirmPlan } = useConfirmPlan();
  const blueprint = submissionBlueprints.transformation;
  const canSubmit = has("submitLearningContent");
  const canGeneratePlan = has("generatePlan");
  const transformationItems = items.filter((i) => i.phase === "transformation");
  const role = currentAccount?.role || "student";

  return (
    <PageShell title="转化环" subtitle={role === "student" ? "我的行动计划与成果提交" : "训后行动计划与进展追踪"}>
      <div className="space-y-6">
        {role !== "student" && (
          <div className="flex items-end gap-3">
            <label className="flex-1">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">选择学员</span>
              <select value={selectedPlanStudent} onChange={(e) => setSelectedPlanStudent(e.target.value)}
                className="mt-2 w-full rounded-xl bg-[var(--bg-secondary)] border-0 px-4 py-2.5 text-sm text-[var(--text)] outline-none">
                {studentOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <Button onClick={() => createPlan(selectedPlanStudent, setPermissionNotice)} disabled={!canGeneratePlan}>
              <TimerReset size={14} /> 生成方案
            </Button>
          </div>
        )}

        {plan ? (
          <PlanCard plan={plan} onConfirm={() => confirmPlan(plan.student)} canConfirm={role === "student" && plan.status === "待确认"} />
        ) : (
          <EmptyPlan onCreatePlan={() => createPlan(selectedPlanStudent, setPermissionNotice)} canGeneratePlan={canGeneratePlan} />
        )}

        {/* Submit form */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">提交转化成果</h3>
            <div className="flex gap-1.5">
              {blueprint.qualityChecks.map((c) => <Tag key={c}>{c}</Tag>)}
            </div>
          </div>

          <label className="block">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">{blueprint.titleLabel}</span>
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              disabled={!canSubmit} placeholder={blueprint.titlePlaceholder} className="mt-2" />
          </label>

          <label className="block">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">{blueprint.bodyLabel}</span>
            <Textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              disabled={!canSubmit} placeholder={blueprint.bodyPlaceholder} className="mt-2" rows={7} />
          </label>

          <Button onClick={() => submit({ phase: "transformation", type: "转化案例", title: draft.title, body: draft.body, attachments, onResult: setPermissionNotice })} disabled={!canSubmit}>
            <Send size={14} /> {blueprint.submitLabel}
          </Button>
        </Card>

        <RingContentPool items={transformationItems} onLike={like} />
      </div>
    </PageShell>
  );
}
