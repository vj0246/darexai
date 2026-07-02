import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { rotateRefresh } from "@/lib/auth/tokens";
import { signAccess } from "@/lib/auth/jwt";
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from "@/lib/auth/cookies";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = cookies().get(REFRESH_COOKIE)?.value;
  if (!raw) return NextResponse.json({ error: "no_token" }, { status: 401 });

  const r = await rotateRefresh(raw);
  if (!r.ok) {
    clearAuthCookies();
    const code = r.reason === "reuse" ? 403 : 401;
    return NextResponse.json({ error: r.reason }, { status: code });
  }

  const user = await prisma.user.findUnique({ where: { id: r.userId } });
  if (!user) { clearAuthCookies(); return NextResponse.json({ error: "no_user" }, { status: 401 }); }

  const access = await signAccess({ sub: user.id, tid: user.tenantId, role: user.role });
  setAuthCookies(access, r.raw);
  await audit({
    tenantId: user.tenantId, userId: user.id, action: "TOKEN_REFRESH",
    ip: req.headers.get("x-forwarded-for"),
  });
  return NextResponse.json({ ok: true });
}
