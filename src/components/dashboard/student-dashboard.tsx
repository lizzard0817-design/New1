"use client";
import { useAuth } from "@/hooks/use-auth";
import { useSharedState } from "@/hooks/use-shared-state";
import { Card, Metric, Button } from "@/components/ui";
import { CheckCircle2, Bell, ArrowRight, BookOpenCheck, ClipboardCheck, MessageSquareText, GitBranch, Rocket, Sparkles, Circle } from "lucide-react";
import { useConfirmPlan } from "@/hooks/use-api";
import Link from "next/link";
import type { PhaseId, PersonalPlan } from "@/lib/agents";

function getDueCheckpoints(plan: PersonalPlan | null) {
  if (!plan) return [];
  const today = new Date().toISOString().slice(0, 10);
  return plan.checkpoints.filter((c: { status: string; date?: string }) => c.status !== "已评估" && (!c.date || c.date <= today));
}

const ringCfg: Record<string, { icon: typeof BookOpenCheck; label: string; href: string }> = {
  "deep-study":    { icon: BookOpenCheck,      label: "深学环", href: "/ring/deep-study" },
  practice:        { icon: ClipboardCheck,     label: "跟练环", href: "/ring/practice" },
  reflection:      { icon: MessageSquareText,  label: "反思环", href: "/ring/reflection" },
  "co-creation":   { icon: GitBranch,          label: "共创环", href: "/ring/co-creation" },
  transformation:  { icon: Rocket,             label: "转化环", href: "/ring/transformation" },
};

export function StudentDashboard() {
  const { currentAccount } = useAuth();
  const { items, knowledgeBase, coCreation, plan, phaseStats } = useSharedState();
  const { confirmPlan } = useConfirmPlan();

  const myName = currentAccount?.name || "";
  const myItems = items.filter((i) => i.author === myName);
  const myApproved = myItems.filter((i) => i.inKnowledgeBase).length;
  const dueCheckpoints = getDueCheckpoints(plan);
  const today = new Date().toISOString().slice(0, 10);

  // ---- build smart task list ----
  const tasks: Array<{ done: boolean; text: string; action: string; href: string }> = [];

  // 1) check each ring submission
  (["deep-study","practice","reflection"] as PhaseId[]).forEach((phase) => {
    const cfg = ringCfg[phase];
    const hasSubmittedToday = myItems.some((i) => i.phase === phase && i.createdAt?.slice(0,10) === today);
    tasks.push({
      done: hasSubmittedToday,
      text: hasSubmittedToday ? `${cfg.label}已提交 ✓` : `提交${cfg.label}`,
      action: hasSubmittedToday ? "已提交" : "去提交",
      href: cfg.href,
    });
  });

  // 2) co-creation participation
  if (!coCreation.converged) {
    const myGroup = currentAccount?.groupName || "第一小组";
    const myIdeas = Object.entries(coCreation.ideaGroups || {}).filter(([idea, g]) => g === myGroup).length;
    tasks.push({
      done: myIdeas > 0,
      text: myIdeas > 0 ? `已提交 ${myIdeas} 条共创观点` : `参与共创：「${coCreation.topic}」`,
      action: myIdeas > 0 ? "再提交" : "去参与",
      href: "/ring/co-creation",
    });
  }

  // 3) plan status
  if (plan) {
    if (plan.status === "待确认") {
      tasks.push({ done: false, text: "确认你的行动计划", action: "确认方案", href: "/ring/transformation" });
    } else {
      const pendingCheckpoints = plan.checkpoints.filter((c) => c.status !== "已评估");
      if (pendingCheckpoints.length > 0) {
        tasks.push({ done: false, text: `提交转化成果（${pendingCheckpoints.map(c=>c.day).join("、")}）`, action: "去提交", href: "/ring/transformation" });
      } else {
        tasks.push({ done: true, text: "转化成果全部完成 ✓", action: "查看", href: "/ring/transformation" });
      }
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium text-[var(--accent)]">{currentAccount?.className} · {currentAccount?.groupName}</p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight">你好，{myName}</h1>
      </div>

      {/* ---- TASK LIST - main content ---- */}
      <Card className="p-6">
        <h3 className="font-semibold mb-5 flex items-center gap-2">📋 课堂任务</h3>
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

      {/* ---- Quick stats ---- */}
      <div className="grid grid-cols-3 gap-4">
        <Metric label="我的提交" value={String(myItems.length)} />
        <Metric label="已入库" value={String(myApproved)} />
        <Metric label="共创观点" value={String(coCreation.ideas.length)} />
      </div>

      {/* ---- Conditional: plan needs confirm ---- */}
      {plan?.status === "待确认" && (
        <Card className="p-5 border-[var(--accent)]/20 bg-[var(--teal-soft)]/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <Bell className="mt-0.5 text-[var(--accent)]" size={18} />
              <div>
                <h3 className="font-semibold">行动计划待确认</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">班主任已为你生成个性化方案，确认后开始按节点提交成果</p>
              </div>
            </div>
            <Button size="sm" onClick={() => confirmPlan(myName)}>
              <CheckCircle2 size={14} /> 确认方案
            </Button>
          </div>
        </Card>
      )}

      {/* ---- Due checkpoints ---- */}
      {dueCheckpoints.length > 0 && plan?.status === "已确认" && (
        <Card className="p-5 border-[var(--accent)]/20 bg-[var(--teal-soft)]/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <Bell className="mt-0.5 text-[var(--accent)]" size={18} />
              <div>
                <h3 className="font-semibold">节点已到期</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {dueCheckpoints.map((c) => `${c.day} ${c.label}`).join("、")}，请在转化环提交成果
                </p>
              </div>
            </div>
            <Link href="/ring/transformation"><Button size="sm"><ArrowRight size={14} /> 提交成果</Button></Link>
          </div>
        </Card>
      )}
    </div>
  );
}
