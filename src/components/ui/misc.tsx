import type { ReactNode } from "react";

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--border)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
      {children}
    </span>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--bg-secondary)] px-5 py-4">
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export function Badge({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "accent" | "danger" }) {
  const variants = {
    default: "bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
    accent: "bg-[var(--teal-soft)] text-[var(--accent)]",
    danger: "bg-[var(--coral-soft)] text-[var(--danger)]"
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
