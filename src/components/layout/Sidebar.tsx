"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  BookOpenCheck,
  Brain,
  ClipboardCheck,
  Database,
  GitBranch,
  GraduationCap,
  LogOut,
  MessageSquareText,
  Rocket,
  Settings,
  Sparkles,
  Users,
  ShieldCheck,
} from "lucide-react";
import { navItems, viewPermission, can, type RoleId } from "@/lib/agents";
import type { PermissionKey } from "@/lib/agents";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: GraduationCap,
  coach: Sparkles,
  "deep-study": BookOpenCheck,
  practice: ClipboardCheck,
  reflection: MessageSquareText,
  "co-creation": GitBranch,
  transformation: Rocket,
  knowledge: Database,
  "model-settings": Settings,
  "admin-accounts": Users,
};

const routeMap: Record<string, string> = {
  dashboard: "/dashboard",
  coach: "/coach",
  "deep-study": "/deep-study",
  practice: "/practice",
  reflection: "/reflection",
  "co-creation": "/co-creation",
  transformation: "/transformation",
  knowledge: "/knowledge",
  "model-settings": "/model-settings",
  "admin-accounts": "/admin/accounts",
};

export function Sidebar() {
  const { user, logout, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const role = user?.role || "student";

  const visibleItems = navItems.filter((item) => {
    const perm = viewPermission(item.id);
    return can(role as RoleId, perm);
  });

  if (role === "admin" && hasPermission("managePermissions")) {
    visibleItems.push({ id: "admin-accounts" as never, label: "账号管理", icon: Users } as never);
  }

  return (
    <aside className="w-56 shrink-0 border-r border-[var(--line)] bg-[var(--surface)] flex flex-col h-full">
      <div className="p-4 border-b border-[var(--line)]">
        <h1 className="text-lg font-bold text-[var(--foreground)]">五环共创培训智能体</h1>
        {user && (
          <p className="text-sm text-[var(--muted)] mt-1">{user.name} · {role === "admin" ? "管理员" : role === "teacher" ? "班主任" : "学员"}</p>
        )}
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = iconMap[item.id] || Database;
          const href = routeMap[item.id] || "/";
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={item.id}
              href={href}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? "bg-[var(--teal-soft)] text-[var(--teal)] font-medium"
                  : "text-[var(--muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-[var(--line)]">
        <button
          onClick={() => { logout().then(() => router.push("/login")); }}
          className="flex items-center gap-2 px-3 py-2 rounded text-sm text-[var(--muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)] w-full"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>
    </aside>
  );
}
