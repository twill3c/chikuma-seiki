import { describe, expect, it } from "vitest";
import { HISTORY } from "./history";
import { COMPANY } from "./company";

const THIS_YEAR = 2026; // 実測 2026-08-27。未来の出来事を書かないための上限

describe("沿革(T-140〜T-142 / F-06)", () => {
  it("T-140 年が昇順に並んでいる", () => {
    for (let i = 1; i < HISTORY.length; i++) {
      expect(HISTORY[i].year, HISTORY[i].title).toBeGreaterThanOrEqual(
        HISTORY[i - 1].year,
      );
    }
  });

  it("T-141 最初の項目が創業年と一致する", () => {
    expect(HISTORY[0].year).toBe(COMPANY.founded);
  });

  it("T-142 未来の出来事を書かない", () => {
    for (const h of HISTORY) {
      expect(h.year, h.title).toBeLessThanOrEqual(THIS_YEAR);
    }
  });

  it("どの項目にも題と本文がある", () => {
    for (const h of HISTORY) {
      expect(h.title.length, String(h.year)).toBeGreaterThan(0);
      expect(h.body.length, String(h.year)).toBeGreaterThan(10);
    }
  });
})
