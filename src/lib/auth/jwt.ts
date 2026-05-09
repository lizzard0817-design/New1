import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "wuhuan-dev-secret-change-in-production";
const secret = new TextEncoder().encode(JWT_SECRET);
const ALG = "HS256";
const EXPIRES_IN = "24h";

export type JWTPayload = {
  sub: string;
  role: "admin" | "teacher" | "student";
  name: string;
};

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: ALG })
    .setExpirationTime(EXPIRES_IN)
    .setIssuedAt()
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: payload.sub as string,
      role: payload.role as JWTPayload["role"],
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}
