import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s) return new Response("Unauthorized", { status: 401 });
  const rows = await prisma.opportunity.findMany({
    where: { tenantId: s.tid }, orderBy: { updatedAt: "desc" },
    include: { contact: { select: { name: true } } },
  });
  return Response.json(rows);
}
