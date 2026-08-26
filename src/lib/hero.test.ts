import { describe, expect, it } from "vitest";
import { HERO_VIEWBOX, heroTraces, contourBands } from "./hero";

/*
  N-03。ヒーローの図は「基板の配線 × 佐久平の等高線」を式で決める。
  乱数を使わないので、サーバでの静的書き出しとブラウザでの再描画が必ず一致する。
  一致しないと Next.js のハイドレーション不整合として現れる。
*/

describe("ヒーロー図の決定性(T-030 / T-032 / N-03)", () => {
  it("T-030 同じ種を渡せば完全に同じ出力になる", () => {
    expect(JSON.stringify(heroTraces(7))).toBe(JSON.stringify(heroTraces(7)));
    expect(JSON.stringify(contourBands(7))).toBe(
      JSON.stringify(contourBands(7)),
    );
  });

  it("種が違えば絵も変わる(定数を返しているだけではない)", () => {
    expect(JSON.stringify(heroTraces(7))).not.toBe(
      JSON.stringify(heroTraces(8)),
    );
  });

  it("T-032 全ての点が viewBox の内側に収まる", () => {
    for (const trace of heroTraces(7)) {
      for (const p of trace.points) {
        expect(p.x, `x=${p.x}`).toBeGreaterThanOrEqual(0);
        expect(p.x, `x=${p.x}`).toBeLessThanOrEqual(HERO_VIEWBOX.w);
        expect(p.y, `y=${p.y}`).toBeGreaterThanOrEqual(0);
        expect(p.y, `y=${p.y}`).toBeLessThanOrEqual(HERO_VIEWBOX.h);
      }
    }
  });

  it("配線は必ず 2 点以上を持ち、path 文字列に NaN が混ざらない", () => {
    const traces = heroTraces(7);
    expect(traces.length).toBeGreaterThan(0);
    for (const trace of traces) {
      expect(trace.points.length).toBeGreaterThanOrEqual(2);
      expect(trace.d).not.toContain("NaN");
      expect(trace.d.startsWith("M")).toBe(true);
    }
  });

  it("配線は直交と 45 度だけで曲がる(基板の配線らしさ)", () => {
    for (const trace of heroTraces(7)) {
      for (let i = 1; i < trace.points.length; i++) {
        const dx = Math.abs(trace.points[i].x - trace.points[i - 1].x);
        const dy = Math.abs(trace.points[i].y - trace.points[i - 1].y);
        const orthogonal = dx < 1e-9 || dy < 1e-9;
        const diagonal = Math.abs(dx - dy) < 1e-9;
        expect(orthogonal || diagonal, `区間 ${i}: dx=${dx} dy=${dy}`).toBe(
          true,
        );
      }
    }
  });
});
