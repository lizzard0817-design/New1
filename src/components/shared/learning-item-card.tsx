"use client";
import { Card, Tag } from "@/components/ui";
import { ThumbsUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { coachModules, type LearningItem } from "@/lib/agents";

export function LearningItemCard({ item, onLike }: { item: LearningItem; onLike: (id: string) => void }) {
  const { has } = useAuth();
  const canLike = has("likeContent");
  const phaseName = coachModules.find((m) => m.id === item.phase)?.title || item.phase;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <Tag>{phaseName}</Tag>
            <Tag>{item.type}</Tag>
            <span className="text-[11px] text-[var(--text-secondary)]">{item.author}</span>
            {item.createdAt && <span className="text-[11px] text-[var(--text-secondary)]">{item.createdAt.slice(0, 10)}</span>}
          </div>
          <h4 className="font-semibold text-sm">{item.title}</h4>
          <p className="mt-2 text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed line-clamp-4">{item.body}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
          item.quality === "优秀" ? "bg-[var(--teal-soft)] text-[var(--accent)]" :
          item.quality === "待补充" ? "bg-[var(--coral-soft)] text-[var(--danger)]" :
          "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
        }`}>{item.quality}</span>
      </div>

      {item.aiSummary && <p className="mt-3 rounded-xl bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-secondary)]">{item.aiSummary}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {item.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
        <button
          onClick={() => onLike(item.id)}
          disabled={!canLike}
          className={`ml-auto flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs transition-colors ${
            canLike ? "hover:border-[var(--accent)] hover:text-[var(--accent)]" : "opacity-40"
          }`}
        >
          <ThumbsUp size={12} />
          {item.likes}/{item.threshold}
        </button>
        {item.isExcellent && <span className="rounded-full bg-[var(--teal-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent)]">优秀</span>}
        {item.inKnowledgeBase && <span className="rounded-full bg-[var(--teal-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent)]">已入库</span>}
      </div>
    </Card>
  );
}
