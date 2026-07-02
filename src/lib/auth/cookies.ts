import { cookies } from "next/headers";
import { env } from "../env";

export const ACCESS_COOKIE = "dx_access";
export const REFRESH_COOKIE = "dx_refresh";

const secure = env.APP_URL.startsWith("https");

// Refresh cookie path-scoped to the refresh endpoint only → smaller exposure.
const REFRESH_PATH = "/api/auth/refresh";

export function setAuthCookies(access: string, refresh: string) {
  const jar = cookies();
  jar.set(ACCESS_COOKIE, access, {
    httpOnly: true, secure, sameSite: "lax", path: "/",
    maxAge: env.ACCESS_TTL,
  });
  jar.set(REFRESH_COOKIE, refresh, {
    httpOnly: true, secure, sameSite: "lax", path: REFRESH_PATH,
    maxAge: env.REFRESH_TTL,
  });
}

export function clearAuthCookies() {
  const jar = cookies();
  jar.set(ACCESS_COOKIE, "", { httpOnly: true, secure, path: "/", maxAge: 0 });
  jar.set(REFRESH_COOKIE, "", { httpOnly: true, secure, path: REFRESH_PATH, maxAge: 0 });
}
