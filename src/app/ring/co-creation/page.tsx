"use client";
import { ProtectedRoute } from "@/components/layout";
import { CoCreationPage } from "@/components/rings/co-creation-page";

export default function CoCreation() {
  return <ProtectedRoute permission="viewLearningWorkflows"><CoCreationPage /></ProtectedRoute>;
}
