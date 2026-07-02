"use client";
import { useEffect, useState } from "react";
import { Play, Check, Loader2, MinusCircle } from "lucide-react";

type Step = { step: string; status: "running" | "done" | "skipped"; detail?: string };
type Contact = { id: string; name: string; company?: string };

export default function WorkflowRunner() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [sel, setSel] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => { fetch("/api/contacts").then((r) => r.json()).then((c) => { setContacts(c); setSel(c[0]?.id ?? ""); }); }, []);

  async function run() {
    if (!sel || running) return;
    setSteps([]); setRunning(true);
    const res = await fetch("/api/workflow/run", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactId: sel }),
    });
    const reader = res.body!.getReader(); const dec = new TextDecoder(); let buf = "";
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop() ?? "";
      for (const l of lines) if (l.trim()) {
        const s: Step = JSON.parse(l);
        setSteps((prev) => {
          const i = prev.findIndex((p) => p.step === s.step);
          if (i >= 0) { const c = [...prev]; c[i] = s; return c; }
          return [...prev, s];
        });
      }
    }
    setRunning(false);
  }

  return (
    <div className="bg-card rounded-xl border border-line2 p-5 mb-8">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[14px] text-pri font-medium">Qualify + follow up a lead</div>
        <span className="kpi text-[11px] text-mut">AI workflow</span>
      </div>
      <p className="text-[12px] text-mut mb-4">Score → decide → draft → send WhatsApp → create task → audit. One run.</p>
      <div className="flex items-center gap-2 mb-4">
        <select value={sel} onChange={(e) => setSel(e.target.value)}
          className="flex-1 bg-page border border-line rounded-lg px-3 py-2 text-[13px] text-pri outline-none">
          {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ""}</option>)}
        </select>
        <button onClick={run} disabled={running || !sel}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal/15 text-teal text-[13px] hover:bg-teal/25 disabled:opacity-40">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run workflow
        </button>
      </div>
      {steps.length > 0 && (
        <div className="flex flex-col gap-2.5 border-t border-line pt-4">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-3 text-[13px]">
              <span className="mt-0.5">
                {s.status === "running" && <Loader2 className="w-4 h-4 text-teal animate-spin" />}
                {s.status === "done" && <Check className="w-4 h-4 text-green" />}
                {s.status === "skipped" && <MinusCircle className="w-4 h-4 text-mut" />}
              </span>
              <div>
                <div className="text-pri">{s.step}</div>
                {s.detail && <div className="text-mut text-[12px] mt-0.5">{s.detail}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
