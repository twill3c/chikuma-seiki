import { describe, expect, it } from "vitest";
import { DEMOS, readyDemos } from "./demos";

describe("デモの説明(T-080 / SPEC §6)", () => {
  it("T-080 どのデモにも模擬である旨の明示がある", () => {
    // 架空の会社が実測値を出しているように読まれてはならない(SPEC §6)。
    for (const d of DEMOS) {
      expect(d.simulationNotice.length, d.id).toBeGreaterThan(20);
      expect(d.simulationNotice, d.id).toContain("模擬");
      expect(d.simulationNotice, d.id).toContain("実際の");
    }
  });

  it("どのデモにも、正しさを何で担保しているかが書いてある", () => {
    for (const d of DEMOS) {
      expect(d.oracle.length, d.id).toBeGreaterThan(20);
    }
  });

  it("デモ ID に重複が無い", () => {
    const ids = DEMOS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("公開中のデモは全体の部分集合である", () => {
    const readyIds = readyDemos().map((d) => d.id);
    const allIds = DEMOS.map((d) => d.id);
    expect(allIds).toEqual(expect.arrayContaining(readyIds));
  });
});
