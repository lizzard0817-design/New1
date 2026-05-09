"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Users, Plus, ShieldCheck, Trash2, Edit } from "lucide-react";
import type { RoleId } from "@/lib/agents";

type Account = {
  id: string;
  username: string;
  name: string;
  role: RoleId;
  className: string;
  title: string;
  disabled: boolean;
};

export default function AdminAccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newAccount, setNewAccount] = useState({ username: "", password: "", name: "", role: "student" as RoleId, className: "", title: "" });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/admin/accounts").then(r => r.json()).then(setAccounts).catch(() => {});
  }, []);

  async function handleCreate() {
    if (!newAccount.username || !newAccount.password || !newAccount.name) {
      setNotice("请填写必填字段");
      return;
    }
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAccount),
      });
      const data = await res.json();
      if (res.ok) {
        setNotice("账号已创建");
        setShowCreate(false);
        setNewAccount({ username: "", password: "", name: "", role: "student", className: "", title: "" });
        fetch("/api/admin/accounts").then(r => r.json()).then(setAccounts);
      } else {
        setNotice(data.error || "创建失败");
      }
    } catch {
      setNotice("网络错误");
    }
  }

  async function handleToggleDisable(id: string, disabled: boolean) {
    try {
      const res = await fetch(`/api/admin/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !disabled }),
      });
      if (res.ok) {
        fetch("/api/admin/accounts").then(r => r.json()).then(setAccounts);
      }
    } catch {
      setNotice("操作失败");
    }
  }

  async function handleDelete(id: string) {
    if (id === user?.id) { setNotice("不能删除自己的账号"); return; }
    if (!confirm("确定要删除此账号吗？")) return;
    try {
      await fetch(`/api/admin/accounts/${id}`, { method: "DELETE" });
      fetch("/api/admin/accounts").then(r => r.json()).then(setAccounts);
    } catch {
      setNotice("删除失败");
    }
  }

  const roleLabel: Record<string, string> = { admin: "管理员", teacher: "班主任", student: "学员" };
  const roleColor: Record<string, string> = { admin: "bg-[var(--violet-soft)] text-[var(--violet)]", teacher: "bg-[var(--teal-soft)] text-[var(--teal)]", student: "bg-[var(--amber-soft)] text-[var(--amber)]" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--violet)]" />
          <h2 className="text-xl font-bold text-[var(--foreground)]">账号管理</h2>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1 px-3 py-2 rounded bg-[var(--teal)] text-white text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> 创建账号
        </button>
      </div>

      {showCreate && (
        <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--surface)] space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={newAccount.username} onChange={(e) => setNewAccount((a) => ({ ...a, username: e.target.value }))} placeholder="用户名 *" className="px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm" />
            <input type="password" value={newAccount.password} onChange={(e) => setNewAccount((a) => ({ ...a, password: e.target.value }))} placeholder="密码 *" className="px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm" />
            <input value={newAccount.name} onChange={(e) => setNewAccount((a) => ({ ...a, name: e.target.value }))} placeholder="姓名 *" className="px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm" />
            <select value={newAccount.role} onChange={(e) => setNewAccount((a) => ({ ...a, role: e.target.value as RoleId }))} className="px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm">
              <option value="student">学员</option>
              <option value="teacher">班主任</option>
              <option value="admin">管理员</option>
            </select>
            <input value={newAccount.className} onChange={(e) => setNewAccount((a) => ({ ...a, className: e.target.value }))} placeholder="班级" className="px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm" />
            <input value={newAccount.title} onChange={(e) => setNewAccount((a) => ({ ...a, title: e.target.value }))} placeholder="职称" className="px-3 py-2 rounded border border-[var(--line)] bg-[var(--surface-strong)] text-sm" />
          </div>
          <button onClick={handleCreate} className="px-4 py-2 rounded bg-[var(--teal)] text-white text-sm font-medium hover:opacity-90">创建</button>
        </div>
      )}

      {notice && <p className="text-sm text-[var(--coral)]">{notice}</p>}

      <div className="space-y-2">
        {accounts.map((acc) => (
          <div key={acc.id} className={`flex items-center gap-3 p-3 rounded-lg border ${acc.disabled ? "border-[var(--line)] opacity-50" : "border-[var(--line)]"} bg-[var(--surface)]`}>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--foreground)]">{acc.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${roleColor[acc.role]}`}>{roleLabel[acc.role]}</span>
                {acc.disabled && <span className="text-xs px-2 py-0.5 rounded bg-[var(--coral-soft)] text-[var(--coral)]">已禁用</span>}
              </div>
              <p className="text-xs text-[var(--muted)]">{acc.username} · {acc.className}</p>
            </div>
            <button onClick={() => handleToggleDisable(acc.id, acc.disabled)} className="px-2 py-1 rounded text-xs border border-[var(--line)] hover:bg-[var(--surface-strong)]">
              {acc.disabled ? "启用" : "禁用"}
            </button>
            <button onClick={() => handleDelete(acc.id)} className="px-2 py-1 rounded text-xs text-[var(--coral)] border border-[var(--line)] hover:bg-[var(--coral-soft)]">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
