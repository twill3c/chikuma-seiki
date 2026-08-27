import { gaussian, lcg } from "./rng";

/**
 * 部品の欠品リスクと安全在庫(F-11)。
 *
 * 多品種少量の EMS では、一点でも部品が欠ければラインが組めない。
 * 在庫を厚くすれば欠品は減るが、機種ごとの専用部品を抱えることになり、
 * そのまま資金が寝る。この綱引きを、**リードタイムの平方根**という
 * 一本の式で見せるのがこのデモの主題である。
 *
 * DOM に依存しない純関数だけを置く(N-04)。
 */

export type Part = {
  id: string;
  name: string;
  note: string;
  /** 週あたりの平均使用数 */
  weeklyMean: number;
  /** 週あたりの使用数の標準偏差。多品種少量なので変動が大きい */
  weeklySd: number;
  /** 発注から入荷までの週数 */
  leadTimeWeeks: number;
  /** 単価(円) */
  unitCost: number;
};

export const PARTS: readonly Part[] = [
  {
    id: "mcu",
    name: "制御用マイコン",
    note: "長納期の代表格。代替品が無く、一点でも欠ければ基板が組めません。",
    weeklyMean: 120,
    weeklySd: 45,
    leadTimeWeeks: 26,
    unitCost: 1850,
  },
  {
    id: "sensor",
    name: "センサ IC",
    note: "医療機器向け。認定した品番から変えられないので、在庫で吸収するしかありません。",
    weeklyMean: 80,
    weeklySd: 34,
    leadTimeWeeks: 14,
    unitCost: 2400,
  },
  {
    id: "connector",
    name: "コネクタ",
    note: "国内在庫があり、切らしてもすぐ入ります。",
    weeklyMean: 260,
    weeklySd: 70,
    leadTimeWeeks: 3,
    unitCost: 95,
  },
  {
    id: "chip",
    name: "チップ抵抗・コンデンサ",
    note: "汎用品。共通で使うので変動は相対的に小さく、単価も低い。",
    weeklyMean: 5200,
    weeklySd: 900,
    leadTimeWeeks: 2,
    unitCost: 1.4,
  },
] as const;

/* ------------------------------------------------------------- 正規分布 */

/**
 * 標準正規分布の累積分布関数。
 * 誤差関数の有理近似(Abramowitz & Stegun 7.1.26 相当)。
 */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.319381530 +
      t *
        (-0.356563782 +
          t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

/**
 * 標準正規分布の分位点(逆累積分布関数)。Acklam の有理近似。
 *
 * 逆関数どうしの往復(T-170)は自己無矛盾しか示さないので、
 * 標準正規分布表の公表値とも突き合わせてある(T-171)。
 */
export function normalQuantile(p: number): number {
  if (p <= 0 || p >= 1) throw new RangeError(`p は 0 < p < 1: ${p}`);

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p > pHigh) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  const q = p - 0.5;
  const r = q * q;
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}

/* --------------------------------------------------------- 安全在庫の式 */

/**
 * 安全在庫。
 *
 * `z · σ · √L`。**リードタイムの平方根**に比例するのが要点で、
 * 納期が 4 倍になっても在庫は 2 倍で済む。逆に言えば、
 * 納期が延びるほど「在庫で吸収する」costが効率的でなくなる。
 */
export function safetyStock(
  serviceLevel: number,
  weeklySd: number,
  leadTimeWeeks: number,
): number {
  return normalQuantile(serviceLevel) * weeklySd * Math.sqrt(leadTimeWeeks);
}

/** 発注点。リードタイム中の平均使用数 + 安全在庫 */
export function reorderPoint(part: Part, serviceLevel: number): number {
  return (
    part.weeklyMean * part.leadTimeWeeks +
    safetyStock(serviceLevel, part.weeklySd, part.leadTimeWeeks)
  );
}

/** 安全在庫として寝る金額 */
export function inventoryValue(part: Part, serviceLevel: number): number {
  return (
    safetyStock(serviceLevel, part.weeklySd, part.leadTimeWeeks) * part.unitCost
  );
}

/* ----------------------------------------------------- シミュレーション */

export type Cycle = {
  index: number;
  orderWeek: number;
  arrivalWeek: number;
  /** リードタイム中に使った総数 */
  demandDuringLead: number;
  /** 発注点を割ってから入荷までに在庫が尽きたか */
  stockout: boolean;
  /** 入荷直前の在庫(負なら欠品した量) */
  lowest: number;
};

export type SimResult = {
  cycles: number;
  orders: number;
  stockoutCycles: number;
  /** 記録として残す先頭のサイクル(画面の在庫推移に使う) */
  trace: Cycle[];
};

const TRACE_LIMIT = 12;

/**
 * 発注点方式のシミュレーション。
 *
 * サイクルごとに「リードタイム中の使用数」を引き、それが発注点を
 * 上回ったら欠品とする。理論上、欠品するサイクルの割合は
 * **ちょうど 1 − Φ(z)** になる。これが F-11 のオラクルである(T-175)。
 *
 * 乱数は種から回すので、同じ入力なら必ず同じ結果になる(N-03)。
 * したがってこの検査はフレークしない。
 */
export function simulate(
  part: Part,
  serviceLevel: number,
  cycles: number,
  seed: number,
): SimResult {
  const g = gaussian(lcg(seed + 6101));
  const rp = reorderPoint(part, serviceLevel);
  const trace: Cycle[] = [];
  let stockoutCycles = 0;

  for (let i = 0; i < cycles; i++) {
    /*
      リードタイム中の使用数を、**週ごとに独立に引いて足す**。

      最初、集約分布 N(μL, σ√L) から一度に引いていた。速いし分布としては
      等しいのだが、それだと欠品判定が「Z > z」に還元され、
      1 − Φ(z) との一致がほぼ恒等式になる——**オラクルが循環する**
      (loop_007 の VERIF-FALSE)。

      このデモの主張は「安全在庫はリードタイムの平方根に比例する」であり、
      その根拠が σ√L という集約則である。検査したいのはまさにそこなので、
      集約則を使わずに週を積み上げ、結果として一致することを見る。
    */
    let demandDuringLead = 0;
    for (let w = 0; w < part.leadTimeWeeks; w++) {
      demandDuringLead += part.weeklyMean + g() * part.weeklySd;
    }

    const lowest = rp - demandDuringLead;
    const stockout = lowest < 0;
    if (stockout) stockoutCycles++;

    if (trace.length < TRACE_LIMIT) {
      const orderWeek = i * part.leadTimeWeeks;
      trace.push({
        index: i,
        orderWeek,
        arrivalWeek: orderWeek + part.leadTimeWeeks,
        demandDuringLead,
        stockout,
        lowest,
      });
    }
  }

  return { cycles, orders: cycles, stockoutCycles, trace };
}

/** 画面に出す一式 */
export function inventoryPlan(part: Part, serviceLevel: number, seed: number) {
  const sim = simulate(part, serviceLevel, 4000, seed);
  return {
    z: normalQuantile(serviceLevel),
    safety: safetyStock(serviceLevel, part.weeklySd, part.leadTimeWeeks),
    reorder: reorderPoint(part, serviceLevel),
    value: inventoryValue(part, serviceLevel),
    theoreticalStockoutRate: 1 - serviceLevel,
    measuredStockoutRate: sim.stockoutCycles / sim.cycles,
    sim,
  };
}
