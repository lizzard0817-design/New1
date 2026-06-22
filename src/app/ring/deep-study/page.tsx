"use client";
import { ProtectedRoute } from "@/components/layout";
import { RingPage } from "@/components/rings/ring-page";

export default function DeepStudy() {
  return <ProtectedRoute permission="viewLearningWorkflows"><RingPage phase="deep-study" /></ProtectedRoute>;
}
