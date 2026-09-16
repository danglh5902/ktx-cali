import { sql } from "drizzle-orm";
import type { Tx } from "./request-context.js";

/**
 * Sinh số thứ tự an toàn khi đồng thời — docs/12-database-schema.md
 * `counters`: "INSERT ... ON CONFLICT DO UPDATE SET seq = counters.seq + 1
 * RETURNING seq" (tương đương findOneAndUpdate + $inc của MongoDB).
 * `counters` không có RLS (UNSCOPED_TABLES, xem core/db/rls/policies.ts) —
 * dùng được với cả role app (`ktx_app`) lẫn role owner.
 */
async function nextSequence(tx: Tx, key: string): Promise<bigint> {
  const rows = (await tx.execute(sql`
    INSERT INTO counters (key, seq) VALUES (${key}, 1)
    ON CONFLICT (key) DO UPDATE SET seq = counters.seq + 1
    RETURNING seq
  `)) as unknown as Array<{ seq: bigint }>;
  const row = rows[0];
  if (!row) throw new Error(`failed to generate sequence for key "${key}"`);
  return row.seq;
}

/**
 * Mã chứng từ có tiền tố chi nhánh — vd "HD-TD-2026-0142", "TK-TD-2026-0891".
 * Khớp định dạng nêu trong docs/09, docs/10.
 */
export async function generateDocNo(
  tx: Tx,
  opts: { docType: string; branchCode: string; year?: number; pad?: number },
): Promise<string> {
  const year = opts.year ?? new Date().getFullYear();
  const key = `${opts.docType}:${opts.branchCode}:${year}`;
  const seq = await nextSequence(tx, key);
  return `${opts.docType}-${opts.branchCode}-${year}-${String(seq).padStart(opts.pad ?? 4, "0")}`;
}

/** Mã không theo chi nhánh/năm — vd "KH-000142" cho khách thuê (org-wide). */
export async function generateSimpleNo(tx: Tx, opts: { docType: string; pad?: number }): Promise<string> {
  const seq = await nextSequence(tx, opts.docType);
  return `${opts.docType}-${String(seq).padStart(opts.pad ?? 6, "0")}`;
}
