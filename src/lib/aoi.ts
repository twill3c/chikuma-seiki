import { clamp01, gaussian, lcg } from "./rng";
import { DEFECT_SIGNAL, type Part } from "./board";

/**
 * AOI(自動光学検査)の判定モデル(F-09)。
 *
 * ここで模しているのは「AI が欠陥を余計に見つける」ことではない。
 * 実際に効くのは逆で、**良品なのに上がってしまう見かけの信号(機種の癖)を
 * 割り引けること**である。過検出が減れば、目視再検査に取られていた時間が戻る。
 *
 * DOM に依存しない純関数だけを置く(N-04)。
 */

export type Inspector = "rule" | "ai";

export const INSPECTOR_LABEL: Record<Inspector, string> = {
  rule: "ルールベース単独",
  ai: "AI 併用",
};

/**
 * 検査器の性格。AI 併用は癖を割り引き、ばらつきも小さい。
 *
 * **完璧にはしない。** 割引を効かせすぎると AUC が 1.000 に張り付き、
 * ROC が完全な直角になって「AI は万能」という嘘の絵になる。
 * 実際の AI 併用は過検出を大きく減らすが、見逃しが消えるわけではない。
 */
const PROFILE: Record<Inspector, { quirkWeight: number; sigma: number }> = {
  rule: { quirkWeight: 1.0, sigma: 0.1 },
  ai: { quirkWeight: 0.62, sigma: 0.075 },
};

export type Scored = {
  part: Part;
  /** 異常度スコア(0–1)。しきい値以上を不良と判定する */
  score: number;
  /** 真値。この部品が本当に不良かどうか */
  actual: boolean;
};

/**
 * ばらつきを部品ごとに 1 回だけ引く。
 *
 * ルールベースと AI 併用で**同じ引きを共有**するのが要点で、
 * これにより両者の差は「癖の割引」と「ばらつきの幅」だけになる。
 * 別々に引くと、AI が良く見えたのが偶然かどうか分からなくなる。
 */
function noiseFor(count: number, seed: number): number[] {
  const g = gaussian(lcg(seed + 977));
  return Array.from({ length: count }, () => g());
}

function signalOf(part: Part, inspector: Inspector): number {
  const { quirkWeight } = PROFILE[inspector];
  const defectSignal = part.defect ? DEFECT_SIGNAL[part.defect] : 0;
  // 不良の部品にも癖はある。強い方が画像上の差として出る
  return Math.max(defectSignal, part.quirk * quirkWeight);
}

export function scoreAll(
  parts: readonly Part[],
  inspector: Inspector,
  seed: number,
): Scored[] {
  const eps = noiseFor(parts.length, seed);
  const { sigma } = PROFILE[inspector];
  return parts.map((part, i) => ({
    part,
    score: clamp01(signalOf(part, inspector) + eps[i] * sigma),
    actual: part.defect !== null,
  }));
}

export type Confusion = {
  /** 不良を不良と判定 */
  tp: number;
  /** 良品を不良と判定(過検出 — 目視再検査が増える) */
  fp: number;
  /** 不良を良品と判定(見逃し — 流出する) */
  fn: number;
  /** 良品を良品と判定 */
  tn: number;
};

/** しきい値以上を不良と判定したときの混同行列 */
export function confusion(scored: readonly Scored[], threshold: number): Confusion {
  const c: Confusion = { tp: 0, fp: 0, fn: 0, tn: 0 };
  for (const s of scored) {
    const flagged = s.score >= threshold;
    if (s.actual) flagged ? c.tp++ : c.fn++;
    else flagged ? c.fp++ : c.tn++;
  }
  return c;
}

export type RocPoint = { fpr: number; tpr: number; threshold: number };

/**
 * ROC 曲線。
 *
 * 同点のスコアは**一つの群としてまとめて**進める。これをしないと、
 * 同点の並べ替え方によって曲線が階段の内側にも外側にも振れ、
 * 台形積分の AUC が順位対総当たりの AUC と一致しなくなる(T-076)。
 */
