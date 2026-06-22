import { NextResponse } from "next/server";
import { apiError, requirePermission } from "@/lib/api-utils";
import { reviewWithMiniMax } from "@/lib/minimax";
import type { ModelConfig } from "@/lib/agents";

export async function POST(request: Request) {
  const auth = requirePermission(request, "configureModel");
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError("请求体不是有效 JSON。", 400, "VALIDATION_ERROR");
  }
  const modelConfig = body.modelConfig as ModelConfig | undefined;
  if (!modelConfig?.enabled || !modelConfig.apiKey || !modelConfig.baseUrl || !modelConfig.model) {
    return apiError("请先启用模型并填写 Base URL、模型名和 API Key。", 400, "VALIDATION_ERROR");
  }

  try {
    const review = await reviewWithMiniMax({
      phase: "deep-study",
      title: "模型连接测试",
      body: "我看到课堂问题链可以帮助学生先描述事实，再解释原因，最后迁移到自己的任务中。下一次我会用这个结构设计小组讨论。",
      modelConfig
    });
    if (!review) {
      return apiError("模型未返回可解析的审核结果。", 502, "MODEL_RESPONSE_ERROR");
    }
    return NextResponse.json({
      ok: true,
      providerName: modelConfig.providerName,
      model: modelConfig.model,
      reviewSource: review.reviewSource,
      sampleQuality: review.quality,
      sampleTags: review.tags
    });
  } catch {
    return apiError("模型连接失败，请检查 Base URL、模型名和 API Key。", 502, "MODEL_REQUEST_FAILED");
  }
}
