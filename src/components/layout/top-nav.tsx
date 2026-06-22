"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Sparkles, UserRound, LogOut } from "lucide-react";

const links = [
  { href: "/", label: "仪表盘" },
  { href: "/ring/deep-study", label: "深学环" },
  { href: "/ring/practice", label: "跟练环" },
  { href: "/ring/reflection", label: "反思环" },
  { href: "/ring/co-creation", label: "共创环" },
  { href: "/ring/transformation", label: "转化环" },
  { href: "/knowledge", label: "知识库" },
  { href: "/settings", label: "设置" }
];

export function TopNav() {
  const pathname = usePathname();
  const { currentAccount, currentRole, logout } = useAuth();
  const router = useRouter();

  if (!currentAccount) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-[980px] items-center justify-between px-5">
        <div className="flex items-center gap-1 min-w-0">
          <Link href="/" className="mr-4 flex items-center gap-2 shrink-0">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--accent)]">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight">五环共创</span>
          </Link>
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  active ? "text-[var(--text)] bg-black/5" : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-black/3"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-3 ml-4 shrink-0">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <UserRound size={14} />
            <span className="font-medium text-[var(--text)]">{currentAccount.name}</span>
            {currentRole && <span className="opacity-60">{currentRole.name}</span>}
          </div>
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="rounded-full p-1.5 text-[var(--text-secondary)] hover:bg-black/5 transition-colors"
            title="退出登录"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </nav>
  );
}
