import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未登录", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { getUserById } = await import("@/lib/services/accounts");
    const fullUser = await getUserById(user.sub);
    if (!fullUser || fullUser.disabled) {
      return NextResponse.json({ error: "账号已禁用", code: "UNAUTHORIZED" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: fullUser.id,
        username: fullUser.username,
        name: fullUser.name,
        role: fullUser.role,
        className: fullUser.className,
        title: fullUser.title,
      },
    });
  } catch (err) {
    console.error("[auth/me] Error:", err);
    return NextResponse.json({ error: "服务器内部错误", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
