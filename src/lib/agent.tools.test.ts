import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("openai", () => ({ default: class {} }));
vi.mock("./env", () => ({ env: { GROQ_API_KEY: "" } }));
vi.mock("./audit", () => ({ audit: vi.fn(async () => {}) }));

const store: any = { tasks: [] };
vi.mock("./db", () => ({
  prisma: {
    contact: { findFirst: vi.fn(async () => ({ id: "c1", name: "Rahul", tenantId: "t1", phone: "+91" })) },
    task: { create: vi.fn(async ({ data }: any) => { store.tasks.push(data); return { id: "task1", ...data }; }) },
    opportunity: { aggregate: vi.fn(async () => ({ _sum: { valueCents: 320000000 } })) },
    contact_count: null,
  },
}));
// contact.count + task.count for fetchMetrics
import { prisma } from "./db";
(prisma as any).contact.count = vi.fn(async () => 4);
(prisma as any).task.count = vi.fn(async () => 1);

import { execute } from "./agent";
const ctx = { tenantId: "t1", userId: "u1" };
beforeEach(() => { store.tasks = []; });

describe("AI tool calling", () => {
  it("createTask writes a tenant-scoped task and returns ok", async () => {
    const out: any = await execute("createTask", { title: "Call Rahul", contactName: "Rahul" }, ctx);
    expect(out.ok).toBe(true);
    expect(store.tasks[0].tenantId).toBe("t1");   // scoped
    expect(store.tasks[0].createdByAi).toBe(true);
  });

  it("fetchMetrics returns pipeline in rupees", async () => {
    const out: any = await execute("fetchMetrics", {}, ctx);
    expect(out.leads).toBe(4);
    expect(out.pipelineINR).toBe(3200000);
  });

  it("rejects an unknown tool", async () => {
    const out: any = await execute("nope", {}, ctx);
    expect(out.error).toBeTruthy();
  });
});
