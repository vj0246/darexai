import { describe, it, expect, vi, beforeEach } from "vitest";

// In-memory fake of the refreshToken table.
const rows: any[] = [];
vi.mock("../db", () => ({
  prisma: {
    refreshToken: {
      create: vi.fn(async ({ data }: any) => {
        const row = { id: `t${rows.length + 1}`, revoked: false, replacedById: null, ...data };
        rows.push(row);
        return row;
      }),
      findUnique: vi.fn(async ({ where }: any) =>
        rows.find((r) => r.tokenHash === where.tokenHash || r.id === where.id) ?? null),
      update: vi.fn(async ({ where, data }: any) => {
        const r = rows.find((x) => x.id === where.id);
        Object.assign(r, data);
        return r;
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        rows.filter((r) => r.familyId === where.familyId && r.revoked === false)
          .forEach((r) => Object.assign(r, data));
        return { count: 0 };
      }),
    },
    user: { findUnique: vi.fn(async () => ({ tenantId: "ten1" })) },
  },
}));
vi.mock("../env", () => ({ env: { REFRESH_TTL: 1209600 } }));
vi.mock("../audit", () => ({ audit: vi.fn(async () => {}) }));

import { issueRefresh, rotateRefresh } from "./tokens";
import { audit } from "../audit";

beforeEach(() => { rows.length = 0; vi.clearAllMocks(); });

describe("refresh rotation + reuse detection", () => {
  it("rotates a valid token and issues a successor in the same family", async () => {
    const { raw, familyId } = await issueRefresh("u1");
    const r = await rotateRefresh(raw);
    expect(r.ok).toBe(true);
    // old revoked, new exists, same family
    expect(rows[0].revoked).toBe(true);
    expect(rows[1].familyId).toBe(familyId);
  });

  it("detects reuse of a spent token and revokes the whole family", async () => {
    const { raw } = await issueRefresh("u1");
    await rotateRefresh(raw);          // spend it (now revoked)
    const replay = await rotateRefresh(raw); // replay spent token
    expect(replay.ok).toBe(false);
    if (!replay.ok) expect(replay.reason).toBe("reuse");
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "TOKEN_REUSE_DETECTED" }),
    );
    // every token in family now revoked
    expect(rows.every((r) => r.revoked)).toBe(true);
  });

  it("rejects an unknown token", async () => {
    const r = await rotateRefresh("garbage");
    expect(r.ok).toBe(false);
  });
});
