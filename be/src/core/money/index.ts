export * from "../../shared/index.js";

/**
 * `bigint` doesn't serialize to JSON — every VND value crossing the HTTP
 * boundary is transmitted as a decimal string. See docs/11-architecture.md §4.
 */
export function serializeVnd(amount: bigint | null | undefined): string | null {
  return amount === null || amount === undefined ? null : amount.toString();
}

export function parseVnd(value: string | null | undefined): bigint | null {
  return value === null || value === undefined ? null : BigInt(value);
}
