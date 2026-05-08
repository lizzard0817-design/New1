import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "wuhuan-training-agent",
    time: new Date().toISOString()
  });
}
