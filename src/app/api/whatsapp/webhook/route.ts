import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

// Meta verification handshake.
export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  if (u.searchParams.get("hub.verify_token") === (env.WHATSAPP_VERIFY_TOKEN ?? "dev-verify"))
    return new Response(u.searchParams.get("hub.challenge") ?? "", { status: 200 });
  return new Response("forbidden", { status: 403 });
}

// Inbound messages. externalId @unique → idempotent (re-delivery safe).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  try {
    const entries = body?.entry ?? [];
    for (const e of entries) for (const ch of e.changes ?? []) {
      for (const m of ch.value?.messages ?? []) {
        const phone = m.from;
        const contact = await prisma.contact.findFirst({ where: { phone: `+${phone}` } });
        if (!contact) continue;
        const conv = await prisma.conversation.upsert({
          where: { tenantId_contactId_channel: { tenantId: contact.tenantId, contactId: contact.id, channel: "WHATSAPP" } },
          update: {}, create: { tenantId: contact.tenantId, contactId: contact.id, channel: "WHATSAPP" },
        });
        await prisma.message.upsert({
          where: { externalId: m.id },
          update: {},
          create: { tenantId: contact.tenantId, conversationId: conv.id, direction: "INBOUND", body: m.text?.body ?? "", externalId: m.id },
        });
      }
    }
  } catch (e) { console.error("[wa webhook]", e); }
  return new Response("ok", { status: 200 }); // always 200 so Meta doesn't retry-storm
}
