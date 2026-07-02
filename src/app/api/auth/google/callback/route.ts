import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { exchangeCode, fetchUserInfo } from "@/lib/auth/google";
import { signAccess } from "@/lib/auth/jwt";
import { issueRefresh } from "@/lib/auth/tokens";
import { setAuthCookies } from "@/lib/auth/cookies";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const jar = cookies();
  const verifier = jar.get("dx_pkce")?.value;
  const savedState = jar.get("dx_state")?.value;
  jar.set("dx_pkce", "", { path: "/", maxAge: 0 });
  jar.set("dx_state", "", { path: "/", maxAge: 0 });

  // CSRF + PKCE preconditions.
  if (!code || !state || !verifier || state !== savedState) {
    return NextResponse.redirect(`${env.APP_URL}/login?error=oauth`);
  }

  try {
    const { access_token } = await exchangeCode(code, verifier);
    const info = await fetchUserInfo(access_token);

    // Upsert user. First login creates the tenant (business) too.
    let user = await prisma.user.findUnique({ where: { googleSub: info.sub } });
    if (!user) {
      const tenant = await prisma.tenant.create({
        data: { name: info.name ? `${info.name}'s Business` : "New Business" },
      });
      user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: info.email,
          name: info.name,
          avatarUrl: info.picture,
          googleSub: info.sub,
          role: "OWNER",
        },
      });
    }

    const access = await signAccess({ sub: user.id, tid: user.tenantId, role: user.role });
    const { raw: refresh } = await issueRefresh(user.id);
    setAuthCookies(access, refresh);

    await audit({
      tenantId: user.tenantId, userId: user.id, action: "LOGIN",
      ip: req.headers.get("x-forwarded-for"),
    });

    const onboarded = (await prisma.tenant.findUnique({
      where: { id: user.tenantId }, select: { onboarded: true },
    }))?.onboarded;

    return NextResponse.redirect(`${env.APP_URL}/${onboarded ? "" : "onboarding"}`);
  } catch (e) {
    console.error("[oauth callback]", e);
    return NextResponse.redirect(`${env.APP_URL}/login?error=oauth`);
  }
}
