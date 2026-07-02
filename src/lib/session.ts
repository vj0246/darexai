import { cookies } from "next/headers";
import { verifyAccess, type AccessClaims } from "./auth/jwt";
import { ACCESS_COOKIE } from "./auth/cookies";

// Server-side session resolver. Returns tenant-scoped identity or null.
export async function getSession(): Promise<AccessClaims | null> {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  return verifyAccess(token);
}

// Helper to force tenant scoping in every query. Use spread in `where`.
export function tenantScope(s: AccessClaims) {
  return { tenantId: s.tid };
}

export async function requireSession(): Promise<AccessClaims> {
  const s = await getSession();
  if (!s) throw new Response("Unauthorized", { status: 401 });
  return s;
}
