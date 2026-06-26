import { prisma } from "@/lib/db/prisma";

export type AuditEntry = {
  organizationId: string;
  actorId?:   string | null;
  actorName?: string | null;
  action:     string;       // e.g. "delivery.status_changed"
  entityType: string;       // "delivery" | "driver" | "organization"
  entityId?:  string | null;
  details?:   Record<string, unknown>;
};

/**
 * Best-effort audit write. Never throws and never blocks the caller's result —
 * accountability logging must not break the action it records. Awaited so the
 * insert completes before a serverless function freezes.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: entry.organizationId,
        actorId:        entry.actorId ?? null,
        actorName:      entry.actorName ?? null,
        action:         entry.action,
        entityType:     entry.entityType,
        entityId:       entry.entityId ?? null,
        ...(entry.details ? { details: entry.details as object } : {}),
      },
    });
  } catch (e) {
    console.error("[audit] write failed:", e);
  }
}
