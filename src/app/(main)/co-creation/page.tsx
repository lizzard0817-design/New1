"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { coachModules } from "@/lib/agents";
import { toneClass } from "@/lib/constants";
import { GitBranch, Send, Vote, ChevronRight, Plus, Sparkles } from "lucide-react";

type TopicDetail = {
  id: string;
  title: string;
  round: number;
  maxRounds: number;
  converged: boolean;
  report: string;
  ideas: string[];
  categories: Record<string, string[]>;
  votes: Record<string, number>;
  isActive: boolean;
};

export default function CoCreationPage() {
  const { user, hasPermission } = useAuth();
  const module_ = coachModules.find((m) => m.id === "co-creation")!;
  const [topics, setTopics] = useState<{ id: string; title: string; isActive: boolean }[]>([]);
  const [activeTopic, setActiveTopic] = useState<TopicDetail | null>(null);
  const [ideaDraft, setIdeaDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [showNewTopic, setShowNewTopic] = useState(false);

  useEffect(() => {
    fetch("/api/co-creation/topics").then(r => r.json()).then((data: { id: string; title: string; isActive: boolean }[]) => {
      setTopics(data);
      const active = data.find((t) => t.isActive);
      if (active) loadTopicDetail(active.id);
    }).catch(() => {});
  }, []);

  async function loadTopicDetail(topicId: string) {
    const res = await fetch(`/api/co-creation/topics`);
    const allTopics = await res.json();
    const active = allTopics.find((t: { id: string }) => t.id === topicId);
    if (active) {
      const detailRes = await fetch(`/api/state`);
      const detail = await detailRes.json();
      setActiveTopic({
        id: active.id,
        title: active.title,
        round: active.round,
        maxRounds: active.maxRounds,
        converged: active.converged,
        report: active.report,
        isActive: active.isActive,
        ideas: [],
        categories: {},
        votes: {},
      });
    }
  }

  async function handleSubmitIdeas() {
    if (!ideaDraft.trim()) return;
    setLoading(true);
    setNotice("");
    const ideas = ideaDraft.split("\n").map((l) => l.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/co-creation/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: topics.find((t) => t.isActive)?.id, ideas }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotice("观点已提交");
        setIdeaDraft("");
      } else {
        setNotice(data.error || "提交失败");
      }
    } catch {
      setNotice("网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleRunRound() {
    setLoading(true);
    setNotice("");
    const ideas = ideaDraft.split("\n").map((l) => l.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/co-creation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: topics.find((t) => t.isActive)?.id, ideas }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotice(data.converged ? "共创已收敛，《共识报告》已生成。" : "本轮已运行，继续下一轮可判断智慧饱和。");
        setIdeaDraft("");
      } else {
        setNotice(data.error || "运行失败");
      }
    } catch {
      setNotice("网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(idea: string) {
    const topicId = topics.find((t) => t.isActive)?.id;
    if (!topicId) return;
    try {
      await fetch("/api/co-creation/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, idea }),
      });
      setNotice("已投票");
    } catch {
      setNotice("投票失败");
    }
  }

  async function handleCreateTopic() {
    if (!newTopicTitle.trim()) return;
    try {
      const res = await fetch("/api/co-creation/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTopicTitle }),
      });
      if (res.ok) {
        setNewTopicTitle("");
        setShowNewTopic(false);
        fetch("/api/co-creation/topics").then(r => r.json()).then(setTopics);
        setNotice("主题已创建");
      }
    } catch {
      setNotice("创建失败");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <GitBranch className={`w-5 h-5 ${toneClass.amber.split(" ")[0]}`} />
        <h2 className="text-xl font-bold text-[var(--foreground)]">{module_.title}</h2>
        <span className="text-sm text-[var(--muted)]">· {module_.coach}</span>
      </div>

      <div className="flex items-center gap-3">
        <select className="px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm">
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.title} {t.isActive ? "(当前)" : ""}</option>
          ))}
        </select>
        {(user?.role === "admin" || user?.role === "teacher") && (
          <button onClick={() => setShowNewTopic(!showNewTopic)} className="flex items-center gap-1 px-3 py-2 rounded border border-[var(--line)] text-sm hover:bg-[var(--surface-strong)]">
            <Plus className="w-4 h-4" /> 新建主题
          </button>
        )}
      </div>

      {showNewTopic && (
        <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--surface)] space-y-3">
          <input value={newTopicTitle} onChange={(e) => setNewTopicTitle(e.target.value)} placeholder="输入共创主题标题" className="w-full px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm" />
          <button onClick={handleCreateTopic} className="px-4 py-2 rounded bg-[var(--teal)] text-white text-sm font-medium hover:opacity-90">创建</button>
        </div>
      )}

      <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--surface)] space-y-3">
        <h3 className="font-medium text-[var(--foreground)]">提交共创观点</h3>
        <p className="text-xs text-[var(--muted)]">每行一条观点，建议写成：建议 + 理由 + 落地条件</p>
        <textarea
          value={ideaDraft}
          onChange={(e) => setIdeaDraft(e.target.value)}
          placeholder="每行一条观点..."
          rows={5}
          className="w-full px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm focus:outline-none focus:border-[var(--teal)] resize-y"
        />
        <div className="flex gap-2">
          <button onClick={handleSubmitIdeas} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded bg-[var(--teal)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
            <Send className="w-4 h-4" /> 提交观点
          </button>
          {(user?.role === "admin" || user?.role === "teacher") && (
            <button onClick={handleRunRound} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded bg-[var(--amber)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
              <Sparkles className="w-4 h-4" /> 运行收敛
            </button>
          )}
        </div>
        {notice && <p className="text-sm text-[var(--teal)]">{notice}</p>}
      </div>
    </div>
  );
}
