import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: "demo-tenant" },
    update: {},
    create: { id: "demo-tenant", name: "Sanu's Business", industry: "Real Estate", onboarded: true },
  });

  const contacts = [
    { name: "Rahul Sharma", company: "Sharma Realty", phone: "+919820011111" },
    { name: "Priya Nair", company: "Nair Interiors", phone: "+919820022222" },
    { name: "Amit Verma", company: "Verma Constructions", phone: "+919820033333" },
    { name: "Sneha Iyer", company: "Iyer Homes", phone: "+919820044444" },
  ];
  for (const c of contacts) {
    await prisma.contact.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: c.phone } },
      update: {}, create: { tenantId: tenant.id, ...c, tags: ["warm"] },
    });
  }
  const rahul = await prisma.contact.findFirst({ where: { tenantId: tenant.id, name: { contains: "Rahul" } } });

  await prisma.opportunity.create({
    data: { tenantId: tenant.id, contactId: rahul!.id, title: "3BHK Bandra deal",
      stage: "QUALIFIED", valueCents: 3200000_00, score: 82, nextBestAction: "Send Q4 pricing brochure on WhatsApp" },
  });
  await prisma.task.create({
    data: { tenantId: tenant.id, contactId: rahul!.id, title: "Follow up with Rahul re: brochure", status: "PENDING" },
  });
  console.log("Seeded demo tenant + contacts + opportunity + task.");
}
main().finally(() => prisma.$disconnect());
