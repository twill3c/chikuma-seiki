import { describe, expect, it } from "vitest";
import { COMPANY, HEADCOUNT, headcountTotal } from "./company";

/*
  期待値の出所はすべて SPEC §2(会社設定)。外部データは存在しないので、
  ここでの「正解」は仕様の条項そのものである。SPEC §2 を書き換えたら
  このテストも同時に書き換わるべきであり、片方だけ動いたら落ちる。
*/

describe("会社設定 — 従業員の内訳(T-001〜T-003 / F-14)", () => {
  it("T-001 部門別人数の合計が総従業員数に一致する", () => {
    expect(headcountTotal()).toBe(COMPANY.employees);
  });

  it("T-002 部門 ID に重複が無い", () => {
    const ids = HEADCOUNT.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("T-003 SPEC §2 の 4 部門が定義どおりの人数で存在する", () => {
    // SPEC §2 の表: 製造現場 78 / 品質管理 10 / 設計・生産技術 10 / 情報システム 7
    const spec: Record<string, number> = {
      manufacturing: 78,
      quality: 10,
      engineering: 10,
      it: 7,
    };
    for (const [id, count] of Object.entries(spec)) {
      const dept = HEADCOUNT.find((d) => d.id === id);
      expect(dept, id).toBeDefined();
      expect(dept!.count, id).toBe(count);
    }
  });

  it("どの部門も人数が正の整数である", () => {
    for (const d of HEADCOUNT) {
      expect(Number.isInteger(d.count), d.id).toBe(true);
      expect(d.count, d.id).toBeGreaterThan(0);
    }
  });
});

describe("会社設定 — 所在地の粒度(SPEC §6)", () => {
  it("所在地は都道府県と市までしか持たない", () => {
    expect(COMPANY.address.region).toBeTruthy();
    expect(COMPANY.address.locality).toBeTruthy();
    // 番地に相当する鍵をそもそも型として持たせない、という設計の確認。
    expect(Object.keys(COMPANY.address)).toEqual(
      expect.not.arrayContaining(["street", "streetAddress", "banchi"]),
    );
  });

  it("架空である旨の明示文が空でない", () => {
    expect(COMPANY.fictionNotice.length).toBeGreaterThan(20);
    expect(COMPANY.fictionNotice).toContain("架空");
  });
});
