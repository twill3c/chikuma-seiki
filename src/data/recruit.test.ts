import { describe, expect, it } from "vitest";
import { OPENINGS, CONTACT_FIELDS } from "./recruit";
import { COMPANY, HEADCOUNT } from "./company";

const DEPT_IDS = new Set<string>(HEADCOUNT.map((d) => d.id));

describe("採用(T-160 / T-161 / F-07)", () => {
  it("T-160 各求人が実在の部門を参照する", () => {
    for (const o of OPENINGS) {
      expect(DEPT_IDS.has(o.dept), `${o.id} → ${o.dept}`).toBe(true);
    }
  });

  it("T-161 全部門がいずれかの求人から説明される(取りこぼし無し)", () => {
    const covered = new Set(OPENINGS.map((o) => o.dept));
    const uncovered = [...DEPT_IDS].filter((id) => !covered.has(id));
    expect(uncovered).toEqual([]);
  });

  it("求人 ID が一意で、仕事の中身と迎える人が書かれている", () => {
    const ids = OPENINGS.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const o of OPENINGS) {
      expect(o.work.length, o.id).toBeGreaterThan(20);
      expect(o.wanted.length, o.id).toBeGreaterThan(0);
    }
  });
});

describe("問い合わせ(T-162 / T-163 / F-08)", () => {
  it("T-162 項目の定義が送信先を持たない", () => {
    // 型としても定数としても送信先を持たせない、という設計の確認
    for (const f of CONTACT_FIELDS) {
      expect(Object.keys(f).sort()).toEqual([
        "id",
        "kind",
        "label",
        "placeholder",
      ]);
    }
  });

  it("T-162 項目 ID が一意である", () => {
    const ids = CONTACT_FIELDS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("T-163 架空であるため受け付けない旨の文言がある", () => {
    expect(COMPANY.contactNotice).toContain("受け付けていません");
    expect(COMPANY.contactNotice).toContain("架空");
  });
});
