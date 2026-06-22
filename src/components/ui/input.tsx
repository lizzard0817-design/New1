"use client";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const baseClass = "w-full bg-[var(--bg-secondary)] border-b-2 border-[var(--border)] rounded-t-xl px-4 py-3 text-[15px] text-[var(--text)] placeholder:text-[var(--text-secondary)] transition-colors duration-200 focus:border-[var(--accent)] focus:bg-white";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${baseClass} ${className}`} {...props} />;
}

export function Textarea({ className = "", rows = 5, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${baseClass} resize-none leading-relaxed ${className}`} rows={rows} {...props} />;
}

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${baseClass} appearance-none ${className}`} {...props}>
      {children}
    </select>
  );
}
