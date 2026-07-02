import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { runAgent } from "@/lib/agent";
import { z } from "zod";

const Body = z.object({ message: z.string().min(1).max(4000), conversationId: z.string().optional() });

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return new Response("Bad request", { status: 400 });
  const { message } = parsed.data;
  let conversationId = parsed.data.conversationId;

  // Ensure a thread + load history (tenant-scoped).
  if (!conversationId) {
    const conv = await prisma.aiConversation.create({
      data: { tenantId: session.tid, userId: session.sub, title: message.slice(0, 40) },
    });
    conversationId = conv.id;
  }
  const prior = await prisma.aiMessage.findMany({
    where: { conversationId }, orderBy: { createdAt: "asc" }, take: 20,
  });
  const history = prior.map((m: any) => ({ role: m.role === "USER" ? "user" as const : "model" as const, text: m.content }));

  await prisma.aiMessage.create({ data: { conversationId, role: "USER", content: message } });

  const ctx = { tenantId: session.tid, userId: session.sub };
  const encoder = new TextEncoder();
  let full = "";

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`\u0000${conversationId}\u0000`)); // send convId first
      try {
        for await (const chunk of runAgent(history, message, ctx)) {
          full += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (e) {
        controller.enqueue(encoder.encode("\n[agent error]"));
        console.error(e);
      } finally {
        await prisma.aiMessage.create({ data: { conversationId: conversationId!, role: "ASSISTANT", content: full } });
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" } });
}
