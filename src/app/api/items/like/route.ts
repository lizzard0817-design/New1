import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { likeItem } from "@/lib/services/items";

export const POST = withAuth(async (request, _ctx, user) => {
  const body = await request.json();
  const itemId = String(body.itemId || "");
  if (!itemId) {
    return NextResponse.json({ error: "缺少内容 ID", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  const result = likeItem(itemId, user.sub);
  return NextResponse.json(result);
});
