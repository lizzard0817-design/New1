"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { LogIn } from "lucide-react";
import type { RoleId } from "@/lib/agents";

const demoAccounts = [
  { username: "admin", password: "admin123", label: "管理员", role: "admin" as RoleId },
  { username: "teacher", password: "teacher123", label: "班主任", role: "teacher" as RoleId },
  { username: "student", password: "student123", label: "学员", role: "student" as RoleId },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.ok) {
      router.push("/dashboard");
    } else {
      setError(result.error || "登录失败");
    }
  }

  async function quickLogin(username: string, password: string) {
    setError("");
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.ok) {
      router.push("/dashboard");
    } else {
      setError(result.error || "登录失败");
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto p-8">
      <div className="bg-[var(--surface)] rounded-xl shadow-sm border border-[var(--line)] p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[var(--teal-soft)] text-[var(--teal)] rounded-full flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">五环共创培训智能体</h1>
          <p className="text-sm text-[var(--muted)] mt-1">请登录以继续</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm focus:outline-none focus:border-[var(--teal)]"
              placeholder="输入用户名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm focus:outline-none focus:border-[var(--teal)]"
              placeholder="输入密码"
            />
          </div>
          {error && <p className="text-sm text-[var(--coral)]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded bg-[var(--teal)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[var(--line)]">
          <p className="text-xs text-[var(--muted)] mb-3">演示账号快速登录：</p>
          <div className="flex gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.username}
                onClick={() => quickLogin(acc.username, acc.password)}
                className="flex-1 py-1.5 px-2 rounded border border-[var(--line)] text-xs text-[var(--muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)]"
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
