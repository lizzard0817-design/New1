"use client";

import { useState, useEffect, useCallback } from "react";

export function useFetch<T>(url: string, defaultValue: T): {
  data: T;
  loading: boolean;
  error: string;
  refetch: () => void;
} {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetcher = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `请求失败 (${res.status})`);
        return;
      }
      const result = await res.json();
      setData(result);
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => { fetcher(); }, [fetcher]);

  return { data, loading, error, refetch: fetcher };
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-2 mt-4 justify-center">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="px-3 py-1 rounded border border-[var(--line)] text-sm disabled:opacity-30 hover:bg-[var(--surface-strong)]"
      >
        上一页
      </button>
      <span className="text-sm text-[var(--muted)]">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="px-3 py-1 rounded border border-[var(--line)] text-sm disabled:opacity-30 hover:bg-[var(--surface-strong)]"
      >
        下一页
      </button>
    </div>
  );
}
