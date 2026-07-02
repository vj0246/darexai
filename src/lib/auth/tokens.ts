import { randomUUID } from "crypto";
import { prisma } from "../db";
import { env } from "../env";
import { audit } from "../audit";
import { newOpaqueToken, hashToken } from "./crypto";

/**
 * Refresh token rotation with theft (reuse) detection.
 *
 * Model: every refresh belongs to a `familyId` (one login session).
 * On each refresh the old token is revoked and replaced by a new one in the
 * SAME family. If a *already-revoked/replaced* token is presented again, that
 * means the token leaked and an attacker (or the victim) is replaying it →
 * we revoke the ENTIRE family, forcing re-login. Industry-standard (OWASP).
 */

const ttlMs = () => env.REFRESH_TTL * 1000;

export async function issueRefresh(userId: string, familyId?: string) {
  const raw = newOpaqueToken();
  const fam = familyId ?? randomUUID();
  const row = await prisma.refreshToken.create({
    data: {
      userId,
      familyId: fam,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + ttlMs()),
    },
  });
  return { raw, familyId: fam, id: row.id };
}

type RotateResult =
  | { ok: true; raw: string; userId: string }
  | { ok: false; reason: "invalid" | "expired" | "reuse" };

export async function rotateRefresh(rawToken: string): Promise<RotateResult> {
  const tokenHash = hashToken(rawToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!existing) return { ok: false, reason: "invalid" };

  // Replay of a spent/revoked token → revoke whole family.
  if (existing.revoked || existing.replacedById) {
    await prisma.refreshToken.updateMany({
      where: { familyId: existing.familyId, revoked: false },
      data: { revoked: true },
    });
    await audit({
      tenantId: (await userTenant(existing.userId)) ?? "unknown",
      userId: existing.userId,
      action: "TOKEN_REUSE_DETECTED",
      metadata: { familyId: existing.familyId },
    });
    return { ok: false, reason: "reuse" };
  }

  if (existing.expiresAt < new Date()) {
    await prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revoked: true },
    });
    return { ok: false, reason: "expired" };
  }

  // Happy path: issue successor in same family, mark old replaced+revoked.
  const next = await issueRefresh(existing.userId, existing.familyId);
  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revoked: true, replacedById: next.id },
  });
  return { ok: true, raw: next.raw, userId: existing.userId };
}

export async function revokeFamily(rawToken: string) {
  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });
  if (!existing) return;
  await prisma.refreshToken.updateMany({
    where: { familyId: existing.familyId, revoked: false },
    data: { revoked: true },
  });
}

async function userTenant(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId }, select: { tenantId: true },
  });
  return u?.tenantId ?? null;
}
