import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { listKnowledgeEntries, updateEntryTags } from "@/lib/services/knowledge";
import type { PhaseId } from "@/lib/agents";

export const GET = withAuth(async (request) => {
  const url = new URL(request.url);
  const result = listKnowledgeEntries({
    page: Number(url.searchParams.get("page") || "1"),
    pageSize: Number(url.searchParams.get("pageSize") || "20"),
    phase: (url.searchParams.get("phase") as PhaseId) || undefined,
  });
  return NextResponse.json(result);
});
