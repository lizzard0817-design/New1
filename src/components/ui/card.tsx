"use client";
import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & { children: ReactNode };

export function Card({ className = "", children, ...props }: Props) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${className}`} {...props}>
      {children}
    </div>
  );
}
