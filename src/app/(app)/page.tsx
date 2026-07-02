export const dynamic = "force-dynamic";

import { ArrowUpRight, ArrowRight } from "lucide-react";
import ChatBox from "@/components/ChatBox";
import { Kpi } from "@/components/Kpi";
import { getSession } from "@/lib/session";
import { getMetrics } from "@/lib/metrics";
import { prisma } from "@/lib/db";

const focus = [
  "Which leads need my attention?",
  "Summarize yesterday's calls",
  "Find revenue opportunities",
  "Follow up with all warm leads",
];

export default async function HomePage() {
  const session = await getSession();
  const m = session ? await getMetrics(session.tid) : { leads: 0, highIntent: 0, pending: 0, pipelineLabel: "₹0" };
  const user = session ? await prisma.user.findUnique({ where: { id: session.sub }, select: { name: true } }) : null;
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const tiles: [string, string | number, boolean][] = [
    ["LEADS", m.leads, false], ["HIGH INTENT", m.highIntent, false],
    ["OPEN TASKS", m.pending, false], ["PIPELINE", m.pipelineLabel, true],
  ];

  return (
    <main className="flex min-w-0">
      <section className="flex-1 min-w-0 px-8 py-7 max-w-[760px]">
        <div className="flex items-center gap-2 text-[11px] text-mut mb-5">
          <span className="text-teal">AI EMPLOYEE</span><span>•</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green" />ONLINE</span>
        </div>
        <h1 className="text-[30px] leading-tight font-medium tracking-tight mb-3">Good morning, {firstName}</h1>
        <p className="text-sec text-[15px] leading-relaxed mb-7 max-w-[560px]">
          I reviewed the overnight conversations and your pipeline. Here is what I think matters today.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {tiles.map(([l, v, a]) => <Kpi key={l} label={l} value={String(v)} accent={a} />)}
        </div>

        <div className="bg-card rounded-xl border border-line p-5 mb-6">
          <div className="flex items-center gap-2 text-[11px] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-green" />
            <span className="text-teal font-medium tracking-wide">BRIEFING</span>
            <span className="text-mut">just now</span>
          </div>
          <p className="text-[14px] leading-relaxed text-pri mb-3">
            You have <span className="text-teal">{m.leads} contacts</span> and <span className="text-teal">{m.highIntent}</span> high-intent opportunities in play, worth <span className="text-teal">{m.pipelineLabel}</span> in pipeline.
          </p>
          <p className="text-[14px] leading-relaxed text-sec">
            Ask me to qualify a lead or run a follow-up, or open Actions to run the full workflow. I explain the reasoning behind every recommendation.
          </p>
        </div>

        <ChatBox />
      </section>

      <aside className="w-[316px] shrink-0 border-l border-line px-6 py-7 hidden lg:block">
        <div className="grid grid-cols-2 gap-3 mb-7">
          {tiles.map(([l, v, a]) => (
            <div key={l} className="bg-card rounded-xl border border-line p-3.5">
              <div className="text-[10px] text-mut mb-1.5">{l}</div>
              <div className={`kpi text-[20px] font-medium ${a ? "text-teal" : ""}`}>{String(v)}</div>
            </div>
          ))}
        </div>
        <div className="text-[11px] tracking-[0.1em] text-mut font-medium mb-3">SUGGESTED FOCUS</div>
        <div className="flex flex-col gap-1 mb-7 -mx-2">
          {focus.map((f) => (
            <button key={f} className="flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-card2 group text-left">
              <span className="text-[13px] text-pri">{f}</span>
              <ArrowUpRight className="w-4 h-4 text-mut group-hover:text-teal" />
            </button>
          ))}
        </div>
        <div className="text-[11px] tracking-[0.1em] text-mut font-medium mb-3">KEY INSIGHTS</div>
        <div className="bg-card rounded-xl border border-line p-4">
          <p className="text-[13px] leading-relaxed text-pri mb-3">Meta Ads are converting <span className="text-teal">32x better</span> than Google search this week.</p>
          <div className="flex items-center justify-between">
            <span className="kpi text-[11px] text-mut">Confidence · 94%</span>
            <button className="text-[12px] text-teal flex items-center gap-1">Take action <ArrowRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </aside>
    </main>
  );
}
