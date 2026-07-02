import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s) return new Response("Unauthorized", { status: 401 });
  const rows = await prisma.contact.findMany({
    where: { tenantId: s.tid }, orderBy: { createdAt: "desc" },
    select: { id: true, name: true, company: true, phone: true },
  });
  return Response.json(rows);
}
