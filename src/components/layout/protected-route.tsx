"use client";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export function ProtectedRoute({ children, permission }: { children: ReactNode; permission?: string }) {
  const { currentAccount, has } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Small delay to allow AuthProvider to hydrate from localStorage
    const timer = setTimeout(() => setChecking(false), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!checking && !currentAccount) {
      router.push("/login");
    }
  }, [checking, currentAccount, router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <p className="text-[var(--text-secondary)] text-sm">加载中...</p>
      </main>
    );
  }

  if (!currentAccount) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <p className="text-[var(--text-secondary)] text-sm">请先登录...</p>
      </main>
    );
  }

  if (permission && !has(permission as any)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <p className="text-[var(--text-secondary)] text-sm">无访问权限</p>
      </main>
    );
  }

  return <>{children}</>;
}
