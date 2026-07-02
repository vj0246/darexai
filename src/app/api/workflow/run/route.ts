import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";
import { runLeadWorkflow } from "@/lib/workflow";

const Body = z.object({ contactId: z.string().min(1) });

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!rateLimit(`wf:${session.sub}`, 10, 0.2)) return new Response("Rate limited", { status: 429 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return new Response("Bad request", { status: 400 });

  const ctx = { tenantId: session.tid, userId: session.sub };
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const step of runLeadWorkflow(ctx, parsed.data.contactId))
          controller.enqueue(enc.encode(JSON.stringify(step) + "\n"));
      } catch (e) { console.error(e); controller.enqueue(enc.encode(JSON.stringify({ step: "Error", status: "skipped" }) + "\n")); }
      finally { controller.close(); }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" } });
}
