import { describe, expect, it } from "vitest";
import { formatLot, parseLot, LOT_PATTERN, type Lot } from "./lot";

/*
  往復検査だけを根拠にしない(furigana-keiryo の HC-035 / fukuo-keiryo の HC-027)。
  `parse(format(x)) === x` は自己無矛盾を示すだけで、解釈が正しいことを示さない。
  実際 furigana-keiryo では往復が 6,195 作で 100% 一致したまま、
  取りこぼしを 5 種類素通りさせている。

  そこで往復(T-110)に加えて、桁の構造(T-111)と
  **不正な入力の棄却**(T-112 / T-113)を別の根拠として置く。
*/

const SAMPLE: Lot = { product: "CTL", year: 26, week: 35, serial: 128 };

describe("ロット番号(T-110〜T-113 / F-05)", () => {
  it("T-110 往復する", () => {
    expect(parseLot(formatLot(SAMPLE))).toEqual(SAMPLE);
  });

  it("T-111 桁の構造が仕様どおりになる", () => {
    expect(formatLot(SAMPLE)).toBe("CTL-2635-128");
    expect(LOT_PATTERN.test(formatLot(SAMPLE))).toBe(true);
    // 0 詰めが効いていること
    expect(formatLot({ product: "SNS", year: 4, week: 7, serial: 3 })).toBe(
      "SNS-0407-003",
    );
  });

  it("T-112 不正な入力を棄却する", () => {
    // 往復検査は「正しい入力」しか通さないので、ここが別の根拠になる
    const rejected = [
      "CTL-2600-128", // 週 0
      "CTL-2654-128", // 週 54
      "CT-2635-128", // 機種 2 文字
      "CTLX-2635-128", // 機種 4 文字
      "CTL-2635-1284", // 通番 4 桁
      "CTL-2635-12", // 通番 2 桁
      "CTL_2635_128", // 区切りが違う
      "ctl-2635-128", // 小文字
      "CTL-2635", // 欄が足りない
      "",
    ];
    for (const bad of rejected) {
      expect(parseLot(bad), bad).toBeNull();
    }
  });

  it("T-113 1〜53 週は往復し、0 週と 54 週は棄却される", () => {
    for (let week = 1; week <= 53; week++) {
      const lot: Lot = { product: "DRV", year: 26, week, serial: 1 };
      expect(parseLot(formatLot(lot)), `第 ${week} 週`).toEqual(lot);
    }
    expect(parseLot("DRV-2600-001")).toBeNull();
    expect(parseLot("DRV-2654-001")).toBeNull();
  });

  it("解析した結果は、必ず元の文字列に戻せる形になっている", () => {
    // 逆向き。任意の正しい文字列 → 解析 → 組み立て で同じ文字列に戻る
    for (const text of ["CTL-2635-128", "SNS-0407-003", "IFC-9953-999"]) {
      const parsed = parseLot(text)!;
      expect(parsed, text).not.toBeNull();
      expect(formatLot(parsed)).toBe(text);
    }
  });
});
