import { SignJWT, jwtVerify } from "jose";
import { env } from "../env";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export type AccessClaims = {
  sub: string;   // userId
  tid: string;   // tenantId
  role: "OWNER" | "MEMBER";
};

// Edge-safe: jose only, no node:crypto → usable in middleware.
export async function signAccess(c: AccessClaims): Promise<string> {
  return new SignJWT({ tid: c.tid, role: c.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(c.sub)
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TTL}s`)
    .sign(secret);
}

export async function verifyAccess(token: string): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || !payload.tid) return null;
    return {
      sub: payload.sub as string,
      tid: payload.tid as string,
      role: (payload.role as "OWNER" | "MEMBER") ?? "MEMBER",
    };
  } catch {
    return null;
  }
}
