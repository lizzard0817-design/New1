"use client";
import { useState } from "react";
import { useSharedState } from "@/hooks/use-shared-state";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateKnowledge, useDeleteKnowledge } from "@/hooks/use-api";
import { Card, Button, Tag, Input, Textarea } from "@/components/ui";
import { PageShell } from "@/components/layout";
import { Database } from "lucide-react";
import { coachModules, type PhaseId, type KnowledgeEntry } from "@/lib/agents";

const tabs: Array<{ id: PhaseId | "all"; label: string }> = [
  { id: "all", label: "全部" },
  ...coachModules.map((m) => ({ id: m.id, label: m.title }))
];

export function KnowledgePage() {
  const { knowledgeBase } = useSharedState();
  const { has, currentRole } = useAuth();
  const { updateKnowledge } = useUpdateKnowledge();
  const { deleteKnowledge } = useDeleteKnowledge();
  const { setPermissionNotice } = useSharedState();
  const [filter, setFilter] = useState<PhaseId | "all">("all");
  const [editingId, setEditingId] = useState("");
  const [editDraft, setEditDraft] = useState({ title: "", summary: "", tags: "" });

  const canManage = currentRole?.id === "admin";
  const visible = filter === "all" ? knowledgeBase : knowledgeBase.filter((e) => e.phase === filter);

  function startEdit(entry: KnowledgeEntry) {
    setEditingId(entry.id);
    setEditDraft({ title: entry.title, summary: entry.summary, tags: entry.tags.join("、") });
  }

  return (
    <PageShell title="知识库" subtitle="点赞达标内容自动入库，作为总教练生成方案的素材">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setFilter(tab.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                filter === tab.id ? "bg-[var(--accent)] text-white" : "border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]"
              }`}>
              {tab.label} · {tab.id === "all" ? knowledgeBase.length : knowledgeBase.filter((e) => e.phase === tab.id).length}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="grid grid-cols-2 gap-3">
          {visible.map((entry) => {
            const editing = editingId === entry.id;
            const phaseName = coachModules.find((m) => m.id === entry.phase)?.title || entry.phase;
            return (
              <Card key={entry.id} className="p-5">
                {editing ? (
                  <div className="space-y-3">
                    <Input value={editDraft.title} onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })} placeholder="标题" />
                    <Textarea value={editDraft.summary} onChange={(e) => setEditDraft({ ...editDraft, summary: e.target.value })} rows={3} placeholder="摘要" />
                    <Input value={editDraft.tags} onChange={(e) => setEditDraft({ ...editDraft, tags: e.target.value })} placeholder="标签，用、分隔" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => {
                        updateKnowledge(entry.id, { title: editDraft.title, summary: editDraft.summary, tags: editDraft.tags.split(/[、,，]/).map((t) => t.trim()).filter(Boolean) }, setPermissionNotice);
                        setEditingId("");
                      }}>保存</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId("")}>取消</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Tag>{phaseName}</Tag>
                      <Tag>{entry.type}</Tag>
                      {entry.status === "hidden" && <Tag>已隐藏</Tag>}
                    </div>
                    <p className="font-semibold text-sm">{entry.title}</p>
                    <p className="mt-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">{entry.summary}</p>
                    <div className="flex items-center gap-1.5 mt-3">
                      <span className="text-[11px] text-[var(--text-secondary)]">{entry.source}</span>
                      {entry.tags.map((t) => <Tag key={t}>{t}</Tag>)}
                    </div>
                    {canManage && (
                      <div className="flex gap-1.5 mt-3 pt-3 border-t border-[var(--border)]">
                        <button onClick={() => startEdit(entry)} className="rounded-full px-3 py-1 text-[11px] font-medium hover:bg-[var(--bg-secondary)]">编辑</button>
                        <button onClick={() => updateKnowledge(entry.id, { status: entry.status === "hidden" ? "active" : "hidden" }, setPermissionNotice)}
                          className="rounded-full px-3 py-1 text-[11px] font-medium hover:bg-[var(--bg-secondary)]">
                          {entry.status === "hidden" ? "恢复" : "隐藏"}
                        </button>
                        <button onClick={() => deleteKnowledge(entry.id, setPermissionNotice)}
                          className="rounded-full px-3 py-1 text-[11px] font-medium text-[var(--danger)] hover:bg-[var(--coral-soft)]">删除</button>
                      </div>
                    )}
                  </>
                )}
              </Card>
            );
          })}
          {!visible.length && (
            <div className="col-span-2 py-16 text-center text-sm text-[var(--text-secondary)]">暂无知识条目</div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
