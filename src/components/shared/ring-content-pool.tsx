"use client";
import { useState, useEffect } from "react";
import { Card, Tag } from "@/components/ui";
import { LearningItemCard } from "./learning-item-card";
import { coachModules, type LearningItem, type PhaseId } from "@/lib/agents";

export function RingContentPool({ items, onLike }: {
  items: LearningItem[];
  onLike: (id: string) => void;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const visible = items.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [items.length]);

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] py-16 text-center text-sm text-[var(--text-secondary)]">
        当前环节暂无提交内容
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((item) => <LearningItemCard key={item.id} item={item} onLike={onLike} />)}
      {items.length > pageSize && (
        <div className="flex items-center justify-between rounded-xl bg-[var(--bg-secondary)] px-4 py-2 text-xs text-[var(--text-secondary)]">
          <span>第 {page}/{totalPages} 页，共 {items.length} 条</span>
          <div className="flex gap-1.5">
            <button onClick={() => setPage((v) => Math.max(1, v - 1))} disabled={page === 1}
              className="rounded-full border border-[var(--border)] bg-white px-3 py-1 disabled:opacity-30">上一页</button>
            <button onClick={() => setPage((v) => Math.min(totalPages, v + 1))} disabled={page === totalPages}
              className="rounded-full border border-[var(--border)] bg-white px-3 py-1 disabled:opacity-30">下一页</button>
          </div>
        </div>
      )}
    </div>
  );
}
