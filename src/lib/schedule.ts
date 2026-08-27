import { lcg } from "./rng";

/**
 * 段取り替えつきの生産計画(F-10)。
 *
 * 多品種少量では、機械が動いている時間より次の機種に切り替えている時間の方が
 * 長い日がある。切り替えの実体は**フィーダの載せ替え**なので、段取り時間を
 * 「前の機種と部品構成がどれだけ違うか」——部品集合の対称差——で決める。
 * これで順序依存性が自然に出て、しかも厳密に計算できる。
 *
 * DOM に依存しない純関数だけを置く(N-04)。
 */

/** 段取りのたびに必ずかかる時間(プログラム切替・初物確認) */
export const SETUP_FIXED_MINUTES = 8;
/** フィーダ 1 本の載せ替え(外す・載せる・座標合わせ) */
export const FEEDER_MINUTES = 2.5;

export type Job = {
  id: string;
  /** 機種名。架空の型番 */
  product: string;
  /** 枚数 */
  quantity: number;
  /** 使う部品の品番。この集合の差が段取り時間を決める */
  parts: string[];
  /** 加工時間(分) */
  processMinutes: number;
  /** 納期。その週の開始からの経過分 */
  dueMinutes: number;
};

/**
 * 段取り時間。前の構成 `from` から次の構成 `to` に替えるのにかかる分。
 *
 * 外す本数(from にあって to に無い)と載せる本数(to にあって from に無い)の
 * 合計、つまり対称差の大きさに比例する。対称なので、どちらから見ても同じ。
 */
export function setupMinutes(from: readonly string[], to: readonly string[]): number {
  const a = new Set(from);
  const b = new Set(to);
  let diff = 0;
  for (const p of a) if (!b.has(p)) diff++;
  for (const p of b) if (!a.has(p)) diff++;
  return SETUP_FIXED_MINUTES + diff * FEEDER_MINUTES;
}

export type GanttSegment = {
  jobId: string;
  setupStart: number;
  /** 段取りが終わり、加工が始まる時刻 */
  processStart: number;
  end: number;
};

/** 投入順から時間割を組む。区間は隙間なく連続する */
export function buildGantt(order: readonly Job[]): GanttSegment[] {
  const segments: GanttSegment[] = [];
  let clock = 0;
  let mounted: readonly string[] = [];

  for (const job of order) {
    const setup = setupMinutes(mounted, job.parts);
    const setupStart = clock;
    const processStart = setupStart + setup;
    const end = processStart + job.processMinutes;
    segments.push({ jobId: job.id, setupStart, processStart, end });
    clock = end;
    mounted = job.parts;
  }

  return segments;
}

export type ScheduleCost = {
  /** 段取りに使った時間の合計 */
  setupMinutes: number;
  /** 加工に使った時間の合計 */
  processMinutes: number;
  /** 全部終わるまで */
  makespanMinutes: number;
  /** 納期に間に合わなかった分の合計 */
  tardinessMinutes: number;
  /** 納期に間に合ったジョブ数 */
  onTimeCount: number;
  /**
   * 最適化が最小化する値。
   * 重み 0 なら段取りだけ、1 なら遅れだけを見る。
   */
  objective: number;
};

/**
 * 投入順の評価。
 *
 * 段取りと遅れは単位が同じ「分」なので、重みで混ぜられる。
 * 段取りを詰めれば納期の遠い機種から流すことになり、遅れが増える——
 * このデモが見せたいのはその綱引きである。
 */
export function scheduleCost(order: readonly Job[], weight: number): ScheduleCost {
  let setup = 0;
  let process = 0;
  let clock = 0;
  let tardiness = 0;
  let onTime = 0;
  let mounted: readonly string[] = [];

  for (const job of order) {
    const s = setupMinutes(mounted, job.parts);
    setup += s;
    process += job.processMinutes;
    clock += s + job.processMinutes;
    const late = clock - job.dueMinutes;
    if (late > 0) tardiness += late;
    else onTime++;
    mounted = job.parts;
  }

  return {
    setupMinutes: setup,
    processMinutes: process,
    makespanMinutes: clock,
    tardinessMinutes: tardiness,
    onTimeCount: onTime,
    objective: (1 - weight) * setup + weight * tardiness,
  };
}

/* ---------------------------------------------------------------- 解法 */

/** 受注順にそのまま流す。何もしない基準線 */
export function fifo(jobs: readonly Job[]): Job[] {
  return [...jobs];
}

/**
 * 貪欲法。いま載っている構成から、次の一手が最も安いジョブを選び続ける。
 * 現場が手で組むときの考え方に近い。
 */
export function greedy(jobs: readonly Job[], weight: number): Job[] {
  const remaining = [...jobs];
  const order: Job[] = [];

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestCost = Number.POSITIVE_INFINITY;
    for (let i = 0; i < remaining.length; i++) {
      // 一手先だけを見る。並びを確定させたうえでの評価なので、
      // コスト関数は総当たりと同じものを通す(二経路で食い違わせない)。
      const cost = scheduleCost([...order, remaining[i]], weight).objective;
      if (cost < bestCost) {
        bestCost = cost;
        bestIndex = i;
      }
    }
    order.push(remaining.splice(bestIndex, 1)[0]);
  }

  return order;
}

/**
 * 局所探索。貪欲法の解から始めて、二点交換と一点移動で改善が無くなるまで回す。
 *
 * 最適を保証しない。保証したいなら総当たりだが、実機の 20 ジョブでは
 * 順列が 2.4×10^18 通りになるので回らない——というのがこのデモの要点でもある。
 */
