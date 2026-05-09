import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { getDecryptedModelConfig } from "@/lib/services/model-config";
import { reviewWithMiniMax } from "@/lib/minimax";

export const POST = withAuth(async (_request, _ctx, user) => {
  const config = await getDecryptedModelConfig(user.sub);
  if (!config || !config.enabled) {
    return NextResponse.json({ ok: false, error: "未配置模型或模型未启用" }, { status: 400 });
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const result = await reviewWithMiniMax({
      phase: "deep-study",
      title: "连接测试",
      body: "请回复'连接成功'。",
      modelConfig: config,
    });

    clearTimeout(timeout);
    const latency = Date.now() - start;

    return NextResponse.json({ ok: true, latency, response: result?.aiSummary || "连接成功" });
  } catch (err) {
    const latency = Date.now() - start;
    const message = err instanceof Error && err.name === "AbortError" ? "连接超时（30秒）" : "连接失败";
    return NextResponse.json({ ok: false, latency, error: message }, { status: 502 });
  }
});
