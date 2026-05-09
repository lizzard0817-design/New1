import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { listTopics, createTopic } from "@/lib/services/co-creation";

export const GET = withAuth(async () => {
  const topics = listTopics();
  return NextResponse.json(topics);
});

export const POST = withAuth(async (request) => {
  const body = await request.json();
  const title = String(body.title || "").trim();
  const maxRounds = Number(body.maxRounds || 3);

  if (!title) {
    return NextResponse.json({ error: "缺少主题标题", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const topic = createTopic(title, maxRounds);
  return NextResponse.json(topic);
}, { roles: ["admin", "teacher"] });
