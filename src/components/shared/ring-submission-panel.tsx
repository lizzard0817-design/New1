"use client";
import { Card, Button, Input, Textarea, Tag } from "@/components/ui";
import { Send, ImagePlus, X } from "lucide-react";
import { useState } from "react";
import { submissionBlueprints, type PhaseId, type UploadedAsset } from "@/lib/agents";
import { useAuth } from "@/hooks/use-auth";
import { useSharedState } from "@/hooks/use-shared-state";
import { useSubmitItem, useUploadImage } from "@/hooks/use-api";
import { GrowGuidedBuilder } from "./grow-guided-builder";

type Props = {
  phase: PhaseId;
  typeValue: string;
};

export function RingSubmissionPanel({ phase, typeValue }: Props) {
  const { has } = useAuth();
  const { draft, setDraft, attachments, setAttachments, setPermissionNotice } = useSharedState();
  const { submit, loading } = useSubmitItem();
  const { upload } = useUploadImage();
  const canSubmit = has("submitLearningContent");
  const blueprint = submissionBlueprints[phase];

  return (
    <Card className="p-6 space-y-4">
      <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
        <label className="block">
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">{blueprint.titleLabel}</span>
          <Input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            disabled={!canSubmit}
            placeholder={blueprint.titlePlaceholder}
            className="mt-2"
          />
        </label>
        <div className="rounded-xl bg-[var(--bg-secondary)] px-4 py-3 text-xs text-[var(--text-secondary)] mt-6">
          <p className="font-medium text-[var(--text)]">判断标准</p>
          <p className="mt-1">能说清看到、理解、迁移三个层次</p>
        </div>
      </div>

      <label className="block">
        <span className="text-[11px] font-medium text-[var(--text-secondary)]">{blueprint.bodyLabel}</span>
        <Textarea
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          disabled={!canSubmit}
          placeholder={blueprint.bodyPlaceholder}
          className="mt-2"
          rows={7}
        />
      </label>

      {phase === "reflection" && (
        <GrowGuidedBuilder draftBody={draft.body} onChange={(body) => setDraft({ ...draft, body })} disabled={!canSubmit} />
      )}

      <ImageUploadBox attachments={attachments} setAttachments={setAttachments} onUploadImage={(file) => upload(file, setPermissionNotice, (a) => setAttachments([...attachments, a]))} disabled={!canSubmit} />

      <div className="flex flex-wrap gap-1.5">
        {blueprint.qualityChecks.map((check: string) => <Tag key={check}>{check}</Tag>)}
      </div>

      <Button
        onClick={() => submit({ phase, type: typeValue, title: draft.title, body: draft.body, attachments, onResult: setPermissionNotice })}
        disabled={!canSubmit || loading}
      >
        <Send size={14} />
        {blueprint.submitLabel}
      </Button>
    </Card>
  );
}

function ImageUploadBox({ attachments, setAttachments, onUploadImage, disabled }: {
  attachments: UploadedAsset[];
  setAttachments: (a: UploadedAsset[]) => void;
  onUploadImage: (file: File) => void;
  disabled: boolean;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-secondary)]">图片附件 · jpg/png/webp · 5MB 以内</p>
        <label className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
          disabled ? "opacity-40 bg-[var(--bg-secondary)]" : "bg-white text-[var(--accent)] hover:bg-[var(--teal-soft)]"
        }`}>
          <ImagePlus size={14} />
          上传图片
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" disabled={disabled}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadImage(f); e.currentTarget.value = ""; }} />
        </label>
      </div>
      {attachments.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3">
          {attachments.map((a) => (
            <div key={a.url} className="relative rounded-xl border border-[var(--border)] bg-white overflow-hidden">
              <img src={a.url} alt={a.name} className="h-24 w-full object-cover" />
              <button onClick={() => setAttachments(attachments.filter((x) => x.url !== a.url))} className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-white/90 shadow-sm hover:bg-white">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
