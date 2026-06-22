"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  can,
  demoAccounts,
  permissionLabels,
  roleProfiles,
  type DemoAccount,
  type PermissionKey
} from "@/lib/agents";

type AuthContextValue = {
  currentAccount: DemoAccount | null;
  currentRole: (typeof roleProfiles)[number] | null;
  login: (account: DemoAccount) => void;
  logout: () => void;
  has: (permission: PermissionKey) => boolean;
  deny: (permission: PermissionKey) => void;
  permissionNotice: string;
  setPermissionNotice: (notice: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentAccount, setCurrentAccount] = useState<DemoAccount | null>(null);
  const [permissionNotice, setPermissionNotice] = useState("");

  useEffect(() => {
    const raw = window.localStorage.getItem("wuhuan-current-account");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as DemoAccount;
      if (parsed?.id) {
        const known = demoAccounts.find((a) => a.id === parsed.id);
        setCurrentAccount({ ...(known || parsed), ...parsed, groupName: parsed.groupName || known?.groupName || "全班" });
      }
    } catch {
      window.localStorage.removeItem("wuhuan-current-account");
    }
  }, []);

  const currentRole = useMemo(
    () => roleProfiles.find((r) => r.id === currentAccount?.role) || null,
    [currentAccount?.role]
  );

  const login = useCallback((account: DemoAccount) => {
    setCurrentAccount(account);
    window.localStorage.setItem("wuhuan-current-account", JSON.stringify(account));
    setPermissionNotice("");
  }, []);

  const logout = useCallback(() => {
    setCurrentAccount(null);
    window.localStorage.removeItem("wuhuan-current-account");
    setPermissionNotice("");
  }, []);

  const has = useCallback(
    (permission: PermissionKey) => {
      if (!currentAccount) return false;
      return can(currentAccount.role, permission);
    },
    [currentAccount]
  );

  const deny = useCallback(
    (permission: PermissionKey) => {
      const roleName = currentRole?.name || "未登录";
      setPermissionNotice(`${roleName}暂无"${permissionLabels[permission]}"权限。`);
    },
    [currentRole]
  );

  const value = useMemo(
    () => ({
      currentAccount,
      currentRole,
      login,
      logout,
      has,
      deny,
      permissionNotice,
      setPermissionNotice
    }),
    [currentAccount, currentRole, login, logout, has, deny, permissionNotice]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
