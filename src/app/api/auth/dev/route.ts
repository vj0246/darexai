import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { signAccess } from "@/lib/auth/jwt";
import { issueRefresh } from "@/lib/auth/tokens";
import { setAuthCookies } from "@/lib/auth/cookies";

// Passwordless demo login. Gated by DEV_LOGIN=true env var only.
export const dynamic = "force-dynamic";

export async function GET() {
  if (env.DEV_LOGIN !== "true")
    return NextResponse.json({ error: "disabled" }, { status: 404 });

  let user = await prisma.user.findUnique({ where: { googleSub: "dev-demo" } });
  if (!user) {
    const tenant = await prisma.tenant.create({
      data: { name: "Sanu's Business", industry: "Real Estate", onboarded: true },
    });
    user = await prisma.user.create({
      data: { tenantId: tenant.id, email: "sanu@demo.dev", name: "Sanu", googleSub: "dev-demo", role: "OWNER" },
    });
  }
  const access = await signAccess({ sub: user.id, tid: user.tenantId, role: user.role });
  const { raw } = await issueRefresh(user.id);
  setAuthCookies(access, raw);
  return NextResponse.redirect(`${env.APP_URL}/`);
}
