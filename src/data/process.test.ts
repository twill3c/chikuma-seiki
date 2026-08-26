import { describe, expect, it } from "vitest";
import { PROCESSES } from "./process";
import { EQUIPMENT, HEADCOUNT } from "./company";

/* 期待値の出所は SPEC §2(設備一覧)と F-04。 */

const DEPT_IDS = new Set<string>(HEADCOUNT.map((d) => d.id));
const EQUIP_IDS = new Set<string>(EQUIPMENT.map((e) => e.id));

describe("工程と設備の対応(T-040〜T-044 / F-04)", () => {
  it("T-040 工程 ID に重複が無い", () => {
    const ids = PROCESSES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("T-041 担当部門が HEADCOUNT に実在する", () => {
    for (const p of PROCESSES) {
      expect(DEPT_IDS.has(p.dept), `${p.id} → ${p.dept}`).toBe(true);
    }
  });

  it("T-042 参照する設備が EQUIPMENT に実在する", () => {
    for (const p of PROCESSES) {
      for (const e of p.equipment) {
        expect(EQUIP_IDS.has(e), `${p.id} → ${e}`).toBe(true);
      }
    }
  });

  it("T-043 EQUIPMENT の全設備がいずれかの工程から参照される(取りこぼし無し)", () => {
    // 件数ではなく集合で書く。設備を足してライン図から参照し忘れる事故を捕まえる。
    const referenced = new Set(PROCESSES.flatMap((p) => p.equipment));
    const unreferenced = [...EQUIP_IDS].filter((id) => !referenced.has(id));
    expect(unreferenced).toEqual([]);
  });

  it("T-044 どの工程も管理項目を 1 つ以上持つ", () => {
    for (const p of PROCESSES) {
      expect(p.checks.length, p.id).toBeGreaterThan(0);
      for (const c of p.checks) expect(c.length, p.id).toBeGreaterThan(0);
    }
  });
});
