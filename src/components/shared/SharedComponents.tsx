"use client";

import { ThumbsUp, ImagePlus, X } from "lucide-react";
import type { UploadedAsset } from "@/lib/agents";
import { useState } from "react";

export function ImageUploadBox({
  attachments,
  onUpload,
  onRemove,
}: {
  attachments: UploadedAsset[];
  onUpload: (file: File) => void;
  onRemove: (index: number) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await onUpload(file);
    setUploading(false);
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 px-3 py-2 rounded border border-dashed border-[var(--line)] text-sm text-[var(--muted)] cursor-pointer hover:bg-[var(--surface-strong)]">
        <ImagePlus className="w-4 h-4" />
        {uploading ? "上传中..." : "上传图片（jpg/png/webp/gif，最大 5MB）"}
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </label>
      {attachments.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {attachments.map((att, idx) => (
            <div key={idx} className="relative group">
              <img src={att.url} alt={att.name} className="w-20 h-20 object-cover rounded border border-[var(--line)]" />
              <button
                onClick={() => onRemove(idx)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--coral)] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LearningItemCard({
  item,
  onLike,
}: {
  item: {
    id: string;
    title: string;
    body: string;
    author: string;
    phase: string;
    type: string;
    quality: string;
    likes: number;
    threshold: number;
    inKnowledgeBase: boolean;
    isExcellent: boolean;
    tags: string[];
    attachments?: { url: string; name: string }[];
    aiSummary?: string | null;
    reviewSource?: string | null;
  };
  onLike?: (id: string) => void;
}) {
  const qualityColor = item.quality === "优秀" ? "text-[var(--teal)]" : item.quality === "合规" ? "text-[var(--amber)]" : "text-[var(--coral)]";

  return (
    <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--surface)] space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-[var(--foreground)]">{item.title}</h4>
          <p className="text-xs text-[var(--muted)]">{item.author} · {item.type}</p>
        </div>
        <span className={`text-xs font-medium ${qualityColor}`}>{item.quality}</span>
      </div>
      <p className="text-sm text-[var(--foreground)] whitespace-pre-line">{item.body}</p>
      {item.attachments && item.attachments.length > 0 && (
        <div className="flex gap-2">
          {item.attachments.map((att, i) => (
            <img key={i} src={att.url} alt={att.name} className="w-16 h-16 object-cover rounded border border-[var(--line)]" />
          ))}
        </div>
      )}
      {item.aiSummary && (
        <p className="text-xs text-[var(--muted)] bg-[var(--surface-strong)] rounded p-2">AI 摘要：{item.aiSummary}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {item.tags.map((tag) => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded bg-[var(--surface-strong)] text-[var(--muted)]">{tag}</span>
        ))}
        {item.isExcellent && <span className="text-xs px-2 py-0.5 rounded bg-[var(--teal-soft)] text-[var(--teal)]">优秀</span>}
        {item.inKnowledgeBase && <span className="text-xs px-2 py-0.5 rounded bg-[var(--amber-soft)] text-[var(--amber)]">已入库</span>}
      </div>
      <div className="flex items-center gap-3">
        {onLike && (
          <button
            onClick={() => onLike(item.id)}
            className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--teal)]"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            {item.likes}/{item.threshold}
          </button>
        )}
        {item.reviewSource && item.reviewSource !== "local" && (
          <span className="text-xs text-[var(--muted)]">
            {item.reviewSource === "local-fallback" ? "本地审核（模型超时）" : "AI 审核"}
          </span>
        )}
      </div>
    </div>
  );
}
