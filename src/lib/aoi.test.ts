import { describe, expect, it } from "vitest";
import { generateBoard } from "./board";
import {
  aucByRanking,
  aucFromRoc,
  confusion,
  rocCurve,
  scoreAll,
  workload,
  WORKLOAD_ASSUMPTIONS,
} from "./aoi";

/*
  オラクルの中心は AUC の二経路一致(T-076)。
  ROC 曲線を台形で積分した AUC と、曲線を経由せず順位対を総当たりして求めた
  AUC(Mann-Whitney U)は恒等的に等しい。実装が曲線の作り方を間違えれば合わなくなる。
  同じ関数を二度呼ぶ「再計算」は検算にならない。
*/

const BOARD = generateBoard(11, 6);
const RULE = scoreAll(BOARD, "rule", 11);
const AI = scoreAll(BOARD, "ai", 11);

describe("混同行列(T-073〜T-075 / F-09)", () => {
  it("T-073 四つの升目の和が部品数に一致する", () => {
    for (const t of [0.1, 0.35, 0.5, 0.72, 0.95]) {
      const c = confusion(RULE, t);
      expect(c.tp + c.fp + c.fn + c.tn, `しきい値 ${t}`).toBe(RULE.length);
    }
  });

  it("T-073 行和が真の不良数・真の良品数に一致する", () => {
    const positives = RULE.filter((s) => s.actual).length;
    const negatives = RULE.length - positives;
    for (const t of [0.1, 0.5, 0.9]) {
      const c = confusion(RULE, t);
      expect(c.tp + c.fn, `しきい値 ${t}`).toBe(positives);
      expect(c.fp + c.tn, `しきい値 ${t}`).toBe(negatives);
    }
  });

  it("T-074 しきい値を上げると tp も fp も単調非増加になる", () => {
    let prev = confusion(RULE, 0);
    for (let t = 0.02; t <= 1.0001; t += 0.02) {
      const c = confusion(RULE, t);
      expect(c.tp, `しきい値 ${t.toFixed(2)}`).toBeLessThanOrEqual(prev.tp);
      expect(c.fp, `しきい値 ${t.toFixed(2)}`).toBeLessThanOrEqual(prev.fp);
      prev = c;
    }
  });

  it("T-075 しきい値 0 で全数を不良判定、1 超で全数を良品判定にする", () => {
    const positives = RULE.filter((s) => s.actual).length;
    const all = confusion(RULE, 0);
    expect(all.tp + all.fp).toBe(RULE.length);
    expect(all.tp).toBe(positives);

    const none = confusion(RULE, 1.0000001);
    expect(none.tp + none.fp).toBe(0);
    expect(none.fn).toBe(positives);
  });
});

describe("ROC と AUC(T-076〜T-078 / F-09)", () => {
  it("T-076 台形積分の AUC と順位対総当たりの AUC が一致する", () => {
    for (const [name, scored] of [
      ["ルールベース", RULE],
      ["AI 併用", AI],
    ] as const) {
      const viaCurve = aucFromRoc(rocCurve(scored));
      const viaRanking = aucByRanking(scored);
      expect(Math.abs(viaCurve - viaRanking), name).toBeLessThan(1e-9);
    }
  });

  it("T-076 基板を変えても二経路が一致し続ける", () => {
    for (let seed = 0; seed < 12; seed++) {
      const board = generateBoard(seed, 5);
      const scored = scoreAll(board, "rule", seed);
      expect(
        Math.abs(aucFromRoc(rocCurve(scored)) - aucByRanking(scored)),
        `種 ${seed}`,
      ).toBeLessThan(1e-9);
    }
  });

  it("T-077 ROC が (0,0) から (1,1) へ単調非減少で至る", () => {
    const roc = rocCurve(RULE);
    expect(roc[0].fpr).toBe(0);
    expect(roc[0].tpr).toBe(0);
    expect(roc[roc.length - 1].fpr).toBe(1);
    expect(roc[roc.length - 1].tpr).toBe(1);
    for (let i = 1; i < roc.length; i++) {
      expect(roc[i].fpr, `点 ${i}`).toBeGreaterThanOrEqual(roc[i - 1].fpr);
      expect(roc[i].tpr, `点 ${i}`).toBeGreaterThanOrEqual(roc[i - 1].tpr);
    }
  });

  it("T-078 AI 併用の AUC がルールベースを下回らない(50 種の基板で)", () => {
    // 「AI の方が賢い」ことの主張ではない。この模型の設計上そうなるように
    // 組んだのだから、そうならなければ模型の実装が壊れている、という不変量。
    // 種を 50 まで広げているのは、たまたま成り立っただけの状態を通さないため。
    for (let seed = 0; seed < 50; seed++) {
      const board = generateBoard(seed, 5);
      const rule = aucByRanking(scoreAll(board, "rule", seed));
      const ai = aucByRanking(scoreAll(board, "ai", seed));
      expect(ai, `種 ${seed}: rule=${rule.toFixed(4)} ai=${ai.toFixed(4)}`).toBeGreaterThanOrEqual(
        rule,
      );
    }
  });

  it("スコアが 0–1 に収まり、真値と対応している", () => {
    for (const s of RULE) {
      expect(s.score, s.part.id).toBeGreaterThanOrEqual(0);
      expect(s.score, s.part.id).toBeLessThanOrEqual(1);
      expect(s.actual).toBe(s.part.defect !== null);
    }
  });
});

