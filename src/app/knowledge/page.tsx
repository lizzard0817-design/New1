"use client";
import { ProtectedRoute } from "@/components/layout";
import { KnowledgePage } from "@/components/knowledge/knowledge-page";

export default function Knowledge() {
  return <ProtectedRoute permission="viewKnowledgeBase"><KnowledgePage /></ProtectedRoute>;
}
