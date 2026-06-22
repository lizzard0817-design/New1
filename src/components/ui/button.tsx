"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md";
  children: ReactNode;
};

export function Button({ variant = "primary", size = "md", className = "", children, ...props }: Props) {
  const base = "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary: "rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-[0.98]",
    outline: "rounded-full border border-[var(--border)] text-[var(--text)] hover:bg-black/3",
    ghost: "rounded-full text-[var(--accent)] hover:bg-black/3"
  };
  const sizes = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm"
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
