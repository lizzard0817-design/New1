import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { updateAccount, deleteAccount, getUserById } from "@/lib/services/accounts";
import type { RoleId } from "@/lib/agents";

export const PUT = withAuth(async (request, context) => {
  const { id } = await context.params;
  const body = await request.json();

  const updates: {
    name?: string;
    role?: RoleId;
    className?: string;
    title?: string;
    disabled?: boolean;
    password?: string;
  } = {};

  if (body.name !== undefined) updates.name = String(body.name);
  if (body.role !== undefined) updates.role = body.role as RoleId;
  if (body.className !== undefined) updates.className = String(body.className);
  if (body.title !== undefined) updates.title = String(body.title);
  if (body.disabled !== undefined) updates.disabled = !!body.disabled;
  if (body.password) updates.password = String(body.password);

  const account = await updateAccount(id, updates);
  if (!account) {
    return NextResponse.json({ error: "账号不存在", code: "VALIDATION_ERROR" }, { status: 404 });
  }

  return NextResponse.json(account);
}, { roles: ["admin"] });

export const DELETE = withAuth(async (request, context) => {
  const { id } = await context.params;
  const currentUserId = request.headers.get("x-user-id");

  if (id === currentUserId) {
    return NextResponse.json({ error: "不能删除自己的账号", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  deleteAccount(id);
  return NextResponse.json({ ok: true });
}, { roles: ["admin"] });
