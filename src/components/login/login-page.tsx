"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useSharedState } from "@/hooks/use-shared-state";
import { Button, Input, Card } from "@/components/ui";
import { LogIn, Sparkles } from "lucide-react";
import { demoAccounts, roleProfiles, type DemoAccount } from "@/lib/agents";

export function LoginPage() {
  const { login } = useAuth();
  const { accounts } = useSharedState();
  const router = useRouter();
  const [form, setForm] = useState({ username: "teacher", password: "teacher123" });
  const [error, setError] = useState("");

  const sourceAccounts = accounts.length ? accounts : demoAccounts;

  function handleLogin(account?: DemoAccount) {
    const matched = account || sourceAccounts.find((a) => a.username === form.username.trim() && a.password === form.password);
    if (!matched) { setError("账号或密码不正确"); return; }
    if (matched.active === false) { setError("该账号已被停用"); return; }
    setError("");
    login(matched);
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <Card className="p-8 text-center">
          <div className="mb-8">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent)] mx-auto mb-4">
              <Sparkles size={22} className="text-white" />
            </div>
            <p className="text-2xl font-semibold tracking-tight">五环共创</p>
            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">教师培训智能体</p>
          </div>

          <div className="space-y-4 text-left">
            <label className="block">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">账号</span>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="输入账号" className="mt-2" />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">密码</span>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }} placeholder="输入密码" className="mt-2" />
            </label>
          </div>

          {error && <p className="mt-4 rounded-xl bg-[var(--coral-soft)] px-4 py-2.5 text-sm font-medium text-[var(--danger)]">{error}</p>}

          <Button onClick={() => handleLogin()} className="mt-5 w-full">
            <LogIn size={15} />
            登录
          </Button>

          <div className="mt-8 pt-6 border-t border-[var(--border)]">
            <p className="text-[11px] text-[var(--text-secondary)] mb-3">演示账号快速登录</p>
            <div className="grid grid-cols-3 gap-2">
              {sourceAccounts.filter((a) => a.active !== false).map((a) => {
                const profile = roleProfiles.find((r) => r.id === a.role);
                return (
                  <button key={a.id} onClick={() => handleLogin(a)}
                    className="rounded-full border border-[var(--border)] py-2 px-2 text-[11px] font-medium text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                    {profile?.name}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
