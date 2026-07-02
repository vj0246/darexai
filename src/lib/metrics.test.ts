import { describe, it, expect, vi, beforeEach } from "vitest";

const calls: any[] = [];
vi.mock("./db", () => ({
  prisma: {
    contact: { count: vi.fn(async (a: any) => { calls.push(["contact.count", a]); return 4; }) },
    opportunity: {
      count: vi.fn(async (a: any) => { calls.push(["opportunity.count", a]); return 2; }),
      aggregate: vi.fn(async (a: any) => { calls.push(["opportunity.aggregate", a]); return { _sum: { valueCents: 320000000 } }; }),
    },
    task: { count: vi.fn(async (a: any) => { calls.push(["task.count", a]); return 1; }) },
  },
}));

import { getMetrics, inrShort } from "./metrics";

beforeEach(() => { calls.length = 0; });

describe("tenant isolation", () => {
  it("every query is scoped to the caller's tenantId", async () => {
    await getMetrics("tenant-A");
    expect(calls.length).toBeGreaterThanOrEqual(5);
    for (const [, arg] of calls) {
      expect(arg.where.tenantId).toBe("tenant-A"); // no query may omit or cross tenant
    }
  });

  it("does not leak another tenant into the where clause", async () => {
    await getMetrics("tenant-B");
    const leaked = calls.some(([, a]) => a.where.tenantId !== "tenant-B");
    expect(leaked).toBe(false);
  });
});

describe("inrShort", () => {
  it("formats lakhs and crores", () => {
    expect(inrShort(3200000)).toBe("₹32L");
    expect(inrShort(15000000)).toBe("₹1.5Cr");
  });
});
