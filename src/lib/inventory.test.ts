import { describe, expect, it } from "vitest";
import { gaussian, lcg } from "./rng";
import {
  PARTS,
  inventoryValue,
  normalCdf,
  normalQuantile,
  reorderPoint,
  safetyStock,
  simulate,
} from "./inventory";

/** 実装と同じ乱数の作り方。テスト側で標本を取り直すために使う */
function gaussianFor(seed: number): () => number {
  return gaussian(lcg(seed));
}

/*
  オラクルは「サイクル欠品率 ≈ 1 − Φ(z)」の恒等式(T-175)。

  発注点を μ·L + z·σ·√L に置くと、リードタイム中に在庫が尽きる確率は
  理論上 1 − Φ(z) になる。閉形式で出した値と、シミュレーションで数えた実測が
  一致することを要求する——**片方だけを信じない**。

  乱数は種から回すので、この検査は決定的でありフレークしない。
*/

describe("正規分布(T-170 / T-171 / F-11)", () => {
  it("T-170 分位点と累積分布が逆関数の関係にある", () => {
    for (const p of [0.5, 0.8, 0.9, 0.95, 0.975, 0.99, 0.995, 0.999]) {
      expect(Math.abs(normalCdf(normalQuantile(p)) - p), `p=${p}`).toBeLessThan(
        1e-6,
      );
    }
  });

  it("T-171 標準正規分布表の値と一致する(外部権威)", () => {
    /*
      出所: 標準正規分布表の一般的な公表値。
      片側 95% → 1.6449、97.5% → 1.9600、99% → 2.3263。
      逆関数どうしの往復(T-170)は自己無矛盾しか示さないので、
      外から取った値と突き合わせる(HC-035 と同じ考え方)。
    */
    const table: [number, number][] = [
      [0.9, 1.2816],
      [0.95, 1.6449],
      [0.975, 1.96],
      [0.99, 2.3263],
      [0.995, 2.5758],
    ];
    for (const [p, z] of table) {
      expect(Math.abs(normalQuantile(p) - z), `p=${p}`).toBeLessThan(1e-3);
    }
  });

  it("累積分布の基準点が合う", () => {
    expect(Math.abs(normalCdf(0) - 0.5)).toBeLessThan(1e-9);
    expect(normalCdf(-6)).toBeLessThan(1e-8);
    expect(normalCdf(6)).toBeGreaterThan(1 - 1e-8);
  });
});

