"use client";
import { useEffect } from "react";
import { useSharedState } from "@/hooks/use-shared-state";
import { useLikeItem } from "@/hooks/use-api";
import { PageShell } from "@/components/layout";
import { RingSubmissionPanel } from "@/components/shared/ring-submission-panel";
import { RingContentPool } from "@/components/shared/ring-content-pool";
import { coachModules } from "@/lib/agents";
import type { PhaseId } from "@/lib/agents";

const typeByPhase: Record<PhaseId, string> = {
  "deep-study": "批注",
  practice: "即时贴",
  reflection: "反思案例",
  "co-creation": "观点",
  transformation: "转化案例"
};

export function RingPage({ phase }: { phase: PhaseId }) {
  const { items, setActivePhase, draft, setDraft } = useSharedState();
  const { like } = useLikeItem();
  const module = coachModules.find((m) => m.id === phase) || coachModules[0];
  const activeItems = items.filter((i) => i.phase === phase);

  useEffect(() => {
    setActivePhase(phase);
  }, [phase, setActivePhase]);

  return (
    <PageShell title={module.title} subtitle={module.successRule}>
      <div className="space-y-6">
        <RingSubmissionPanel phase={phase} typeValue={typeByPhase[phase] || "批注"} />
        <RingContentPool items={activeItems} onLike={like} />
      </div>
    </PageShell>
  );
}
