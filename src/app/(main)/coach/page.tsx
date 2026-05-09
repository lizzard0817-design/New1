"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { coachModules, supervisorFunctions, type RoleId } from "@/lib/agents";
import { toneClass } from "@/lib/constants";
import { Sparkles, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function CoachPage() {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState("");

  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);

  useState(() => {
    fetch("/api/admin/accounts").then(r => r.json()).then((accounts: { id: string; name: string; role: string }[]) => {
      setStudents(accounts.filter(a => a.role === "student"));
      if (accounts.filter(a => a.role === "student").length > 0) {
        setSelectedStudent(accounts.filter(a => a.role === "student")[0].id);
      }
    }).catch(() => {});
  });

  async function handleGenerate() {
    if (!selectedStudent) { setNotice("请先选择学员"); return; }
    setGenerating(true);
    setNotice("");
    try {
      const res = await fetch("/api/plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student: selectedStudent }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotice("方案已生成，等待学员确认。");
      } else {
        setNotice(data.error || "生成失败");
      }
    } catch {
      setNotice("网络错误");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[var(--teal)]" />
        <h2 className="text-xl font-bold text-[var(--foreground)]">总教练 Agent</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {supervisorFunctions.map((fn, i) => (
          <div key={i} className="border border-[var(--line)] rounded-lg p-4 bg-[var(--surface)]">
            <h4 className="font-medium text-[var(--foreground)]">{fn.title}</h4>
            <p className="text-sm text-[var(--muted)] mt-1">{fn.body}</p>
          </div>
        ))}
      </div>

      <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--surface)]">
        <h3 className="font-medium text-[var(--foreground)] mb-3">生成个性化方案</h3>
        <div className="flex items-center gap-3">
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm"
          >
            <option value="">选择学员</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 rounded bg-[var(--teal)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {generating ? "生成中..." : "生成方案"}
          </button>
        </div>
        {notice && <p className="text-sm text-[var(--muted)] mt-2">{notice}</p>}
      </div>

      <div>
        <h3 className="font-medium text-[var(--foreground)] mb-3">五个专业教练</h3>
        <div className="space-y-2">
          {coachModules.map((m) => (
            <div key={m.id} className={`flex items-center gap-3 p-3 rounded-lg border ${toneClass[m.tone]}`}>
              <m.icon className="w-5 h-5" />
              <div className="flex-1">
                <p className="font-medium">{m.title} · {m.coach}</p>
                <p className="text-xs mt-0.5 opacity-80">{m.purpose}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
