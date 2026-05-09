import { NextRequest, NextResponse } from "next/server";
import { validateLogin } from "@/lib/services/accounts";
import { signToken } from "@/lib/auth/jwt";
import { COOKIE_NAME, cookieOptions } from "@/lib/auth/cookies";
import { getDb, runMigrations } from "@/lib/db";
import { seedDatabase } from "@/lib/db/seed";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    runMigrations();
    await seedDatabase();

    const body = await request.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json({ error: "请输入用户名和密码", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const user = await validateLogin(username, password);
    if (!user) {
      return NextResponse.json({ error: "用户名或密码错误", code: "VALIDATION_ERROR" }, { status: 401 });
    }

    const token = await signToken({ sub: user.id, role: user.role, name: user.name });

    const response = NextResponse.json({
      user: { id: user.id, username: user.username, name: user.name, role: user.role, className: user.className, title: user.title },
    });

    response.cookies.set(COOKIE_NAME, token, cookieOptions());
    return response;
  } catch (err) {
    console.error("[auth/login] Error:", err);
    return NextResponse.json({ error: "登录失败", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
