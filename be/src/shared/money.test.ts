import { describe, expect, it } from "vitest";
import { roundToThousand, splitByWeight, toVietnameseText, vnd } from "./money.js";

describe("roundToThousand", () => {
  it("rounds half up to the nearest 1,000đ", () => {
    expect(roundToThousand(vnd(2_106_666))).toBe(vnd(2_107_000));
    expect(roundToThousand(vnd(2_106_499))).toBe(vnd(2_106_000));
    expect(roundToThousand(vnd(2_106_500))).toBe(vnd(2_107_000));
    expect(roundToThousand(vnd(1_000_000))).toBe(vnd(1_000_000));
  });
});

describe("splitByWeight", () => {
  it("keeps the total exact, dumping the remainder on the last part", () => {
    const parts = splitByWeight(vnd(100_000), [1, 1, 1]);
    expect(parts.reduce((a, b) => a + b, 0n)).toBe(vnd(100_000));
    expect(parts).toEqual([33333n, 33333n, 33334n]);
  });

  it("splits proportionally by weight", () => {
    const parts = splitByWeight(vnd(300_000), [1, 2]);
    expect(parts.reduce((a, b) => a + b, 0n)).toBe(vnd(300_000));
    expect(parts[0]).toBe(vnd(100_000));
  });
});

describe("toVietnameseText", () => {
  it("spells out whole VND amounts", () => {
    expect(toVietnameseText(vnd(0))).toBe("Không đồng");
    expect(toVietnameseText(vnd(2_850_000))).toBe(
      "Hai triệu tám trăm năm mươi nghìn đồng",
    );
    expect(toVietnameseText(vnd(1_000_000))).toBe("Một triệu đồng");
    expect(toVietnameseText(vnd(105_000))).toBe("Một trăm linh năm nghìn đồng");
  });
});
