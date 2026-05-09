import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { getDueReminders, getAllDueReminders } from "@/lib/services/reminders";

export const GET = withAuth(async (_request, _ctx, user) => {
  if (user.role === "student") {
    return NextResponse.json(getDueReminders(user.sub));
  }
  return NextResponse.json(getAllDueReminders());
});
