import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { listGroups, createGroup, setGroupMembers } from "@/lib/services/groups";

export const GET = withAuth(async () => {
  return NextResponse.json(listGroups());
}, { roles: ["admin", "teacher"] });

export const POST = withAuth(async (request) => {
  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "缺少分组名称", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  const group = createGroup(name);
  if (Array.isArray(body.members)) {
    setGroupMembers(group!.id, body.members);
  }
  return NextResponse.json(group, { status: 201 });
}, { roles: ["admin", "teacher"] });
