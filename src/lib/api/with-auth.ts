import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, type JWTPayload } from "../auth/session";
import { ApiError, unauthorized, forbidden } from "./errors";
import type { RoleId } from "../agents";

type Handler = (request: NextRequest, context: { params: Promise<Record<string, string>> }, user: JWTPayload) => Promise<NextResponse>;

type WithAuthOptions = {
  roles?: RoleId[];
};

export function withAuth(handler: Handler, options?: WithAuthOptions) {
  return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    try {
      const user = await getUserFromRequest(request);
      if (!user) throw unauthorized();

      if (options?.roles && !options.roles.includes(user.role)) {
        throw forbidden();
      }

      return await handler(request, context, user);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json(err.toJSON(), { status: err.status });
      }
      console.error("[withAuth] Unhandled error:", err);
      return NextResponse.json({ error: "服务器内部错误", code: "INTERNAL_ERROR" }, { status: 500 });
    }
  };
}
