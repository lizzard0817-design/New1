"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { can, type PermissionKey, type RoleId } from "@/lib/agents";

type CurrentUser = {
  id: string;
  username: string;
  name: string;
  role: RoleId;
  className: string;
  title: string;
};

type AuthContextType = {
  user: CurrentUser | null;
  loading: boolean;
  hasPermission: (permission: PermissionKey) => boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        return { ok: true };
      }
      return { ok: false, error: data.error || "登录失败" };
    } catch {
      return { ok: false, error: "网络错误" };
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  function hasPermission(permission: PermissionKey) {
    if (!user) return false;
    return can(user.role, permission);
  }

  return (
    <AuthContext.Provider value={{ user, loading, hasPermission, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
