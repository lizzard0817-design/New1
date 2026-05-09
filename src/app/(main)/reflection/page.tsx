"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Brain, Send, RotateCcw, ArrowRight } from "lucide-react";
import { coachModules } from "@/lib/agents";
import { submissionBlueprints, toneClass } from "@/lib/constants";
import { PhaseWorkflowPage } from "@/components/workflow/WorkflowPanel";
import type { PhaseId } from "@/lib/agents";
import { STEP_PROMPTS, type GrowStep } from "@/lib/services/reflection";
import { LearningItemCard } from "@/components/shared/SharedComponents";

type SessionData = {
  id: string;
  currentStep: string;
  goalAnswer: string;
  realityAnswer: string;
  optionsAnswer: string;
  willAnswer: string;
  stepInfo: { label: string; question: string } | null;
  composed?: string | null;
};

export default function ReflectionPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<"guided" | "direct">("guided");
  const [session, setSession] = useState<SessionData | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (mode === "guided" && user) {
      fetch("/api/reflection/grow").then(r => r.json()).then(setSession).catch(() => {});
    }
  }, [mode, user]);

  async function handleStepSubmit() {
    if (!answer.trim() || !session) return;
    setLoading(true);
    try {
      const res = await fetch("/api/reflection/grow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: session.currentStep, answer }),
      });
      const data = await res.json();
      setSession(data);
      setAnswer("");
      if (data.composed) {
        setNotice("GROW 反思已完成，可以提交为反思案例。");
      }
    } catch {
      setNotice("保存失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setLoading(true);
    try {
      const res = await fetch("/api/reflection/grow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json();
      setSession(data);
      setAnswer("");
      setNotice("");
    } catch {
      setNotice("重置失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleComposeSubmit() {
    if (!session?.composed) return;
    setLoading(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "reflection",
          type: "反思案例",
          title: "GROW 反思案例",
          body: session.composed,
          useAiReview: true,
        }),
      });
      if (res.ok) {
        setNotice("反思案例已提交");
      } else {
        const data = await res.json();
        setNotice(data.error || "提交失败");
      }
    } catch {
      setNotice("提交失败");
    } finally {
      setLoading(false);
    }
  }

  const module_ = coachModules.find((m) => m.id === "reflection")!;

  if (mode === "direct") {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Brain className={`w-5 h-5 ${toneClass.violet.split(" ")[0]}`} />
          <h2 className="text-xl font-bold">反思环</h2>
          <button onClick={() => setMode("guided")} className="ml-auto text-sm text-[var(--teal)] hover:underline">切换到 GROW 引导模式</button>
        </div>
        <PhaseWorkflowPage phase="reflection" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className={`w-5 h-5 ${toneClass.violet.split(" ")[0]}`} />
        <h2 className="text-xl font-bold text-[var(--foreground)]">{module_.title}</h2>
        <button onClick={() => setMode("direct")} className="ml-auto text-sm text-[var(--muted)] hover:underline">直接提交</button>
      </div>

      {session && session.currentStep !== "complete" && session.stepInfo && (
        <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--surface)] space-y-3">
          <h3 className="font-medium text-[var(--foreground)]">{session.stepInfo.label}</h3>
          <p className="text-sm text-[var(--muted)]">{session.stepInfo.question}</p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="请输入你的回答..."
            rows={4}
            className="w-full px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm focus:outline-none focus:border-[var(--teal)] resize-y"
          />
          <div className="flex gap-2">
            <button onClick={handleStepSubmit} disabled={loading || !answer.trim()} className="flex items-center gap-2 px-4 py-2 rounded bg-[var(--teal)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
              <ArrowRight className="w-4 h-4" />
              下一步
            </button>
            <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 rounded border border-[var(--line)] text-sm text-[var(--muted)] hover:bg-[var(--surface-strong)]">
              <RotateCcw className="w-4 h-4" />
              重新开始
            </button>
          </div>
        </div>
      )}

      {session && session.currentStep === "complete" && (
        <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--surface)] space-y-3">
          <h3 className="font-medium text-[var(--foreground)]">GROW 反思已完成</h3>
          <div className="space-y-2">
            {session.goalAnswer && <p className="text-sm"><strong>目标：</strong>{session.goalAnswer}</p>}
            {session.realityAnswer && <p className="text-sm"><strong>现状：</strong>{session.realityAnswer}</p>}
            {session.optionsAnswer && <p className="text-sm"><strong>选择：</strong>{session.optionsAnswer}</p>}
            {session.willAnswer && <p className="text-sm"><strong>行动：</strong>{session.willAnswer}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={handleComposeSubmit} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded bg-[var(--teal)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
              <Send className="w-4 h-4" />
              提交反思案例
            </button>
            <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 rounded border border-[var(--line)] text-sm text-[var(--muted)] hover:bg-[var(--surface-strong)]">
              <RotateCcw className="w-4 h-4" />
              重新开始
            </button>
          </div>
        </div>
      )}

      {notice && <p className="text-sm text-[var(--teal)]">{notice}</p>}

      <div>
        <h3 className="font-medium text-[var(--foreground)] mb-3">反思内容池</h3>
        <ReflectionItemsList />
      </div>
    </div>
  );
}

function ReflectionItemsList() {
  const [items, setItems] = useState<{ data: unknown[]; total: number; page: number; pageSize: number }>({ data: [], total: 0, page: 1, pageSize: 20 });

  useEffect(() => {
    fetch("/api/items?phase=reflection&pageSize=20").then(r => r.json()).then(setItems).catch(() => {});
  }, []);

  return (
    <div className="space-y-3">
      {items.data.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">暂无内容</p>
      ) : (
        items.data.map((item: unknown) => (
          <LearningItemCard key={(item as Record<string, unknown>).id as string} item={item as never} />
        ))
      )}
    </div>
  );
}
