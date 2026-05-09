import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { saveModelConfig, getModelConfig } from "@/lib/services/model-config";

export const GET = withAuth(async (_request, _ctx, user) => {
  const config = getModelConfig(user.sub);
  return NextResponse.json(config);
});

export const POST = withAuth(async (request, _ctx, user) => {
  const body = await request.json();
  const result = saveModelConfig(user.sub, {
    enabled: !!body.enabled,
    providerName: String(body.providerName || ""),
    baseUrl: String(body.baseUrl || ""),
    model: String(body.model || ""),
    apiKey: String(body.apiKey || ""),
  });
  return NextResponse.json(result);
});
