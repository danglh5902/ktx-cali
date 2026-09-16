import { auditLogs } from "../db/schema/index.js";
import type { Tx } from "../db/request-context.js";

/**
 * Action prefixes that require a `reason` — see docs/11-architecture.md §6.2
 * and docs/01-business-analysis.md §7.3. Keep in sync with those docs.
 */
const REASON_REQUIRED_PREFIXES = [
  "invoice.adjust",
  "invoice.void",
  "invoice.discount",
  "payment.reverse",
  "deposit.",
  "debt.write_off",
  "pricing.",
  "role.",
  "permission.",
  "delete.",
  "cash_session.close_with_variance",
];

export interface AuditEntry {
  orgId: string;
  branchId?: string | null;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  diff?: Array<{ path: string; from: unknown; to: unknown }>;
  reason?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}

/**
 * Append-only audit write. Always call from the SAME transaction as the
 * business write it documents (pass the `tx` from `withRequestContext`), so
 * a failed write can never leave a business change unaudited or vice versa.
 *
 * Written at the service layer, not the repository — see docs/11 §6.1 — so
 * `reason` and business context (actorName/actorRole snapshot) are available.
 */
export async function writeAudit(tx: Tx, entry: AuditEntry): Promise<void> {
  const requiresReason = REASON_REQUIRED_PREFIXES.some((prefix) => entry.action.startsWith(prefix));
  if (requiresReason && !entry.reason) {
    throw new Error(`audit action "${entry.action}" requires a reason`);
  }

  await tx.insert(auditLogs).values({
    orgId: entry.orgId,
    branchId: entry.branchId ?? null,
    actorId: entry.actorId,
    actorName: entry.actorName,
    actorRole: entry.actorRole,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ?? null,
    before: entry.before ?? null,
    after: entry.after ?? null,
    diff: entry.diff ?? null,
    reason: entry.reason ?? null,
    ip: entry.ip ?? null,
    userAgent: entry.userAgent ?? null,
    requestId: entry.requestId ?? null,
  });
}
