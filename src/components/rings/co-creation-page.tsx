"use client";
import { useState, useEffect } from "react";
import { useSharedState } from "@/hooks/use-shared-state";
import { useAuth } from "@/hooks/use-auth";
import { useSubmitIdeas, useRunCoCreation, useVoteIdea, useUpdateTopic } from "@/hooks/use-api";
import { Card, Button, Textarea, Metric } from "@/components/ui";
import { PageShell } from "@/components/layout";
import { Send, Layers3, Vote, FileText, ChevronRight } from "lucide-react";
import { submissionBlueprints } from "@/lib/agents";

export function CoCreationPage() {
  const { coCreation, ideaDraft, setIdeaDraft, selectedCoCreationGroup, setSelectedCoCreationGroup, setPermissionNotice } = useSharedState();
  const { has, currentAccount } = useAuth();
  const { submit } = useSubmitIdeas();
  const { run } = useRunCoCreation();
  const { vote } = useVoteIdea();
  const { updateTopic } = useUpdateTopic();
  const [topicDraft, setTopicDraft] = useState(coCreation.topic);

  const canSubmitIdeas = has("submitCoCreationIdeas") && !coCreation.converged;
  const canRun = has("runCoCreation") && !coCreation.converged && coCreation.ideas.length > 0;
  const canVote = has("likeContent") && !coCreation.converged;
  const blueprint = submissionBlueprints["co-creation"];

  useEffect(() => { setTopicDraft(coCreation.topic); }, [coCreation.topic]);

  const incoming = ideaDraft.split("\n").map((s) => s.trim()).filter(Boolean);
  const currentVoter = currentAccount?.id || "";

  return (
    <PageShell title="共创环" subtitle="提交观点、投票、收敛生成共识报告">
      <div className="space-y-6">
        {/* Topic + submit */}
        <Card className="p-6 space-y-4">
          <div className="flex items-end gap-3">
            <label className="flex-1">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">当前主题</span>
              <input
                value={topicDraft}
                onChange={(e) => setTopicDraft(e.target.value)}
                disabled={!has("runCoCreation")}
                className="mt-2 w-full rounded-xl bg-[var(--bg-secondary)] border-0 px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50"
              />
            </label>
            <Button variant="outline" size="sm" onClick={() => updateTopic(topicDraft, setPermissionNotice)}
              disabled={!has("runCoCreation") || topicDraft.trim() === coCreation.topic}>
              更新主题
            </Button>
          </div>

          {coCreation.converged && (
            <div className="rounded-xl bg-[var(--teal-soft)] px-4 py-3 text-sm font-medium text-[var(--accent)]">
              当前主题已收敛归档，请由老师更新新主题后再提交观点。
            </div>
          )}

          <div>
            <label className="block">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">{blueprint.bodyLabel}，每行一条</span>
              <Textarea value={ideaDraft} onChange={(e) => setIdeaDraft(e.target.value)} disabled={!canSubmitIdeas}
                placeholder={blueprint.bodyPlaceholder} className="mt-2" rows={5} />
            </label>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => submit(incoming, setPermissionNotice)} disabled={!canSubmitIdeas || !incoming.length}>
              <Send size={14} /> {blueprint.submitLabel}
            </Button>
            <Button variant="outline" onClick={() => run(incoming, setPermissionNotice)} disabled={!canRun}>
              <Layers3 size={14} /> 收敛归档
            </Button>
          </div>
        </Card>

        {/* Categories */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">观点分类</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(coCreation.categories).map(([cat, ideas]) => (
              <div key={cat} className="rounded-xl bg-[var(--bg-secondary)] p-4">
                <p className="text-sm font-semibold">{cat}</p>
                <div className="mt-2 space-y-1.5">
                  {(ideas as string[]).map((i) => <p key={i} className="text-xs text-[var(--text-secondary)] leading-relaxed">{i}</p>)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Voting */}
        {Object.keys(coCreation.votes).length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Vote size={16} className="text-[var(--accent)]" /> 投票
            </h3>
            <div className="space-y-2">
              {Object.entries(coCreation.votes).sort((a, b) => b[1] - a[1]).map(([idea, votes]) => {
                const hasVoted = currentVoter ? (coCreation.voters?.[idea] || []).includes(currentVoter) : false;
                return (
                  <div key={idea} className="flex items-center gap-3 rounded-xl bg-[var(--bg-secondary)] px-4 py-2.5 text-sm">
                    <span className="flex-1 leading-relaxed">{idea}</span>
                    <span className="font-semibold text-[var(--accent)]">{votes} 票</span>
                    <button onClick={() => vote(idea)} disabled={!canVote || hasVoted}
                      className="rounded-full px-3 py-1 text-[11px] font-medium border border-[var(--border)] hover:border-[var(--accent)] disabled:opacity-30 transition-colors">
                      {hasVoted ? "已投" : "投票"}
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Report */}
        {coCreation.report && (
          <Card className="p-6 border-[var(--accent)]/20">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText size={16} className="text-[var(--accent)]" /> 共识报告
            </h3>
            <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] leading-relaxed font-sans">{coCreation.report}</pre>
          </Card>
        )}

        {/* Archives */}
        {!!coCreation.archives?.length && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">已归档主题</h3>
            <div className="space-y-3">
              {coCreation.archives.slice(0, 5).map((a) => (
                <div key={a.id} className="rounded-xl bg-[var(--bg-secondary)] p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{a.topic}</p>
                    <span className="text-[11px] font-medium text-[var(--accent)]">{a.ideas.length} 条</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {a.ideas.slice(0, 3).map((i) => <p key={i} className="text-xs text-[var(--text-secondary)]">{i}</p>)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
