import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { audit } from "@/lib/audit";

const Body = z.object({
  name: z.string().min(1).max(120),
  industry: z.string().max(80).optional(),
  description: z.string().max(500).optional(),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return new Response("Unauthorized", { status: 401 });
  const p = Body.safeParse(await req.json());
  if (!p.success) return new Response("Bad request", { status: 400 });
  await prisma.tenant.update({
    where: { id: s.tid },
    data: { name: p.data.name, industry: p.data.industry, description: p.data.description, onboarded: true },
  });
  await audit({ tenantId: s.tid, userId: s.sub, action: "UPDATE", entity: "Tenant", entityId: s.tid });
  return Response.json({ ok: true });
}
