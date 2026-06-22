"use client";
import type { ReactNode } from "react";
import { TopNav } from "./top-nav";
import { useAuth } from "@/hooks/use-auth";
import { Lock } from "lucide-react";

type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

export function PageShell({ children, title, subtitle }: Props) {
  const { permissionNotice } = useAuth();

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-[980px] px-5 pt-8 pb-20">
        {title && (
          <div className="mb-8">
            <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-[15px] text-[var(--text-secondary)] leading-relaxed">{subtitle}</p>}
          </div>
        )}
        {permissionNotice && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-red-200 bg-[var(--coral-soft)] px-5 py-3 text-sm font-medium text-[var(--danger)]">
            <Lock size={14} />
            {permissionNotice}
          </div>
        )}
        {children}
      </main>
    </>
  );
}
