export const dynamic = "force-dynamic";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { inrShort } from "@/lib/metrics";

const stageColor: Record<string, string> = {
  NEW: "text-mut", QUALIFIED: "text-teal", PROPOSAL: "text-teal",
  NEGOTIATION: "text-green", WON: "text-green", LOST: "text-mut",
};

export default async function OpportunitiesPage() {
  const s = await getSession();
  const rows = s ? await prisma.opportunity.findMany({
    where: { tenantId: s.tid }, orderBy: { updatedAt: "desc" },
    include: { contact: { select: { name: true } } },
  }) : [];

  return (
    <main className="px-8 py-7 max-w-[900px]">
      <h1 className="text-[30px] font-medium tracking-tight mb-2">Opportunities</h1>
      <p className="text-sec text-[15px] mb-7">Your live pipeline. Scores update when the AI qualifies a lead.</p>
      <div className="bg-card rounded-xl border border-line overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 text-[11px] text-mut border-b border-line">
          <div>OPPORTUNITY</div><div>STAGE</div><div>SCORE</div><div className="text-right">VALUE</div>
        </div>
        {rows.length === 0 && <div className="px-5 py-8 text-mut text-[13px]">No opportunities yet. Run a workflow to create one.</div>}
        {rows.map((o: any) => (
          <div key={o.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 border-b border-line last:border-0 items-center">
            <div><div className="text-[14px] text-pri">{o.title}</div><div className="text-[12px] text-mut">{o.contact.name}</div></div>
            <div className={`text-[12px] ${stageColor[o.stage] ?? "text-sec"}`}>{o.stage}</div>
            <div className="kpi text-[13px] text-pri w-10">{o.score ?? "—"}</div>
            <div className="kpi text-[14px] text-pri text-right">{inrShort(o.valueCents / 100)}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
