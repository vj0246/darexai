import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revokeFamily } from "@/lib/auth/tokens";
import { clearAuthCookies, REFRESH_COOKIE } from "@/lib/auth/cookies";

export const dynamic = "force-dynamic";

export async function POST() {
  const raw = cookies().get(REFRESH_COOKIE)?.value;
  if (raw) await revokeFamily(raw);
  clearAuthCookies();
  return NextResponse.json({ ok: true });
}
