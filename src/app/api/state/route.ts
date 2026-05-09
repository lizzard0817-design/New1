import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { listItems } from "@/lib/services/items";

export const GET = withAuth(async () => {
  const result = listItems({ pageSize: 1000 });
  return NextResponse.json({ items: result.data, totalItems: result.total });
});
