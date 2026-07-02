export const dynamic = "force-dynamic";
import { getSession } from "@/lib/session";
import { getMetrics } from "@/lib/metrics";
import { prisma } from "@/lib/db";

export default async function InsightsPage() {
  const s = await getSession();
  const m = s ? await getMetrics(s.tid) : { leads: 0, highIntent: 0, pending: 0, pipelineLabel: "₹0" };
  const stages = s ? await prisma.opportunity.groupBy({ by: ["stage"], where: { tenantId: s.tid }, _count: true }) : [];
  const recentAudits = s ? await prisma.auditLog.findMany({ where: { tenantId: s.tid }, orderBy: { createdAt: "desc" }, take: 8 }) : [];

  return (
    <main className="px-8 py-7 max-w-[900px]">
      <h1 className="text-[30px] font-medium tracking-tight mb-2">Insights</h1>
      <p className="text-sec text-[15px] mb-7">What the AI has observed across your business.</p>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {[["LEADS", m.leads], ["HIGH INTENT", m.highIntent], ["OPEN TASKS", m.pending], ["PIPELINE", m.pipelineLabel]].map(([l, v]) => (
          <div key={l as string} className="bg-card rounded-xl border border-line p-4">
            <div className="text-[11px] text-mut mb-2">{l}</div>
            <div className="kpi text-[22px] font-medium">{v}</div>
          </div>
        ))}
      </div>

      <div className="text-[11px] tracking-[0.1em] text-mut font-medium mb-3">PIPELINE BY STAGE</div>
      <div className="bg-card rounded-xl border border-line p-5 mb-8">
        {stages.length === 0 && <p className="text-mut text-[13px]">No opportunities yet.</p>}
        <div className="flex flex-col gap-3">
          {stages.map((g) => (
            <div key={g.stage} className="flex items-center justify-between">
              <span className="text-[13px] text-pri">{g.stage}</span>
              <span className="kpi text-[13px] text-teal">{g._count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[11px] tracking-[0.1em] text-mut font-medium mb-3">RECENT ACTIVITY</div>
      <div className="bg-card rounded-xl border border-line divide-y divide-line">
        {recentAudits.length === 0 && <p className="text-mut text-[13px] p-5">No activity yet. Run a workflow or chat with the agent.</p>}
        {recentAudits.map((a) => (
          <div key={a.id} className="px-5 py-3 flex items-center justify-between">
            <span className="text-[13px] text-pri">{a.action.replaceAll("_", " ")}</span>
            <span className="kpi text-[11px] text-mut">{new Date(a.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </main>
  );
}