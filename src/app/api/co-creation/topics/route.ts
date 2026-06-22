import { NextResponse } from "next/server";
import { apiError, requirePermission, sanitizeStateForActor } from "@/lib/api-utils";
import { readSharedState, updateCoCreationTopic } from "@/lib/server-state";

export async function GET(request: Request) {
  const auth = requirePermission(request, "viewLearningWorkflows");
  if ("response" in auth) return auth.response;
  const state = await readSharedState();
  return NextResponse.json({
    topics: [
      {
        id: "current",
        title: state.coCreation.topic,
        active: !state.coCreation.converged,
        ideas: state.coCreation.ideas.length
      },
      ...(state.coCreation.archives || []).map((archive) => ({
        id: archive.id,
        title: archive.topic,
        active: false,
        ideas: archive.ideas.length,
        createdAt: archive.createdAt
      }))
    ]
  });
}

export async function POST(request: Request) {
  const auth = requirePermission(request, "runCoCreation");
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError("请求体不是有效 JSON。", 400, "VALIDATION_ERROR");
  }
  const topic = String(body.topic || "").trim();
  if (topic.length < 4 || topic.length > 80) {
    return apiError("共创主题需为 4 到 80 个字符。", 400, "VALIDATION_ERROR");
  }
  const result = await updateCoCreationTopic(topic);
  return NextResponse.json({ ...result, state: sanitizeStateForActor(result.state, auth.actor) });
}
