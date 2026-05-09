import type { LearningItem, ModelConfig, PhaseId } from "@/lib/agents";

type MiniMaxReview = {
  quality: LearningItem["quality"];
  tags: string[];
  aiSummary: string;
  reviewSource: "minimax" | "custom" | "local";
};

export async function reviewWithMiniMax(input: {
  phase: PhaseId;
  title: string;
  body: string;
  modelConfig?: ModelConfig | null;
}): Promise<MiniMaxReview | null> {
  const runtime = resolveRuntimeConfig(input.modelConfig);
  const apiKey = runtime.apiKey;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch(`${runtime.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: runtime.model,
        messages: [
          {
            role: "system",
            content:
              "你是五环共创培训系统的内容审核智能体。只输出 JSON，不要输出解释。字段：quality 为 待补充/合规/优秀；tags 为 2-4 个中文标签；aiSummary 为 50 字以内摘要。"
          },
          {
            role: "user",
            content: `环节：${input.phase}\n标题：${input.title}\n内容：${input.body}`
          }
        ],
        temperature: 0.2,
        max_tokens: 220
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`${runtime.providerName} 请求超时（30秒）`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`${runtime.providerName} request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return null;

  const parsed = parseJsonObject(content);
  if (!parsed) return null;
  const quality = normalizeQuality(parsed.quality);
  const tags = Array.isArray(parsed.tags) ? parsed.tags.filter((item: unknown) => typeof item === "string").slice(0, 4) : [];
  const aiSummary = typeof parsed.aiSummary === "string" ? parsed.aiSummary.slice(0, 80) : "";
  return {
    quality,
    tags: tags.length ? tags : ["AI审核"],
    aiSummary,
    reviewSource: runtime.source
  };
}

function resolveRuntimeConfig(config?: ModelConfig | null) {
  if (config?.enabled && config.apiKey && config.baseUrl && config.model) {
    return {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
      providerName: config.providerName || "自定义模型",
      source: "custom" as const
    };
  }

  return {
    apiKey: "",
    baseUrl: "",
    model: "",
    providerName: "未配置模型",
    source: "local" as const
  };
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  const cleaned = value.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  try {
    return JSON.parse(match ? match[0] : cleaned);
  } catch {
    return null;
  }
}

function normalizeQuality(value: unknown): LearningItem["quality"] {
  if (value === "优秀" || value === "合规" || value === "待补充") return value;
  return "合规";
}