describe("工数換算(T-079 / F-09)", () => {
  /*
    最初、このケースを「工数は fp の件数に比例する」と書いていた。
    デモの基板は見やすくするために欠陥を多く仕込んだ模擬基板なので、
    その件数をそのまま月間に掛けると桁が合わない — テストの側が実装を
    非現実的な形に縛っていた(loop_003 の VERIF-FALSE)。

    正しくは、混同行列から取るのは**率**だけである。実際の検査点数と
    不良率は WORKLOAD_ASSUMPTIONS に前提として置く。したがって比例を見るときは
    **良品の総数(fp + tn)を一定に保ったまま** fp を動かす。
  */
  const withFp = (fp: number) => ({ tp: 5, fn: 1, fp, tn: 42 - fp });
  const withFn = (fn: number) => ({ tp: 6 - fn, fn, fp: 3, tn: 39 });

  it("T-079 過検出が 0 なら再検査時間も 0 になる", () => {
    expect(workload(withFp(0)).recheckHoursPerMonth).toBe(0);
    expect(workload(withFp(0)).falseAlarmRate).toBe(0);
  });

  it("AI 併用でも AUC が 1.000 に張り付かない(万能に見せない)", () => {
    // 完璧な分離は ROC を直角にし、実演として嘘になる(loop_003 の GEN-LOGIC)。
    let perfect = 0;
    for (let seed = 0; seed < 50; seed++) {
      const auc = aucByRanking(scoreAll(generateBoard(seed, 6), "ai", seed));
      if (auc >= 0.9999) perfect++;
    }
    expect(perfect, `50 種中 ${perfect} 種が完全分離`).toBeLessThanOrEqual(5);
  });

  it("T-079 再検査時間は過検出件数に比例する(良品総数を一定に保つ)", () => {
    const one = workload(withFp(1));
    const two = workload(withFp(2));
    expect(two.falseAlarmRate).toBeCloseTo(one.falseAlarmRate * 2, 12);
    expect(two.recheckHoursPerMonth).toBeCloseTo(
      one.recheckHoursPerMonth * 2,
      9,
    );
  });

  it("見逃し率と検出率が足して 1 になる", () => {
    const one = workload(withFn(1));
    const three = workload(withFn(3));
    expect(one.missRate + one.detectionRate).toBeCloseTo(1, 12);
    expect(three.missRate).toBeCloseTo(one.missRate * 3, 12);
  });

  it("換算に使う率が混同行列の定義どおりである(別経路で計算し直す)", () => {
    const c = confusion(RULE, 0.5);
    const w = workload(c);
    expect(w.falseAlarmRate).toBeCloseTo(c.fp / (c.fp + c.tn), 12);
    expect(w.missRate).toBeCloseTo(c.fn / (c.tp + c.fn), 12);
  });

  it("月間の過検出件数が、前提値から手で組み直した値と一致する", () => {
    const w = workload(withFp(3));
    const a = WORKLOAD_ASSUMPTIONS;
    expect(w.falseAlarmsPerMonth).toBe(3 * a.boardsPerMonth);
    expect(w.recheckHoursPerMonth).toBeCloseTo(
      (3 * a.boardsPerMonth * a.recheckMinutes) / 60,
      9,
    );
  });

  it("換算した数字が現場で口に出せる桁に収まる(模擬ラインの条件つき)", () => {
    /*
      一度、模擬基板の過検出率を実機相当の検査点数に掛けて
      8,993 時間/月 という桁の壊れた数字を出した(loop_003 の GEN-LOGIC)。
      率の出所と点数の出所を混ぜたのが原因。上限は「模擬ラインを月産枚数だけ
      流し、全点を過検出した」極端値であり、そこを超えたら換算が壊れている。
    */
    const a = WORKLOAD_ASSUMPTIONS;
    const board = generateBoard(11, 6);
    const worst = (board.length * a.boardsPerMonth * a.recheckMinutes) / 60;
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const hours = workload(confusion(RULE, t)).recheckHoursPerMonth;
      expect(hours, `しきい値 ${t}`).toBeLessThanOrEqual(worst);
      expect(hours, `しきい値 ${t}`).toBeGreaterThanOrEqual(0);
    }
  });

  it("前提の数値が公開されている(数字の出所が辿れる)", () => {
    for (const [key, value] of Object.entries(WORKLOAD_ASSUMPTIONS)) {
      expect(value, key).toBeGreaterThan(0);
    }
  });
});