export function localSearch(jobs: readonly Job[], weight: number): Job[] {
  let current = greedy(jobs, weight);
  let best = scheduleCost(current, weight).objective;

  let improved = true;
  let guard = 0;
  while (improved && guard < 200) {
    improved = false;
    guard++;

    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        // 二点交換
        const swapped = [...current];
        [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
        const swapCost = scheduleCost(swapped, weight).objective;
        if (swapCost < best - 1e-9) {
          current = swapped;
          best = swapCost;
          improved = true;
          continue;
        }

        // 一点移動(i を j の位置へ)
        const moved = [...current];
        const [picked] = moved.splice(i, 1);
        moved.splice(j, 0, picked);
        const moveCost = scheduleCost(moved, weight).objective;
        if (moveCost < best - 1e-9) {
          current = moved;
          best = moveCost;
          improved = true;
        }
      }
    }
  }

  return current;
}

/**
 * 全順列の総当たり。**これがオラクルである**(SPEC §5)。
 *
 * n! なので実用にはならない。n=8 で 40,320 通り、n=12 で 4.8 億通り。
 * デモでは小さい問題にだけ使い、発見的解法がこれを下回らないことを確かめる。
 */
export function bruteForceBest(jobs: readonly Job[], weight: number): Job[] {
  let best: Job[] = [...jobs];
  let bestCost = Number.POSITIVE_INFINITY;

  const permute = (fixed: Job[], rest: Job[]) => {
    if (rest.length === 0) {
      const cost = scheduleCost(fixed, weight).objective;
      if (cost < bestCost) {
        bestCost = cost;
        best = [...fixed];
      }
      return;
    }
    for (let i = 0; i < rest.length; i++) {
      permute(
        [...fixed, rest[i]],
        [...rest.slice(0, i), ...rest.slice(i + 1)],
      );
    }
  };

  permute([], [...jobs]);
  return best;
}

/** 総当たりが現実的な上限。これを超えたら画面から選べないようにする */
export const BRUTE_FORCE_LIMIT = 8;

/* -------------------------------------------------------- ジョブの生成 */

/** 部品の品番プール。実際の品番ではなく、種別を表す記号 */
const PART_POOL = [
  "R-1005", "R-1608", "C-1005", "C-1608", "C-2012", "L-2012",
  "D-SOD", "Q-SOT", "U-QFP48", "U-QFP100", "U-BGA", "U-SOP16",
  "X-OSC", "F-FUSE", "K-RELAY", "CN-FFC", "CN-PIN", "SW-TACT",
  "LED-R", "LED-G", "TR-COIL", "VR-TRIM", "SEN-HALL", "SEN-TEMP",
] as const;

const PRODUCT_PREFIX = ["CTL", "SNS", "DRV", "IFC"] as const;

/**
 * ジョブ表を作る。
 *
 * 部品構成は「よく使う核」+「機種ごとの周辺」でできている。
 * 核が共通なので、似た機種を続けて流せば載せ替え本数が減る——
 * この構造が無いと、どの順番でも段取り時間が変わらず、デモにならない。
 */
export function generateJobs(seed: number, count: number): Job[] {
  const rnd = lcg(seed + 4001);
  const jobs: Job[] = [];

  // 3 系統の「核」。実際の設計でも、同じシリーズは共通部品が多い
  const cores = Array.from({ length: 3 }, () => {
    const picked = new Set<string>();
    while (picked.size < 5) {
      picked.add(PART_POOL[Math.floor(rnd() * PART_POOL.length)]);
    }
    return [...picked].sort();
  });

  // 先に中身を作る。納期は総所要が分かってから振る
  const draft = Array.from({ length: count }, (_, i) => {
    const core = cores[Math.floor(rnd() * cores.length)];
    const parts = new Set(core);
    const extra = 3 + Math.floor(rnd() * 4);
    for (let k = 0; k < extra; k++) {
      parts.add(PART_POOL[Math.floor(rnd() * PART_POOL.length)]);
    }
    const quantity = 20 + Math.floor(rnd() * 180);
    // タクトは 0.35–0.75 分/枚。加工時間は枚数で決まる
    const processMinutes = Math.round(quantity * (0.35 + rnd() * 0.4));
    return {
      id: `J${String(i + 1).padStart(2, "0")}`,
      product: `${PRODUCT_PREFIX[Math.floor(rnd() * PRODUCT_PREFIX.length)]}-${
        100 + Math.floor(rnd() * 900)
      }`,
      quantity,
      parts: [...parts].sort(),
      processMinutes,
    };
  });

  /*
    納期は**総所要時間を基準に**振る。

    一度、総所要と無関係に 240〜2040 分の一様分布で振ったところ、
    総所要 828 分に対して全ジョブが余裕で間に合い、遅れが常に 0 になった。
    「段取りを詰める vs 納期を守る」の綱引きが消えて、重みのつまみが
    何も動かさなくなる(loop_004 の GEN-LOGIC)。

    加工の合計に段取りの見込みを足したものを地平線とし、その 40〜115% に散らす。
    こうすると、どう並べても間に合うジョブと、順番次第で落ちるジョブが混ざる。
  */
  const totalProcess = draft.reduce((sum, j) => sum + j.processMinutes, 0);
  const expectedSetup =
    count * (SETUP_FIXED_MINUTES + 5 * FEEDER_MINUTES);
  const horizon = totalProcess + expectedSetup;

  for (const d of draft) {
    jobs.push({
      ...d,
      dueMinutes: Math.round(horizon * (0.4 + rnd() * 0.75)),
    });
  }

  return jobs;
}
