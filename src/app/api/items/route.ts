import { NextResponse } from "next/server";
import { addSharedItem } from "@/lib/server-state";
import { reviewWithMiniMax } from "@/lib/minimax";
import type { ContentType, ModelConfig, PhaseId, UploadedAsset } from "@/lib/agents";

export async function POST(request: Request) {
  const body = await request.json();
  const input = {
    phase: body.phase as PhaseId,
    type: body.type as ContentType,
    title: String(body.title || ""),
    body: String(body.body || ""),
    author: String(body.author || "匿名学员"),
    attachments: Array.isArray(body.attachments) ? (body.attachments as UploadedAsset[]) : []
  };
  const modelConfig = body.modelConfig as ModelConfig | undefined;

  let aiReview = null;
  try {
    aiReview = await reviewWithMiniMax({ ...input, modelConfig });
  } catch (error) {
    console.error(error);
  }

  const result = await addSharedItem({
    ...input,
    aiReview: aiReview || undefined
  });
  return NextResponse.json(result);
}
