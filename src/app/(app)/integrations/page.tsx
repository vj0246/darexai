import { MessageCircle, Mail, Phone, Bot } from "lucide-react";

const integrations = [
  { icon: MessageCircle, name: "WhatsApp Business", desc: "Meta Cloud API — webhook + send", status: "Stub (needs WHATSAPP_TOKEN)" },
  { icon: Bot, name: "Groq (Llama 3.3 70B)", desc: "Powers the AI employee, streaming + tool-calling", status: "Connected" },
  { icon: Mail, name: "Email", desc: "Inbound/outbound thread sync", status: "Not connected" },
  { icon: Phone, name: "Call logs", desc: "Voice call history ingestion", status: "Not connected" },
];

export default function IntegrationsPage() {
  return (
    <main className="px-8 py-7 max-w-[800px]">
      <h1 className="text-[30px] font-medium tracking-tight mb-2">Integrations</h1>
      <p className="text-sec text-[15px] mb-7">Connect channels so your AI employee can act on your behalf.</p>
      <div className="flex flex-col gap-3">
        {integrations.map(({ icon: Icon, name, desc, status }) => (
          <div key={name} className="bg-card rounded-xl border border-line p-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-teal/12 grid place-items-center text-teal shrink-0"><Icon className="w-4 h-4" /></div>
            <div className="flex-1">
              <div className="text-[14px] text-pri">{name}</div>
              <div className="text-[12px] text-mut">{desc}</div>
            </div>
            <span className={`text-[11px] px-2 py-1 rounded-full ${status === "Connected" ? "text-green bg-green/10" : "text-mut bg-card2"}`}>{status}</span>
          </div>
        ))}
      </div>
    </main>
  );
}