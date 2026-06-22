"use client";
import { ProtectedRoute } from "@/components/layout";
import { RingPage } from "@/components/rings/ring-page";

export default function Reflection() {
  return <ProtectedRoute permission="viewLearningWorkflows"><RingPage phase="reflection" /></ProtectedRoute>;
}
