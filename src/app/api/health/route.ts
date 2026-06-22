import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "wuhuan-training-agent",
    timestamp: new Date().toISOString()
  });
}
