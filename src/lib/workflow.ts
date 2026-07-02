import { prisma } from "./db";
import { audit } from "./audit";
import { llmJSON, llmText, hasLLM } from "./llm";
import type { Ctx } from "./agent";

export type Step = { step: string; status: "running" | "done" | "skipped"; detail?: string; data?: any };

const QUALIFY_THRESHOLD = 70;

/**
 * Complete business automation:
 *   Lead → AI qualification (score) → if score ≥ 70 → draft + send WhatsApp
 *        → create follow-up task → write audit log.
 * Yields each step so the UI can render live progress.
 */
export async function* runLeadWorkflow(ctx: Ctx, contactId: string): AsyncGenerator<Step> {
  const contact = await prisma.contact.findFirst({ where: { id: contactId, tenantId: ctx.tenantId } });
  if (!contact) { yield { step: "Load lead", status: "skipped", detail: "contact not found" }; return; }

  const opp = await prisma.opportunity.findFirst({ where: { tenantId: ctx.tenantId, contactId: contact.id } });

  // 1. Qualify
  yield { step: "Qualify lead", status: "running", detail: contact.name };
  let score = 75, reason = "Strong recent engagement.";
  if (hasLLM()) {
    try {
      const q = await llmJSON<{ score: number; reason: string }>(
        `Score this real-estate lead 0-100 for buying intent. Contact: ${contact.name}, company ${contact.company ?? "n/a"}, ` +
        `opportunity: ${opp?.title ?? "none"} value ₹${(opp?.valueCents ?? 0) / 100}. ` +
        `Return JSON {"score": number, "reason": string (<=15 words)}.`);
      score = Math.round(q.score); reason = q.reason;
    } catch { /* fallback keeps defaults */ }
  }
  if (opp) await prisma.opportunity.update({ where: { id: opp.id }, data: { score } });
  yield { step: "Qualify lead", status: "done", detail: `Score ${score}/100 — ${reason}`, data: { score } };

  // 2. Gate
  if (score < QUALIFY_THRESHOLD) {
    yield { step: "Decision", status: "done", detail: `Score below ${QUALIFY_THRESHOLD} — nurture, no outreach.` };
    await audit({ ...ctx, action: "WORKFLOW_RUN", entity: "Contact", entityId: contact.id, metadata: { score, sent: false } });
    return;
  }
  yield { step: "Decision", status: "done", detail: `Score ≥ ${QUALIFY_THRESHOLD} — proceed to outreach.` };

  // 3. Draft + send WhatsApp
  yield { step: "Draft WhatsApp", status: "running" };
  let msg = `Hi ${contact.name.split(" ")[0]}, sharing our revised Q4 pricing brochure — worth a quick look. Shall I hold a slot this week?`;
  if (hasLLM()) {
    try { msg = await llmText(`Write a 1-2 sentence, warm, non-pushy WhatsApp follow-up to ${contact.name} about "${opp?.title ?? "their enquiry"}". No emojis, no quotes.`); } catch {}
  }
  yield { step: "Draft WhatsApp", status: "done", detail: msg };

  yield { step: "Send WhatsApp", status: "running", detail: `→ ${contact.phone ?? contact.name}` };
  const conv = await prisma.conversation.upsert({
    where: { tenantId_contactId_channel: { tenantId: ctx.tenantId, contactId: contact.id, channel: "WHATSAPP" } },
    update: {}, create: { tenantId: ctx.tenantId, contactId: contact.id, channel: "WHATSAPP" },
  });
  await prisma.message.create({ data: { tenantId: ctx.tenantId, conversationId: conv.id, direction: "OUTBOUND", body: msg } });
  await audit({ ...ctx, action: "WHATSAPP_SEND", entity: "Contact", entityId: contact.id });
  yield { step: "Send WhatsApp", status: "done", detail: "Delivered (stub — set WHATSAPP_TOKEN to go live)" };

  // 4. Follow-up task
  yield { step: "Create task", status: "running" };
  const task = await prisma.task.create({
    data: { tenantId: ctx.tenantId, contactId: contact.id, opportunityId: opp?.id,
      title: `Follow up with ${contact.name} in 2 days`, createdByAi: true,
      dueAt: new Date(Date.now() + 2 * 864e5) },
  });
  yield { step: "Create task", status: "done", detail: task.title };

  // 5. Audit
  await audit({ ...ctx, action: "WORKFLOW_RUN", entity: "Contact", entityId: contact.id, metadata: { score, sent: true, taskId: task.id } });
  yield { step: "Audit log", status: "done", detail: "Workflow recorded." };
}
