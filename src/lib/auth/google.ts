import { createHash, randomBytes } from "crypto";
import { env } from "../env";

/**
 * Google OAuth 2.0 with PKCE (Authorization Code + S256).
 * Hand-rolled (no NextAuth) so every step is explainable:
 *  - PKCE protects the code exchange from interception.
 *  - `state` protects against CSRF on the callback.
 * verifier + state are stashed in short-lived httpOnly cookies, checked on return.
 */

const b64url = (b: Buffer) => b.toString("base64url");

export function pkcePair() {
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export const newState = () => b64url(randomBytes(16));

export function buildAuthUrl(challenge: string, state: string) {
  const p = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

export async function exchangeCode(code: string, verifier: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: env.GOOGLE_REDIRECT_URI,
    }),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status}`);
  return res.json() as Promise<{ access_token: string; id_token: string }>;
}

export async function fetchUserInfo(accessToken: string) {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`userinfo failed: ${res.status}`);
  return res.json() as Promise<{
    sub: string; email: string; name?: string; picture?: string;
  }>;
}
