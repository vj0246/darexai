import { prisma } from "./db";
import type { AuditAction } from "@prisma/client";

type AuditInput = {
  tenantId: string;
  userId?: string | null;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
};

// Centralised audit write. Never throws into request path.
export async function audit(i: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: i.tenantId,
        userId: i.userId ?? null,
        action: i.action,
        entity: i.entity,
        entityId: i.entityId,
        metadata: i.metadata as object | undefined,
        ip: i.ip ?? undefined,
      },
    });
  } catch (e) {
    console.error("[audit] failed", e);
  }
}