describe("安全在庫(T-172 / T-173 / T-177 / F-11)", () => {
  it("T-172 リードタイムを 4 倍にすると安全在庫が 2 倍になる(√L に比例)", () => {
    // これがこのデモの主題。納期が延びると在庫は「比例」ではなく「平方根」で増える。
    const a = safetyStock(0.95, 40, 4);
    const b = safetyStock(0.95, 40, 16);
    expect(Math.abs(b - a * 2)).toBeLessThan(1e-9);
  });

  it("T-173 サービス水準を上げると安全在庫が減らない", () => {
    let prev = -Infinity;
    for (const level of [0.5, 0.8, 0.9, 0.95, 0.99, 0.999]) {
      const s = safetyStock(level, 40, 8);
      expect(s, `水準 ${level}`).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });

  it("発注点が平均需要と安全在庫の和になる", () => {
    const part = PARTS[0];
    const rp = reorderPoint(part, 0.95);
    const expected =
      part.weeklyMean * part.leadTimeWeeks + safetyStock(0.95, part.weeklySd, part.leadTimeWeeks);
    expect(Math.abs(rp - expected)).toBeLessThan(1e-9);
  });

  it("T-177 在庫金額が安全在庫と単価から再計算できる", () => {
    for (const part of PARTS) {
      const v = inventoryValue(part, 0.95);
      const byHand = safetyStock(0.95, part.weeklySd, part.leadTimeWeeks) * part.unitCost;
      expect(Math.abs(v - byHand), part.id).toBeLessThan(1e-6);
    }
  });
});

describe("シミュレーション(T-174 〜 T-176 / F-11)", () => {
  it("T-174 同じ種で 2 回回して完全に一致する", () => {
    const part = PARTS[0];
    expect(JSON.stringify(simulate(part, 0.95, 200, 7))).toBe(
      JSON.stringify(simulate(part, 0.95, 200, 7)),
    );
  });

  it("T-175 実測の欠品率が閉形式 1 − Φ(z) と一致する", () => {
    /*
      **この検査が循環していないこと**が要点。

      シミュレーションは集約分布 N(μL, σ√L) を使わず、
      週ごとに独立な需要を引いて足している。閉形式の側だけが σ√L を使う。
      したがって両者の一致は、σ√L という集約則が実際に成り立っていることを
      示している——ここを一度に引く形にすると、判定が「Z > z」に還元されて
      恒等式になり、何も検査しなくなる(loop_007 の VERIF-FALSE)。

      サイクル数 4,000。比率 p の標準誤差は √(p(1−p)/n) なので、
      p=0.05 のとき約 0.0034。許容誤差 0.02 は 5σ 相当で、
      「たまたま外れた」では説明できない差だけを落とす。
    */
    const CYCLES = 4000;
    for (const part of PARTS) {
      for (const level of [0.9, 0.95, 0.99]) {
        const theory = 1 - level;
        const result = simulate(part, level, CYCLES, 31);
        const measured = result.stockoutCycles / result.cycles;
        expect(
          Math.abs(measured - theory),
          `${part.id} 水準 ${level}: 実測 ${measured.toFixed(4)} 理論 ${theory.toFixed(4)}`,
        ).toBeLessThan(0.02);
      }
    }
  });

  it("T-175 週を積み上げた需要のばらつきが σ√L に一致する(集約則の直接検査)", () => {
    /*
      欠品率の一致(上)を裏から支える式。週ごとに独立に引いて足した合計の
      標準偏差が σ√L になることを、実測の標準偏差で直接確かめる。
    */
    for (const part of PARTS) {
      // 発注点は固定なので、lowest のばらつき = 需要のばらつき
      const values = sampleLowest(part, 6000, 13);
      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      const sd = Math.sqrt(
        values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1),
      );
      const theory = part.weeklySd * Math.sqrt(part.leadTimeWeeks);
      expect(
        Math.abs(sd / theory - 1),
        `${part.id}: 実測 σ=${sd.toFixed(1)} 理論 σ√L=${theory.toFixed(1)}`,
      ).toBeLessThan(0.05);
    }
  });

  it("T-176 発注はサイクルに 1 回、入荷はリードタイム後に起きる", () => {
    const part = PARTS[0];
    const r = simulate(part, 0.95, 60, 3);
    expect(r.orders).toBe(r.cycles);
    for (const c of r.trace) {
      expect(c.arrivalWeek - c.orderWeek, `サイクル ${c.index}`).toBe(
        part.leadTimeWeeks,
      );
    }
  });

  it("水準を上げると欠品サイクルが減る", () => {
    const part = PARTS[1];
    const low = simulate(part, 0.9, 2000, 5).stockoutCycles;
    const high = simulate(part, 0.99, 2000, 5).stockoutCycles;
    expect(high).toBeLessThan(low);
  });

  it("部品の定義が揃っている", () => {
    const ids = PARTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PARTS) {
      expect(p.leadTimeWeeks, p.id).toBeGreaterThan(0);
      expect(p.weeklySd, p.id).toBeGreaterThan(0);
      expect(p.unitCost, p.id).toBeGreaterThan(0);
    }
  });
});

/**
 * リードタイム中の需要を、実装と同じ引き方で標本として取り出す。
 * `simulate` は先頭の数サイクルしか記録を残さないので、
 * 集約則の検査にはここで全数を集める。
 */
function sampleLowest(
  part: (typeof PARTS)[number],
  cycles: number,
  seed: number,
): number[] {
  const rp = reorderPoint(part, 0.95);
  const out: number[] = [];
  const g = gaussianFor(seed + 6101);
  for (let i = 0; i < cycles; i++) {
    let demand = 0;
    for (let w = 0; w < part.leadTimeWeeks; w++) {
      demand += part.weeklyMean + g() * part.weeklySd;
    }
    out.push(rp - demand);
  }
  return out;
}
