import { NextRequest, NextResponse } from "next/server";
import { verifyAccess } from "@/lib/auth/jwt";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";

// Edge gate for app pages. Verifies access JWT (jose, no DB).
// Stale access → client calls /api/auth/refresh (rotation) then retries.
const PUBLIC = ["/login", "/api/auth", "/api/whatsapp"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  const claims = token ? await verifyAccess(token) : null;
  if (!claims) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  // Propagate tenant to downstream handlers via header (defence in depth).
  const res = NextResponse.next();
  res.headers.set("x-tenant-id", claims.tid);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login).*)"],
};
