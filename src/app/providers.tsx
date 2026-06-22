"use client";
import { AuthProvider } from "@/hooks/use-auth";
import { SharedStateProvider } from "@/hooks/use-shared-state";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SharedStateProvider>
        {children}
      </SharedStateProvider>
    </AuthProvider>
  );
}