export function rocCurve(scored: readonly Scored[]): RocPoint[] {
  const positives = scored.filter((s) => s.actual).length;
  const negatives = scored.length - positives;
  if (positives === 0 || negatives === 0) {
    return [
      { fpr: 0, tpr: 0, threshold: 1 },
      { fpr: 1, tpr: 1, threshold: 0 },
    ];
  }

  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const points: RocPoint[] = [
    { fpr: 0, tpr: 0, threshold: Number.POSITIVE_INFINITY },
  ];

  let tp = 0;
  let fp = 0;
  let i = 0;
  while (i < sorted.length) {
    const value = sorted[i].score;
    while (i < sorted.length && sorted[i].score === value) {
      if (sorted[i].actual) tp++;
      else fp++;
      i++;
    }
    points.push({ fpr: fp / negatives, tpr: tp / positives, threshold: value });
  }

  return points;
}

/** ROC を台形で積分した AUC(曲線を経由する経路) */
export function aucFromRoc(points: readonly RocPoint[]): number {
  let area = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].fpr - points[i - 1].fpr;
    area += (dx * (points[i].tpr + points[i - 1].tpr)) / 2;
  }
  return area;
}

/**
 * 順位対を総当たりして求めた AUC(曲線を経由しない経路)。
 * Mann-Whitney U 統計量そのもので、同点は 0.5 とする。
 *
 * `aucFromRoc(rocCurve(s))` と恒等的に等しい。実装が曲線の作り方を
 * 間違えれば合わなくなるので、これが F-09 のオラクルになる(T-076)。
 */
export function aucByRanking(scored: readonly Scored[]): number {
  const pos = scored.filter((s) => s.actual);
  const neg = scored.filter((s) => !s.actual);
  if (pos.length === 0 || neg.length === 0) return 0.5;

  let wins = 0;
  for (const p of pos) {
    for (const n of neg) {
      if (p.score > n.score) wins += 1;
      else if (p.score === n.score) wins += 0.5;
    }
  }
  return wins / (pos.length * neg.length);
}

/**
 * 工数への換算の前提。
 *
 * **模擬ラインの中で閉じる。** 一度、率だけを模擬基板から取り、検査点数と
 * 不良率は実機相当の値(1,200 点/枚・800 ppm)を使う組み方にしたところ、
 * 目視再検査が 8,993 時間/月 という桁の壊れた数字になった。模擬基板の
 * 過検出率(16.7%)は実機より二桁高いので、実機の点数に掛けてはならない。
 *
 * したがって検査点数は**この模擬基板そのもの**(48 点/枚)を使い、
 * 「この模擬ラインを月 1,800 枚流したら」という条件つきの数字として出す。
 * 絶対値ではなく、しきい値を動かしたときの増減を読むための数字である。
 */
export const WORKLOAD_ASSUMPTIONS = {
  /** 月産枚数 */
  boardsPerMonth: 1800,
  /** 過検出 1 件を目視で確かめるのにかかる時間(分) */
  recheckMinutes: 1.5,
} as const;

export type Workload = {
  /** 過検出率(良品を不良と判定する割合) */
  falseAlarmRate: number;
  /** 見逃し率(不良を良品と判定する割合) */
  missRate: number;
  /** 検出率(不良を捕まえる割合) */
  detectionRate: number;
  /** 月あたりの過検出件数(この模擬ラインを月産枚数だけ流したとき) */
  falseAlarmsPerMonth: number;
  /** 月あたりの目視再検査時間 */
  recheckHoursPerMonth: number;
};

export function workload(c: Confusion): Workload {
  const { boardsPerMonth, recheckMinutes } = WORKLOAD_ASSUMPTIONS;

  const negatives = c.fp + c.tn;
  const positives = c.tp + c.fn;
  const falseAlarmRate = negatives === 0 ? 0 : c.fp / negatives;
  const missRate = positives === 0 ? 0 : c.fn / positives;

  // 率ではなく件数を掛ける。率の出所も点数の出所も同じ模擬基板なので桁が壊れない
  const falseAlarmsPerMonth = c.fp * boardsPerMonth;

  return {
    falseAlarmRate,
    missRate,
    detectionRate: positives === 0 ? 1 : c.tp / positives,
    falseAlarmsPerMonth,
    recheckHoursPerMonth: (falseAlarmsPerMonth * recheckMinutes) / 60,
  };
}
