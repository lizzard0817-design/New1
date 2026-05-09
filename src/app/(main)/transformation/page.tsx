"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { coachModules, type PhaseId } from "@/lib/agents";
import { toneClass, typeByPhase } from "@/lib/constants";
import { Rocket, Check, Send, TimerReset } from "lucide-react";
import { ImageUploadBox, LearningItemCard } from "@/components/shared/SharedComponents";
import type { UploadedAsset } from "@/lib/agents";

type Plan = {
  id: string;
  studentId: string;
  recommendation: string;
  generatedAt: string | null;
  confirmed: boolean;
  confirmedAt: string | null;
  actions: string[];
  checkpoints: { id: number; label: string; day: string; dueDate: string | null; status: string; evidenceItemId: string | null }[];
  citedCases: string[];
};

export default function TransformationPage() {
  const { user } = useAuth();
  const module_ = coachModules.find((m) => m.id === "transformation")!;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [draft, setDraft] = useState({ title: "", body: "" });
  const [attachments, setAttachments] = useState<UploadedAsset[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<{ data: unknown[]; total: number }>({ data: [], total: 0 });

  useEffect(() => {
    fetch("/api/plans").then(r => r.json()).then(setPlans).catch(() => {});
    fetch("/api/items?phase=transformation&pageSize=20").then(r => r.json()).then(setItems).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "transformation",
          type: "转化案例",
          title: draft.title,
          body: draft.body,
          attachments,
          useAiReview: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotice("转化成果已提交");
        setAttachments([]);
        fetch("/api/items?phase=transformation&pageSize=20").then(r => r.json()).then(setItems);
      } else {
        setNotice(data.error || "提交失败");
      }
    } catch {
      setNotice("网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok) setAttachments((prev) => [...prev, data.asset]);
  }

  async function handleConfirmPlan(planId: string) {
    try {
      const res = await fetch("/api/plans/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (res.ok) {
        setNotice("方案已确认");
        fetch("/api/plans").then(r => r.json()).then(setPlans);
      }
    } catch {
      setNotice("确认失败");
    }
  }

  async function handleLike(itemId: string) {
    await fetch("/api/items/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    fetch("/api/items?phase=transformation&pageSize=20").then(r => r.json()).then(setItems);
  }

  const myPlan = user?.role === "student" ? plans[0] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Rocket className={`w-5 h-5 ${toneClass.rose.split(" ")[0]}`} />
        <h2 className="text-xl font-bold text-[var(--foreground)]">{module_.title}</h2>
        <span className="text-sm text-[var(--muted)]">· {module_.coach}</span>
      </div>

      {myPlan && (
        <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--surface)] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-[var(--foreground)]">我的方案</h3>
            {myPlan.confirmed ? (
              <span className="text-xs px-2 py-0.5 rounded bg-[var(--teal-soft)] text-[var(--teal)]">已确认</span>
            ) : (
              <button onClick={() => handleConfirmPlan(myPlan.id)} className="flex items-center gap-1 px-3 py-1.5 rounded bg-[var(--teal)] text-white text-sm hover:opacity-90">
                <Check className="w-3.5 h-3.5" /> 确认方案
              </button>
            )}
          </div>
          <p className="text-sm text-[var(--foreground)]">{myPlan.recommendation}</p>
          <div className="space-y-1">
            {myPlan.actions.map((action, i) => (
              <p key={i} className="text-sm text-[var(--muted)]">{i + 1}. {action}</p>
            ))}
          </div>
          {myPlan.checkpoints.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--line)]">
              <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">训后节点</h4>
              {myPlan.checkpoints.map((cp) => (
                <div key={cp.id} className="flex items-center gap-2 text-sm">
                  <TimerReset className="w-3.5 h-3.5 text-[var(--muted)]" />
                  <span>{cp.label} ({cp.day})</span>
                  {cp.dueDate && <span className="text-xs text-[var(--muted)]">截止：{cp.dueDate}</span>}
                  <span className={`text-xs ${cp.status === "已评估" ? "text-[var(--teal)]" : "text-[var(--amber)]"}`}>{cp.status}</span>
                </div>
              ))}
            </div>
          )}
          {myPlan.citedCases.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-[var(--muted)]">引用案例：{myPlan.citedCases.join("、")}</p>
            </div>
          )}
        </div>
      )}

      {user?.role === "student" && (
        <form onSubmit={handleSubmit} className="border border-[var(--line)] rounded-lg p-4 bg-[var(--surface)] space-y-3">
          <h3 className="font-medium text-[var(--foreground)]">提交转化成果</h3>
          <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="成果标题" className="w-full px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm" />
          <textarea value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} placeholder="应用场景、采取动作、结果证据、下一步改进" rows={5} className="w-full px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm resize-y" />
          <ImageUploadBox attachments={attachments} onUpload={handleUpload} onRemove={(i) => setAttachments((a) => a.filter((_, j) => j !== i))} />
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded bg-[var(--teal)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
            <Send className="w-4 h-4" /> {loading ? "提交中..." : "提交转化成果"}
          </button>
          {notice && <p className={`text-sm ${notice.includes("失败") ? "text-[var(--coral)]" : "text-[var(--teal)]"}`}>{notice}</p>}
        </form>
      )}

      <div>
        <h3 className="font-medium text-[var(--foreground)] mb-3">转化成果池</h3>
        {items.data.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">暂无内容</p>
        ) : (
          <div className="space-y-3">
            {items.data.map((item: unknown) => (
              <LearningItemCard key={(item as Record<string, unknown>).id as string} item={item as never} onLike={handleLike} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
