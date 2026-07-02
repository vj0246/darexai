export const dynamic = "force-dynamic";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function ConversationsPage() {
  const s = await getSession();
  const convs = s ? await prisma.conversation.findMany({
    where: { tenantId: s.tid }, orderBy: { updatedAt: "desc" },
    include: { contact: { select: { name: true } }, messages: { orderBy: { createdAt: "asc" } } },
  }) : [];

  return (
    <main className="px-8 py-7 max-w-[760px]">
      <h1 className="text-[30px] font-medium tracking-tight mb-2">Conversations</h1>
      <p className="text-sec text-[15px] mb-7">Unified timeline. Messages the AI sends appear here instantly.</p>
      {convs.length === 0 && <div className="text-mut text-[13px]">No conversations yet. Run a workflow or ask the agent to message a contact.</div>}
      <div className="flex flex-col gap-5">
        {convs.map((c: any) => (
          <div key={c.id} className="bg-card rounded-xl border border-line p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[14px] text-pri">{c.contact.name}</div>
              <span className="kpi text-[11px] text-mut">{c.channel}</span>
            </div>
            <div className="flex flex-col gap-2">
              {c.messages.map((m: any) => (
                <div key={m.id} className={m.direction === "OUTBOUND" ? "self-end max-w-[80%] bg-teal/12 text-pri rounded-xl px-3 py-2 text-[13px]" : "self-start max-w-[80%] bg-card2 text-sec rounded-xl px-3 py-2 text-[13px]"}>
                  {m.body}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
