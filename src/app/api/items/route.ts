import { NextResponse } from "next/server";
import { apiError, parsePositiveInt, requirePermission, sanitizeStateForActor } from "@/lib/api-utils";
import { addSharedItem, listSharedItems } from "@/lib/server-state";
import { reviewWithMiniMax } from "@/lib/minimax";
import type { ContentType, ModelConfig, PhaseId, UploadedAsset } from "@/lib/agents";

const allowedPhases: PhaseId[] = ["deep-study", "practice", "reflection", "co-creation", "transformation"];
const allowedTypes: ContentType[] = ["批注", "即时贴", "问答", "反思案例", "观点", "共识报告", "转化案例"];
const maxTextLength = 8000;

export async function GET(request: Request) {
  const auth = requirePermission(request, "viewLearningWorkflows");
  if ("response" in auth) return auth.response;
  const url = new URL(request.url);
  const phaseParam = url.searchParams.get("phase");
  const phase = allowedPhases.includes(phaseParam as PhaseId) ? (phaseParam as PhaseId) : "all";
  const result = await listSharedItems({
    page: parsePositiveInt(url.searchParams.get("page"), 1),
    pageSize: parsePositiveInt(url.searchParams.get("pageSize"), 10),
    phase,
    author: url.searchParams.get("author") || undefined
  });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = requirePermission(request, "submitLearningContent");
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError("请求体不是有效 JSON。", 400, "VALIDATION_ERROR");
  }
  const phase = body.phase as PhaseId;
  const type = body.type as ContentType;
  const title = String(body.title || "").trim();
  const content = String(body.body || "").trim();

  if (!allowedPhases.includes(phase) || !allowedTypes.includes(type)) {
    return apiError("提交环节或内容类型无效。", 400, "VALIDATION_ERROR");
  }
  if (!title || !content) {
    return apiError("标题和正文不能为空。", 400, "VALIDATION_ERROR");
  }
  if (title.length > 120 || content.length > maxTextLength) {
    return apiError("标题或正文过长。", 413, "VALIDATION_ERROR");
  }

  const input = {
    phase,
    type,
    title,
    body: content,
    author: auth.actor.name,
    submitterId: auth.actor.id,
    submitterRole: auth.actor.role,
    attachments: Array.isArray(body.attachments) ? (body.attachments as UploadedAsset[]) : []
  };
  const modelConfig = body.modelConfig as ModelConfig | undefined;

  let aiReview = null;
  try {
    aiReview = await reviewWithMiniMax({ ...input, modelConfig });
  } catch (error) {
    console.warn("Model review failed; falling back to local rules.");
  }

  const result = await addSharedItem({
    ...input,
    aiReview: aiReview || undefined
  });
  return NextResponse.json({ ...result, state: sanitizeStateForActor(result.state, auth.actor) });
}
