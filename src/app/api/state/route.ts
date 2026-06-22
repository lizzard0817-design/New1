import { NextResponse } from "next/server";
import { requirePermission, sanitizeStateForActor } from "@/lib/api-utils";
import { readSharedState } from "@/lib/server-state";

export async function GET(request: Request) {
  const auth = requirePermission(request, "viewDashboard");
  if ("response" in auth) return auth.response;
  const state = await readSharedState();
  return NextResponse.json(sanitizeStateForActor(state, auth.actor));
}
