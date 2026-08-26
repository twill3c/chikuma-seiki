import { describe, expect, it } from "vitest";
import { FLOW, leadTimeRange } from "./flow";
import { HEADCOUNT } from "./company";

/* 期待値の出所はすべて SPEC §2 / F-03。外部データは無い。 */

const DEPT_IDS = new Set<string>(HEADCOUNT.map((d) => d.id));

describe("受注から出荷までの流れ(T-050〜T-054 / F-03)", () => {
  it("T-050 段階 ID に重複が無い", () => {
    const ids = FLOW.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("T-051 所要日数が区間として正しい", () => {
    for (const f of FLOW) {
      expect(f.minDays, f.id).toBeGreaterThan(0);
      expect(f.maxDays, f.id).toBeGreaterThanOrEqual(f.minDays);
    }
  });

  it("T-052 担当部門が HEADCOUNT に実在する", () => {
    for (const f of FLOW) {
      expect(DEPT_IDS.has(f.dept), `${f.id} → ${f.dept}`).toBe(true);
    }
  });

  it("T-053 実装工程との接続点がちょうど 1 つある", () => {
    expect(FLOW.filter((f) => f.containsProcesses).length).toBe(1);
  });

  it("T-054 リードタイムの合計が区間として閉じる", () => {
    const { min, max } = leadTimeRange();
    expect(min).toBeGreaterThan(0);
    expect(max).toBeGreaterThanOrEqual(min);
    // 合計は各段階の合計そのもの。別経路で足し直して一致を見る。
    expect(min).toBe(FLOW.reduce((s, f) => s + f.minDays, 0));
    expect(max).toBe(FLOW.reduce((s, f) => s + f.maxDays, 0));
  });
});
