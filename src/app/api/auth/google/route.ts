import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pkcePair, newState, buildAuthUrl } from "@/lib/auth/google";
import { env } from "@/lib/env";

export async function GET() {
  const { verifier, challenge } = pkcePair();
  const state = newState();

  const secure = env.APP_URL.startsWith("https");
  const jar = cookies();
  // Short-lived (10m) httpOnly holders for the round-trip.
  const opts = { httpOnly: true, secure, sameSite: "lax" as const, path: "/", maxAge: 600 };
  jar.set("dx_pkce", verifier, opts);
  jar.set("dx_state", state, opts);

  return NextResponse.redirect(buildAuthUrl(challenge, state));
}
