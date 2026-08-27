import { describe, expect, it } from "vitest";
import { DONUT, donutSlices } from "./chart";
import { HEADCOUNT, headcountTotal } from "@/data/company";

describe("内訳の扇形(T-120〜T-124 / F-06)", () => {
  it("T-120 2 回呼んで完全に一致する", () => {
    expect(JSON.stringify(donutSlices(HEADCOUNT))).toBe(
      JSON.stringify(donutSlices(HEADCOUNT)),
    );
  });

  it("T-121 中心角の合計が 360 度になる", () => {
    const total = donutSlices(HEADCOUNT).reduce(
      (sum, s) => sum + (s.endAngle - s.startAngle),
      0,
    );
    expect(Math.abs(total - 360)).toBeLessThan(1e-9);
  });

  it("T-122 中心角が人数比と一致する(図を経由せず計算し直す)", () => {
    const total = headcountTotal();
    for (const s of donutSlices(HEADCOUNT)) {
      const dept = HEADCOUNT.find((d) => d.id === s.id)!;
      const share = (s.endAngle - s.startAngle) / 360;
      expect(Math.abs(share - dept.count / total), s.id).toBeLessThan(1e-12);
    }
  });

  it("T-123 扇が隙間なく連続する", () => {
    const slices = donutSlices(HEADCOUNT);
    expect(slices[0].startAngle).toBe(0);
    for (let i = 1; i < slices.length; i++) {
      expect(slices[i].startAngle, slices[i].id).toBe(slices[i - 1].endAngle);
    }
    expect(slices[slices.length - 1].endAngle).toBeCloseTo(360, 9);
  });

  it("T-124 path に NaN が混ざらない", () => {
    for (const s of donutSlices(HEADCOUNT)) {
      expect(s.d, s.id).not.toContain("NaN");
      expect(s.labelPoint.x, s.id).not.toBeNaN();
      expect(s.labelPoint.y, s.id).not.toBeNaN();
    }
  });

  it("扇の中心点が図の内側にある", () => {
    for (const s of donutSlices(HEADCOUNT)) {
      expect(s.labelPoint.x, s.id).toBeGreaterThanOrEqual(0);
      expect(s.labelPoint.x, s.id).toBeLessThanOrEqual(DONUT.size);
      expect(s.labelPoint.y, s.id).toBeGreaterThanOrEqual(0);
      expect(s.labelPoint.y, s.id).toBeLessThanOrEqual(DONUT.size);
    }
  });

  it("項目が 1 つだけでも一周する(0 度の扇にならない)", () => {
    const one = donutSlices([{ id: "solo", name: "唯一", count: 7, role: "" }]);
    expect(one).toHaveLength(1);
    expect(one[0].endAngle - one[0].startAngle).toBeCloseTo(360, 9);
    expect(one[0].d).not.toContain("NaN");
  });
});
