import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { listItems, createItem } from "@/lib/services/items";
import type { PhaseId, ContentType, RoleId } from "@/lib/agents";
import type { JWTPayload } from "@/lib/auth/jwt";

export const GET = withAuth(async (request) => {
  const url = new URL(request.url);
  const result = listItems({
    page: Number(url.searchParams.get("page") || "1"),
    pageSize: Number(url.searchParams.get("pageSize") || "20"),
    phase: (url.searchParams.get("phase") as PhaseId) || undefined,
    submitterId: url.searchParams.get("submitterId") || undefined,
    isExcellent: url.searchParams.get("isExcellent") === "true" ? true : undefined,
    inKnowledgeBase: url.searchParams.get("inKnowledgeBase") === "true" ? true : undefined,
  });
  return NextResponse.json(result);
});

export const POST = withAuth(async (request, _ctx, user) => {
  const body = await request.json();
  const input = {
    phase: body.phase as PhaseId,
    type: body.type as ContentType,
    title: String(body.title || ""),
    body: String(body.body || ""),
    submitterId: user.sub,
    submitterRole: user.role as RoleId,
    author: user.name,
    attachments: Array.isArray(body.attachments) ? body.attachments : [],
    useAiReview: !!body.useAiReview,
  };

  const result = await createItem(input);
  return NextResponse.json(result);
});
