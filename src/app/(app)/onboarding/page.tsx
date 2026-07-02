"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const r = useRouter();
  const [f, setF] = useState({ name: "", industry: "", description: "" });
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!f.name.trim()) return;
    setBusy(true);
    await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    r.push("/");
  }
  const field = "w-full bg-page border border-line rounded-lg px-3 py-2.5 text-[14px] text-pri outline-none focus:border-teal/40 mb-3";
  return (
    <main className="px-8 py-10 max-w-[520px] mx-auto">
      <h1 className="text-[26px] font-medium tracking-tight mb-2">Tell me about your business</h1>
      <p className="text-sec text-[14px] mb-7">I use this to ground every recommendation in your context.</p>
      <input className={field} placeholder="Business name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input className={field} placeholder="Industry (e.g. Real Estate)" value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })} />
      <textarea className={field + " h-24 resize-none"} placeholder="What do you sell, and to whom?" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      <button onClick={save} disabled={busy} className="w-full py-3 rounded-xl bg-teal/15 text-teal text-[14px] hover:bg-teal/25 disabled:opacity-40">
        {busy ? "Saving…" : "Start working"}
      </button>
    </main>
  );
}
