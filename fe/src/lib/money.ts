/**
 * VND đến từ be/ dưới dạng chuỗi số nguyên (bigint không serialize được sang
 * JSON) — xem docs/11-architecture.md §4. Format hiển thị theo docs/15 §9.
 */

const VND_FORMATTER = new Intl.NumberFormat("vi-VN");

export function formatVnd(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? BigInt(value) : BigInt(Math.trunc(value));
  return `${VND_FORMATTER.format(n)}đ`;
}

/** Rút gọn cho dashboard: "412tr", "1,2 tỷ" — docs/15 §9. */
export function formatVndShort(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(".", ",")} tỷ`;
  if (Math.abs(n) >= 1_000_000) return `${Math.round(n / 1_000_000)}tr`;
  return formatVnd(n);
}

/** Chuyển input dạng "2000000" hoặc "2.000.000" từ form về chuỗi số nguyên gửi lên API. */
export function parseVndInput(raw: string): string {
  const digitsOnly = raw.replace(/[^\d]/g, "");
  return digitsOnly === "" ? "0" : digitsOnly;
}
