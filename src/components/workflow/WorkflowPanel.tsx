"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { coachModules, type PhaseId } from "@/lib/agents";
import { submissionBlueprints, typeByPhase, toneClass } from "@/lib/constants";
import { ImageUploadBox, LearningItemCard } from "@/components/shared/SharedComponents";
import { Pagination, useFetch } from "@/components/shared/hooks";
import type { UploadedAsset } from "@/lib/agents";
import { Send } from "lucide-react";

export function PhaseWorkflowPage({ phase }: { phase: PhaseId }) {
  const { user } = useAuth();
  const blueprint = submissionBlueprints[phase];
  const module_ = coachModules.find((m) => m.id === phase)!;
  const [draft, setDraft] = useState({ title: blueprint.defaultTitle, body: blueprint.defaultBody });
  const [attachments, setAttachments] = useState<UploadedAsset[]>([]);
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<{ data: unknown[]; total: number; page: number; pageSize: number }>({ data: [], total: 0, page: 1, pageSize: 20 });

  useEffect(() => {
    fetch(`/api/items?phase=${phase}&page=${page}&pageSize=20`).then(r => r.json()).then(setItems).catch(() => {});
  }, [phase, page]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setNotice("");
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase,
          type: typeByPhase[phase],
          title: draft.title,
          body: draft.body,
          attachments,
          useAiReview: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotice("已提交，审核结果：" + (data.quality || "审核中"));
        setAttachments([]);
        fetch(`/api/items?phase=${phase}&page=${page}&pageSize=20`).then(r => r.json()).then(setItems);
      } else {
        setNotice(data.error || "提交失败，请稍后重试。");
      }
    } catch {
      setNotice("网络错误，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setAttachments((prev) => [...prev, data.asset]);
      } else {
        setNotice(data.error || "上传失败");
      }
    } catch {
      setNotice("上传失败");
    }
  }

  async function handleLike(itemId: string) {
    await fetch("/api/items/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    fetch(`/api/items?phase=${phase}&page=${page}&pageSize=20`).then(r => r.json()).then(setItems);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <module_.icon className={`w-5 h-5 ${toneClass[module_.tone].split(" ")[0]}`} />
        <h2 className="text-xl font-bold text-[var(--foreground)]">{module_.title}</h2>
        <span className="text-sm text-[var(--muted)]">· {module_.coach}</span>
      </div>

      {user?.role === "student" && (
        <form onSubmit={handleSubmit} className="border border-[var(--line)] rounded-lg p-4 bg-[var(--surface)] space-y-3">
          <h3 className="font-medium text-[var(--foreground)]">提交内容</h3>
          <div className="bg-[var(--surface-strong)] rounded p-3 space-y-1">
            {blueprint.templateSections.map((s, i) => (
              <p key={i} className="text-xs text-[var(--muted)]"><strong>{s.label}</strong>：{s.detail}</p>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">{blueprint.titleLabel}</label>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder={blueprint.titlePlaceholder}
              className="w-full px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm focus:outline-none focus:border-[var(--teal)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">{blueprint.bodyLabel}</label>
            <textarea
              value={draft.body}
              onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              placeholder={blueprint.bodyPlaceholder}
              rows={6}
              className="w-full px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm focus:outline-none focus:border-[var(--teal)] resize-y"
            />
          </div>
          {(phase === "practice" || phase === "transformation") && (
            <ImageUploadBox attachments={attachments} onUpload={handleUpload} onRemove={(i) => setAttachments((a) => a.filter((_, j) => j !== i))} />
          )}
          <p className="text-xs text-[var(--muted)]">{blueprint.outputHint}</p>
          <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 rounded bg-[var(--teal)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
            <Send className="w-4 h-4" />
            {submitting ? "提交中..." : blueprint.submitLabel}
          </button>
          {notice && <p className={`text-sm ${notice.includes("失败") || notice.includes("错误") ? "text-[var(--coral)]" : "text-[var(--teal)]"}`}>{notice}</p>}
        </form>
      )}

      <div>
        <h3 className="font-medium text-[var(--foreground)] mb-3">互动内容池</h3>
        {items.data.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">暂无内容</p>
        ) : (
          <div className="space-y-3">
            {items.data.map((item: unknown) => (
              <LearningItemCard key={(item as Record<string, unknown>).id as string} item={item as never} onLike={handleLike} />
            ))}
          </div>
        )}
        <Pagination page={items.page} pageSize={items.pageSize} total={items.total} onChange={setPage} />
      </div>
    </div>
  );
}
