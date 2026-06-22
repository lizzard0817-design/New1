"use client";
import { ProtectedRoute } from "@/components/layout";
import { RingPage } from "@/components/rings/ring-page";

export default function Practice() {
  return <ProtectedRoute permission="viewLearningWorkflows"><RingPage phase="practice" /></ProtectedRoute>;
}
