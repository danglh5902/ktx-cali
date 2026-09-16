/**
 * Money module — VND is always an integer number of đồng, never a float.
 * See docs/11-architecture.md §4 and §2 D4.
 */

/** Tiền VNĐ, đơn vị đồng, luôn là số nguyên */
export type VND = bigint;

export function vnd(n: number | string | bigint): VND {
  if (typeof n === "number" && !Number.isInteger(n)) {
    throw new RangeError(`VND amount must be an integer number of đồng, got ${n}`);
  }
  return BigInt(n);
}

/** Làm tròn tới 1.000đ, nửa lên */
export function roundToThousand(v: VND): VND {
  const remainder = v % 1000n;
  if (remainder === 0n) return v;
  const base = v - remainder;
  return remainder >= 500n ? base + 1000n : base;
}

/**
 * Chia theo trọng số, phần dư dồn vào phần tử cuối theo thứ tự truyền vào —
 * tổng các phần luôn khớp với `total`, không bao giờ để thất thoát do làm tròn.
 */
export function splitByWeight(total: VND, weights: number[]): VND[] {
  if (weights.length === 0) return [];
  const scaledWeights = weights.map((w) => BigInt(Math.round(w * 1000)));
  const sumWeights = scaledWeights.reduce((a, b) => a + b, 0n);
  if (sumWeights === 0n) throw new RangeError("splitByWeight: total weight must be > 0");

  const parts = scaledWeights.map((w) => (total * w) / sumWeights);
  const allocated = parts.reduce((a, b) => a + b, 0n);
  const lastIndex = parts.length - 1;
  parts[lastIndex] = (parts[lastIndex] ?? 0n) + (total - allocated);
  return parts;
}

const DIGIT_WORDS = [
  "không",
  "một",
  "hai",
  "ba",
  "bốn",
  "năm",
  "sáu",
  "bảy",
  "tám",
  "chín",
];

function threeDigitsToWords(n: number, isFirstGroup: boolean): string {
  const hundreds = Math.floor(n / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;
  const parts: string[] = [];

  if (hundreds > 0 || !isFirstGroup) {
    parts.push(DIGIT_WORDS[hundreds] ?? "không", "trăm");
  }

  if (tens === 0) {
    if (ones > 0 && (hundreds > 0 || !isFirstGroup)) parts.push("linh");
  } else if (tens === 1) {
    parts.push("mười");
  } else {
    parts.push(DIGIT_WORDS[tens] ?? "", "mươi");
  }

  if (ones > 0) {
    if (tens > 1 && ones === 1) parts.push("mốt");
    else if (tens >= 1 && ones === 5) parts.push("lăm");
    else parts.push(DIGIT_WORDS[ones] ?? "");
  }

  return parts.filter(Boolean).join(" ");
}

const GROUP_UNITS = ["", "nghìn", "triệu", "tỷ"];

/** Đọc số tiền VNĐ thành chữ — bắt buộc cho hợp đồng và phiếu thu. */
export function toVietnameseText(v: VND): string {
  if (v < 0n) return `âm ${toVietnameseText(-v)}`;
  if (v === 0n) return "Không đồng";

  let n = v;
  const groups: number[] = [];
  while (n > 0n) {
    groups.unshift(Number(n % 1000n));
    n /= 1000n;
  }
  if (groups.length > GROUP_UNITS.length) {
    throw new RangeError("toVietnameseText: amount too large to spell out");
  }

  const words: string[] = [];
  groups.forEach((group, index) => {
    if (group === 0) return;
    const unit = GROUP_UNITS[groups.length - 1 - index];
    const groupWords = threeDigitsToWords(group, index === 0);
    words.push(unit ? `${groupWords} ${unit}` : groupWords);
  });

  const sentence = words.join(" ");
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)} đồng`;
}
