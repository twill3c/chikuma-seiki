import { describe, expect, it } from "vitest";
import { RECORDS, TRACE_CHAIN } from "./quality";
import { PROCESSES } from "./process";

const PROCESS_IDS = new Set<string>(PROCESSES.map((p) => p.id));

describe("記録とトレーサビリティ(T-114 / F-05)", () => {
  it("T-114 参照する工程 ID がすべて実在する", () => {
    for (const r of RECORDS) {
      expect(PROCESS_IDS.has(r.processId), r.processId).toBe(true);
    }
  });

  it("T-114 全工程が 1 つ以上の記録項目を持つ(取りこぼし無し)", () => {
    // 件数ではなく集合で見る。工程を足して記録の定義を忘れる事故を捕まえる。
    const covered = new Set(RECORDS.map((r) => r.processId));
    const uncovered = [...PROCESS_IDS].filter((id) => !covered.has(id));
    expect(uncovered).toEqual([]);
    for (const r of RECORDS) {
      expect(r.items.length, r.processId).toBeGreaterThan(0);
    }
  });

  it("記録の保存年数が正の整数である", () => {
    for (const r of RECORDS) {
      expect(Number.isInteger(r.retentionYears), r.processId).toBe(true);
      expect(r.retentionYears, r.processId).toBeGreaterThan(0);
    }
  });

  it("辿る鎖が製品から部品ロットまで切れずに繋がる", () => {
    for (let i = 1; i < TRACE_CHAIN.length; i++) {
      expect(TRACE_CHAIN[i].from, TRACE_CHAIN[i].label).toBe(
        TRACE_CHAIN[i - 1].to,
      );
    }
  });
})
