"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { coachModules } from "@/lib/agents";
import { Database } from "lucide-react";
import { Pagination } from "@/components/shared/hooks";

export default function KnowledgePage() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<string>("");
  const [entries, setEntries] = useState<{ data: unknown[]; total: number; page: number; pageSize: number }>({ data: [], total: 0, page: 1, pageSize: 20 });
  const [page, setPage] = useState(1);

  useEffect(() => {
    const url = `/api/knowledge?page=${page}&pageSize=20${phase ? `&phase=${phase}` : ""}`;
    fetch(url).then(r => r.json()).then(setEntries).catch(() => {});
  }, [phase, page]);

  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Database className="w-5 h-5 text-[var(--teal)]" />
        <h2 className="text-xl font-bold text-[var(--foreground)]">知识库</h2>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setPhase("")} className={`px-3 py-1.5 rounded text-sm ${!phase ? "bg-[var(--teal)] text-white" : "border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface-strong)]"}`}>
          全部
        </button>
        {coachModules.map((m) => (
          <button key={m.id} onClick={() => setPhase(m.id)} className={`px-3 py-1.5 rounded text-sm ${phase === m.id ? "bg-[var(--teal)] text-white" : "border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface-strong)]"}`}>
            {m.title}
          </button>
        ))}
      </div>

      {entries.data.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">暂无知识库条目</p>
      ) : (
        <div className="space-y-3">
          {entries.data.map((entry: unknown) => {
            const e = entry as Record<string, unknown>;
            return (
              <div key={e.id as string} className="border border-[var(--line)] rounded-lg p-4 bg-[var(--surface)] space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-[var(--foreground)]">{e.title as string}</h4>
                    <p className="text-xs text-[var(--muted)]">{e.source as string} · {e.phase as string}</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--foreground)]">{e.summary as string}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {((e.tags as string[]) || []).map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded bg-[var(--surface-strong)] text-[var(--muted)]">{tag}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Pagination page={entries.page} pageSize={entries.pageSize} total={entries.total} onChange={setPage} />
    </div>
  );
}
