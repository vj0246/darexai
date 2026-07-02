import type { ChatCompletionTool, ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { groq, hasLLM, MODEL } from "./llm";
import { prisma } from "./db";
import { audit } from "./audit";

export type Ctx = { tenantId: string; userId: string };

// ── Tool declarations (OpenAI function-calling format — Groq is OpenAI-compatible) ──
const declarations: ChatCompletionTool[] = [
  { type: "function", function: { name: "searchContacts", description: "Find contacts by name/company.",
    parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
  { type: "function", function: { name: "createTask", description: "Create a follow-up task/reminder.",
    parameters: { type: "object", properties: {
      title: { type: "string" }, contactName: { type: "string" } }, required: ["title"] } } },
  { type: "function", function: { name: "updateOpportunity", description: "Update an opportunity stage or value.",
    parameters: { type: "object", properties: {
      title: { type: "string" },
      stage: { type: "string", enum: ["NEW","QUALIFIED","PROPOSAL","NEGOTIATION","WON","LOST"] } },
      required: ["title"] } } },
  { type: "function", function: { name: "sendWhatsApp", description: "Send a WhatsApp message to a contact (stubbed if no creds).",
    parameters: { type: "object", properties: {
      contactName: { type: "string" }, message: { type: "string" } }, required: ["contactName","message"] } } },
  { type: "function", function: { name: "fetchMetrics", description: "Get dashboard KPIs (leads, pipeline, tasks).",
    parameters: { type: "object", properties: {} } } },
];

// ── Executors (tenant-scoped) ──
export async function execute(name: string, args: any, ctx: Ctx): Promise<object> {
  const where = { tenantId: ctx.tenantId };
  switch (name) {
    case "searchContacts": {
      const rows = await prisma.contact.findMany({
        where: { ...where, OR: [
          { name: { contains: args.query, mode: "insensitive" } },
          { company: { contains: args.query, mode: "insensitive" } },
        ] }, take: 5,
      });
      return { contacts: rows.map((c) => ({ id: c.id, name: c.name, company: c.company, phone: c.phone })) };
    }
    case "createTask": {
      const contact = args.contactName
        ? await prisma.contact.findFirst({ where: { ...where, name: { contains: args.contactName, mode: "insensitive" } } })
        : null;
      const t = await prisma.task.create({ data: { ...where, title: args.title, contactId: contact?.id, createdByAi: true } });
      await audit({ ...ctx, action: "AI_TOOL_CALL", entity: "Task", entityId: t.id, metadata: { tool: "createTask" } });
      return { ok: true, taskId: t.id, title: t.title };
    }
    case "updateOpportunity": {
      const opp = await prisma.opportunity.findFirst({ where: { ...where, title: { contains: args.title, mode: "insensitive" } } });
      if (!opp) return { ok: false, error: "opportunity not found" };
      const upd = await prisma.opportunity.update({ where: { id: opp.id }, data: { stage: args.stage ?? opp.stage } });
      await audit({ ...ctx, action: "AI_TOOL_CALL", entity: "Opportunity", entityId: opp.id });
      return { ok: true, id: upd.id, stage: upd.stage };
    }
    case "sendWhatsApp": {
      const contact = await prisma.contact.findFirst({ where: { ...where, name: { contains: args.contactName, mode: "insensitive" } } });
      if (!contact) return { ok: false, error: "contact not found" };
      const conv = await prisma.conversation.upsert({
        where: { tenantId_contactId_channel: { tenantId: ctx.tenantId, contactId: contact.id, channel: "WHATSAPP" } },
        update: {}, create: { tenantId: ctx.tenantId, contactId: contact.id, channel: "WHATSAPP" },
      });
      await prisma.message.create({ data: { tenantId: ctx.tenantId, conversationId: conv.id, direction: "OUTBOUND", body: args.message } });
      await audit({ ...ctx, action: "WHATSAPP_SEND", entity: "Contact", entityId: contact.id });
      return { ok: true, delivered: true, to: contact.name, note: "stub send — set WHATSAPP_TOKEN to go live" };
    }
    case "fetchMetrics": {
      const [leads, pipeline, pending] = await Promise.all([
        prisma.contact.count({ where }),
        prisma.opportunity.aggregate({ where, _sum: { valueCents: true } }),
        prisma.task.count({ where: { ...where, status: "PENDING" } }),
      ]);
      return { leads, pipelineINR: (pipeline._sum.valueCents ?? 0) / 100, pendingTasks: pending };
    }
    default: return { error: "unknown tool" };
  }
}

const SYSTEM = `You are the DareXAI AI Employee for a business owner.
Be concise. Use read tools (searchContacts, fetchMetrics) freely to answer questions.
Only use write tools (createTask, updateOpportunity, sendWhatsApp) if the user explicitly asked for that action. Never take actions the user did not request.
If data is empty, just say so — do not invent follow-up actions.
After any recommendation or action, add one short line starting with "Why:" explaining your reasoning.`;

// ── Streaming loop (Groq): streams final text, runs tools mid-flight ──
export async function* runAgent(history: { role: "user" | "model"; text: string }[], userMessage: string, ctx: Ctx) {
  if (!hasLLM()) { yield "[Groq key missing — set GROQ_API_KEY in .env]"; return; }
  const client = groq();

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM },
    ...history.map((h) => ({ role: h.role === "model" ? "assistant" as const : "user" as const, content: h.text })),
    { role: "user", content: userMessage },
  ];

  for (let i = 0; i < 5; i++) {
    const stream = await client.chat.completions.create({
      model: MODEL, messages, tools: declarations, stream: true,
    });

    let text = "";
    const toolCalls: { id: string; name: string; args: string }[] = [];

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) { text += delta.content; yield delta.content; }
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index;
          if (!toolCalls[idx]) toolCalls[idx] = { id: tc.id ?? "", name: "", args: "" };
          if (tc.function?.name) toolCalls[idx].name += tc.function.name;
          if (tc.function?.arguments) toolCalls[idx].args += tc.function.arguments;
          if (tc.id) toolCalls[idx].id = tc.id;
        }
      }
    }

    if (toolCalls.length === 0) return;

    messages.push({
      role: "assistant", content: text || null,
      tool_calls: toolCalls.map((tc) => ({ id: tc.id, type: "function", function: { name: tc.name, arguments: tc.args } })),
    });

    for (const tc of toolCalls) {
      yield `\n〔${tc.name}…〕\n`;
      let args: any = {};
      try { args = JSON.parse(tc.args || "{}"); } catch { /* malformed args → empty */ }
      const out = await execute(tc.name, args, ctx);
      messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(out) });
    }
  }
}
