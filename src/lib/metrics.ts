import { prisma } from "./db";

export async function getMetrics(tenantId: string) {
  const where = { tenantId };
  const [leads, highIntent, pending, doneTasks, pipeline] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.opportunity.count({ where: { ...where, stage: { in: ["QUALIFIED", "PROPOSAL", "NEGOTIATION"] } } }),
    prisma.task.count({ where: { ...where, status: "PENDING" } }),
    prisma.task.count({ where: { ...where, status: "DONE" } }),
    prisma.opportunity.aggregate({ where, _sum: { valueCents: true } }),
  ]);
  const pipelineCents = pipeline._sum.valueCents ?? 0;
  return { leads, highIntent, pending, doneTasks, pipelineCents, pipelineLabel: inrShort(pipelineCents / 100) };
}

export function inrShort(rupees: number): string {
  if (rupees >= 1e7) return `₹${(rupees / 1e7).toFixed(1)}Cr`;
  if (rupees >= 1e5) return `₹${Math.round(rupees / 1e5)}L`;
  if (rupees >= 1e3) return `₹${Math.round(rupees / 1e3)}K`;
  return `₹${Math.round(rupees)}`;
}
