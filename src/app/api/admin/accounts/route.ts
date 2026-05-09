import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { listAllAccounts, createAccount, updateAccount, deleteAccount } from "@/lib/services/accounts";
import type { RoleId } from "@/lib/agents";

export const GET = withAuth(async () => {
  const accounts = listAllAccounts();
  return NextResponse.json(accounts);
}, { roles: ["admin"] });

export const POST = withAuth(async (request) => {
  const body = await request.json();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const name = String(body.name || "").trim();
  const role = body.role as RoleId;

  if (!username || !password || !name || !role) {
    return NextResponse.json({ error: "缺少必填字段", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const account = await createAccount({
    username,
    password,
    name,
    role,
    className: String(body.className || ""),
    title: String(body.title || ""),
  });

  if (!account) {
    return NextResponse.json({ error: "用户名已存在", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  return NextResponse.json(account, { status: 201 });
}, { roles: ["admin"] });
