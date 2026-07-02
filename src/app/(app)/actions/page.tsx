import WorkflowRunner from "@/components/WorkflowRunner";
import { Plus, AtSign, Mic, ArrowUp, Send, CalendarCheck, PhoneCall, Users, ListChecks, RotateCcw } from "lucide-react";

const templates = [
  { icon: Send, title: "Send WhatsApp campaign", sub: "Personalized to a segment" },
  { icon: CalendarCheck, title: "Book appointments", sub: "From recent intent signals" },
  { icon: PhoneCall, title: "Call warm prospects", sub: "Auto-dial top intent leads" },
  { icon: Users, title: "Assign leads to team", sub: "Round-robin by load" },
  { icon: ListChecks, title: "Create tasks", sub: "Across deals at risk" },
  { icon: RotateCcw, title: "Win-back ghosted", sub: "ROI 3-pager sequence" },
];

export default function ActionsPage() {
  return (
    <main className="px-8 py-7 max-w-[1000px]">
      <h1 className="text-[30px] font-medium tracking-tight mb-2">Actions</h1>
      <p className="text-sec text-[15px] mb-7">This is where your AI employee executes the work. No workflow builder. Just intent.</p>

      <div className="bg-card rounded-xl border border-line2 p-5 mb-3">
        <input placeholder="Follow up with every warm lead from this week on WhatsApp"
          className="w-full bg-transparent outline-none text-[14px] placeholder:text-mut py-1.5" />
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3 text-mut">
            <Plus className="w-4 h-4 hover:text-pri cursor-pointer" />
            <AtSign className="w-4 h-4 hover:text-pri cursor-pointer" />
            <Mic className="w-4 h-4 hover:text-pri cursor-pointer" />
          </div>
          <div className="flex items-center gap-3">
            <span className="kpi text-[11px] text-mut">AI Employee · gpt-class</span>
            <button className="w-7 h-7 grid place-items-center rounded-lg bg-teal/15 text-teal hover:bg-teal/25"><ArrowUp className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
      <p className="text-[12px] text-mut mb-8">Context: your leads, calls, WhatsApp, and revenue. Replies are recommendations, not promises.</p>

      <WorkflowRunner />

      <div className="text-[11px] tracking-[0.1em] text-mut font-medium mb-3">TEMPLATES</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map(({ icon: Icon, title, sub }) => (
          <button key={title} className="bg-card rounded-xl border border-line p-4 text-left hover:border-line2 transition">
            <div className="w-8 h-8 rounded-lg bg-teal/12 grid place-items-center text-teal mb-3"><Icon className="w-4 h-4" /></div>
            <div className="text-[14px] text-pri mb-1">{title}</div>
            <div className="text-[12px] text-mut">{sub}</div>
          </button>
        ))}
      </div>
    </main>
  );
}
