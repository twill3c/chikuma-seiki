import { describe, expect, it } from "vitest";
import { CLEANROOM_VIEWBOX, airflowLines, CLEANROOM_CLASSES } from "./airflow";

describe("クリーンルームの気流(T-130〜T-132 / F-05・N-03)", () => {
  it("T-130 2 回呼んで完全に一致する", () => {
    expect(JSON.stringify(airflowLines())).toBe(
      JSON.stringify(airflowLines()),
    );
  });

  it("T-131 流線が天井から床へ下る(y が単調非減少)", () => {
    // 気流は天井の吹き出しから床の吸い込みへ一方向に流れる。
    // 途中で上がる流線があれば、それは絵として嘘になる。
    for (const line of airflowLines()) {
      for (let i = 1; i < line.points.length; i++) {
        expect(
          line.points[i].y,
          `${line.id} の ${i} 点目で上に戻っている`,
        ).toBeGreaterThanOrEqual(line.points[i - 1].y);
      }
    }
  });

  it("T-132 全ての点が図の内側に収まる", () => {
    for (const line of airflowLines()) {
      for (const p of line.points) {
        expect(p.x, line.id).toBeGreaterThanOrEqual(0);
        expect(p.x, line.id).toBeLessThanOrEqual(CLEANROOM_VIEWBOX.w);
        expect(p.y, line.id).toBeGreaterThanOrEqual(0);
        expect(p.y, line.id).toBeLessThanOrEqual(CLEANROOM_VIEWBOX.h);
      }
    }
  });

  it("流線は天井付近から始まり、床付近で終わる", () => {
    for (const line of airflowLines()) {
      const first = line.points[0];
      const last = line.points[line.points.length - 1];
      expect(first.y, line.id).toBeLessThan(CLEANROOM_VIEWBOX.h * 0.2);
      expect(last.y, line.id).toBeGreaterThan(CLEANROOM_VIEWBOX.h * 0.8);
    }
  });

  it("path に NaN が混ざらない", () => {
    for (const line of airflowLines()) {
      expect(line.d, line.id).not.toContain("NaN");
    }
  });
});

describe("清浄度クラスの説明(F-05 / SPEC §6)", () => {
  it("粒子数の上限がクラスが上がるごとに 10 倍になる", () => {
    // 米国連邦規格 209E のクラスは「1 立方フィートあたり 0.5μm 以上の粒子数」
    // そのものを名前にしている。表がその定義から外れていないことを見る。
    for (const c of CLEANROOM_CLASSES) {
      expect(c.particlesPerCubicFoot, c.label).toBe(c.usClass);
    }
  });

  it("この会社が対応するクラスが表に含まれている", () => {
    expect(CLEANROOM_CLASSES.some((c) => c.usClass === 10000)).toBe(true);
  });

  it("認証番号にあたる情報を持たない(SPEC §6)", () => {
    for (const c of CLEANROOM_CLASSES) {
      expect(Object.keys(c).sort()).toEqual([
        "isoClass",
        "label",
        "particlesPerCubicFoot",
        "usClass",
        "use",
      ]);
    }
  });
});
