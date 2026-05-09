import { verifyToken, type JWTPayload } from "./jwt";
export type { JWTPayload };
import { COOKIE_NAME } from "./cookies";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function getUserFromRequest(request: NextRequest): Promise<JWTPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
