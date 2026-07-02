"use client";
import { useState, useRef } from "react";
import { Plus, AtSign, Mic, ArrowUp } from "lucide-react";

type Msg = { role: "user" | "ai"; text: string };

export default function ChatBox() {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const convId = useRef<string | undefined>(undefined);

  async function send() {
    const message = input.trim();
    if (!message || busy) return;
    setInput(""); setBusy(true);
    setMsgs((m) => [...m, { role: "user", text: message }, { role: "ai", text: "" }]);

    const res = await fetch("/api/agent/stream", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, conversationId: convId.current }),
    });
    if (!res.body) { setBusy(false); return; }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let first = true;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      let chunk = dec.decode(value, { stream: true });
      if (first) {
        const m = chunk.match(/^\u0000(.*?)\u0000/);
        if (m) { convId.current = m[1]; chunk = chunk.slice(m[0].length); }
        first = false;
      }
      setMsgs((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "ai", text: copy[copy.length - 1].text + chunk };
        return copy;
      });
    }
    setBusy(false);
  }

  return (
    <div>
      {msgs.length > 0 && (
        <div className="flex flex-col gap-4 mb-4">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-pri text-[14px]" : "text-sec text-[14px] whitespace-pre-wrap leading-relaxed"}>
              {m.role === "user" ? <span className="text-teal">You · </span> : <span className="text-teal">AI · </span>}
              {m.text}{m.role === "ai" && busy && i === msgs.length - 1 && <span className="animate-pulse">▍</span>}
            </div>
          ))}
        </div>
      )}
      <div className="bg-card rounded-xl border border-line2 p-3">
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask your AI employee anything"
          className="w-full bg-transparent outline-none text-[14px] placeholder:text-mut px-1 py-1.5" />
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-3 text-mut">
            <Plus className="w-4 h-4" /><AtSign className="w-4 h-4" /><Mic className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-3">
            <span className="kpi text-[11px] text-mut">AI Employee · gemini-flash</span>
            <button onClick={send} disabled={busy}
              className="w-7 h-7 grid place-items-center rounded-lg bg-teal/15 text-teal hover:bg-teal/25 disabled:opacity-40">
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
