import { describe, expect, it } from "vitest";
import { BOARD_VIEWBOX, DEFECT_KINDS, generateBoard } from "./board";

/* 期待値の出所は F-09 と N-03。外部データは無い。 */

describe("基板の生成(T-070〜T-072 / F-09・N-03)", () => {
  it("T-070 同じ種で 2 回生成して完全に一致する", () => {
    expect(JSON.stringify(generateBoard(11, 4))).toBe(
      JSON.stringify(generateBoard(11, 4)),
    );
  });

  it("種が違えば違う基板になる", () => {
    expect(JSON.stringify(generateBoard(11, 4))).not.toBe(
      JSON.stringify(generateBoard(12, 4)),
    );
  });

  it("T-071 欠陥を持つ部品の数が指定値に一致する", () => {
    for (const n of [0, 1, 4, 9]) {
      const defective = generateBoard(11, n).filter((p) => p.defect !== null);
      expect(defective.length, `欠陥 ${n} 個`).toBe(n);
    }
  });

  it("T-071 種を変えれば 5 種の欠陥がいずれも現れうる", () => {
    // 特定の種で全種が出ることを要求すると、生成の実装を過度に縛る。
    // 「どの種類も出うる」ことだけを、種を回して確かめる。
    const seen = new Set<string>();
    for (let seed = 0; seed < 60; seed++) {
      for (const p of generateBoard(seed, 6)) {
        if (p.defect) seen.add(p.defect);
      }
    }
    expect([...seen].sort()).toEqual([...DEFECT_KINDS].sort());
  });

  it("T-072 部品 ID に重複が無い", () => {
    const ids = generateBoard(11, 4).map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("T-072 全部品が基板の内側に収まる", () => {
    for (const p of generateBoard(11, 4)) {
      expect(p.x, p.id).toBeGreaterThanOrEqual(0);
      expect(p.y, p.id).toBeGreaterThanOrEqual(0);
      expect(p.x + p.w, p.id).toBeLessThanOrEqual(BOARD_VIEWBOX.w);
      expect(p.y + p.h, p.id).toBeLessThanOrEqual(BOARD_VIEWBOX.h);
    }
  });

  it("良品の見かけ信号(機種の癖)が 0–1 に収まる", () => {
    for (const p of generateBoard(11, 4)) {
      expect(p.quirk, p.id).toBeGreaterThanOrEqual(0);
      expect(p.quirk, p.id).toBeLessThanOrEqual(1);
    }
  });

  it("欠陥数が部品数を超える要求は部品数で頭打ちになる", () => {
    const all = generateBoard(11, 10_000);
    expect(all.filter((p) => p.defect !== null).length).toBe(all.length);
  });
});
