import { describe, expect, it } from "vitest";
import {
  FEEDER_MINUTES,
  SETUP_FIXED_MINUTES,
  buildGantt,
  bruteForceBest,
  fifo,
  generateJobs,
  greedy,
  localSearch,
  scheduleCost,
  setupMinutes,
  type Job,
} from "./schedule";

/*
  オラクルは全順列の総当たり(T-094)。n=7 なら 5,040 通りなので厳密解が求まる。
  発見的解法が最適解を「下回る」ことは原理的にありえないので、
  下回ったらコスト関数が二経路で食い違っている——実装が壊れている。
*/

const JOBS = generateJobs(21, 12);
const SMALL = generateJobs(5, 7);

describe("ジョブの生成(T-090 / N-03)", () => {
  it("T-090 同じ種で 2 回生成して完全に一致する", () => {
    expect(JSON.stringify(generateJobs(21, 12))).toBe(
      JSON.stringify(generateJobs(21, 12)),
    );
  });

  it("種が違えば違うジョブ表になる", () => {
    expect(JSON.stringify(generateJobs(21, 12))).not.toBe(
      JSON.stringify(generateJobs(22, 12)),
    );
  });

  it("ID が一意で、指定した件数だけ作られる", () => {
    expect(JOBS.length).toBe(12);
    expect(new Set(JOBS.map((j) => j.id)).size).toBe(12);
  });

  it("どのジョブも部品を 1 種類以上使い、加工時間と納期が正である", () => {
    for (const j of JOBS) {
      expect(j.parts.length, j.id).toBeGreaterThan(0);
      expect(j.processMinutes, j.id).toBeGreaterThan(0);
      expect(j.dueMinutes, j.id).toBeGreaterThan(0);
    }
  });
});

describe("段取り時間(T-091 / T-092 / F-10)", () => {
  const a: Job["parts"] = ["R1", "C1", "U1", "L1"];
  const b: Job["parts"] = ["R1", "C1", "U2", "D1"];

  it("T-091 固定時間 + 対称差の本数 × 1 本あたり時間に一致する", () => {
    // 対称差: U1, L1(外す)と U2, D1(載せる)の 4 本
    expect(setupMinutes(a, b)).toBe(SETUP_FIXED_MINUTES + 4 * FEEDER_MINUTES);
  });

  it("T-092 部品構成が同じなら段取りは固定時間だけになる", () => {
    expect(setupMinutes(a, a)).toBe(SETUP_FIXED_MINUTES);
    for (const j of JOBS) {
      expect(setupMinutes(j.parts, j.parts), j.id).toBe(SETUP_FIXED_MINUTES);
    }
  });

  it("T-092 対称であり、非負である", () => {
    for (const x of JOBS) {
      for (const y of JOBS) {
        expect(setupMinutes(x.parts, y.parts)).toBe(
          setupMinutes(y.parts, x.parts),
        );
        expect(setupMinutes(x.parts, y.parts)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("最初のジョブは空の機械からの段取りになる(全部載せる)", () => {
    expect(setupMinutes([], a)).toBe(
      SETUP_FIXED_MINUTES + a.length * FEEDER_MINUTES,
    );
  });
});

describe("原価とガント(T-093 / T-096 / T-097 / F-10)", () => {
  it("T-093 逐次加算した総時間とガントの最終終了時刻が一致する", () => {
    for (const w of [0, 0.5, 1]) {
      const order = greedy(JOBS, w);
      const cost = scheduleCost(order, w);
      const gantt = buildGantt(order);
      const last = gantt[gantt.length - 1];
      expect(cost.makespanMinutes, `重み ${w}`).toBe(last.end);
    }
  });

  it("T-096 ガントの区間が連続し、重ならない", () => {
    const gantt = buildGantt(greedy(JOBS, 0.5));
    let cursor = 0;
    for (const seg of gantt) {
      expect(seg.setupStart, seg.jobId).toBe(cursor);
      expect(seg.processStart, seg.jobId).toBeGreaterThanOrEqual(
        seg.setupStart,
      );
      expect(seg.end, seg.jobId).toBeGreaterThan(seg.processStart);
      cursor = seg.end;
    }
  });

  it("T-097 納期遵守数がガントからと完了時刻からで一致する", () => {
    const order = greedy(JOBS, 0.5);
    const cost = scheduleCost(order, 0.5);
    const fromGantt = buildGantt(order).filter((seg) => {
      const job = order.find((j) => j.id === seg.jobId)!;
      return seg.end <= job.dueMinutes;
    }).length;
    expect(cost.onTimeCount).toBe(fromGantt);
  });

  it("T-099 どの解法の出力も入力ジョブの並べ替えである", () => {
    const ids = [...JOBS.map((j) => j.id)].sort();
    for (const order of [
      fifo(JOBS),
      greedy(JOBS, 0.5),
      localSearch(JOBS, 0.5),
    ]) {
      expect([...order.map((j) => j.id)].sort()).toEqual(ids);
    }
  });
});

describe("最適化(T-094 / T-095 / T-098 / F-10)", () => {
  it("T-094 発見的解法が全順列総当たりの最適解を下回らない", () => {
    // 下回ったら、コスト関数が総当たり側と解法側で食い違っている。
    for (let seed = 0; seed < 12; seed++) {
      const jobs = generateJobs(seed, 7);
      for (const w of [0, 0.35, 0.7, 1]) {
        const best = scheduleCost(bruteForceBest(jobs, w), w).objective;
        for (const [name, order] of [
          ["FIFO", fifo(jobs)],
          ["貪欲法", greedy(jobs, w)],
          ["局所探索", localSearch(jobs, w)],
        ] as const) {
          const got = scheduleCost(order, w).objective;
          expect(
            got,
            `種 ${seed} 重み ${w} ${name}: ${got.toFixed(2)} < 最適 ${best.toFixed(2)}`,
          ).toBeGreaterThanOrEqual(best - 1e-9);
        }
      }
    }
  });

  it("T-095 局所探索が貪欲法を悪化させない", () => {
    for (let seed = 0; seed < 20; seed++) {
      const jobs = generateJobs(seed, 10);
      for (const w of [0, 0.5, 1]) {
        const g = scheduleCost(greedy(jobs, w), w).objective;
        const l = scheduleCost(localSearch(jobs, w), w).objective;
        expect(l, `種 ${seed} 重み ${w}`).toBeLessThanOrEqual(g + 1e-9);
      }
    }
  });

  it("T-098 重み 0 の最適解は段取り最小、重み 1 の最適解は遅れ最小になる", () => {
    for (let seed = 0; seed < 8; seed++) {
      const jobs = generateJobs(seed, 6);
      const perms = allOrders(jobs);

      const bySetup = Math.min(
        ...perms.map((p) => scheduleCost(p, 0).setupMinutes),
      );
      expect(scheduleCost(bruteForceBest(jobs, 0), 0).setupMinutes).toBe(
        bySetup,
      );

      const byTardiness = Math.min(
        ...perms.map((p) => scheduleCost(p, 1).tardinessMinutes),
      );
      expect(scheduleCost(bruteForceBest(jobs, 1), 1).tardinessMinutes).toBe(
        byTardiness,
      );
    }
  });

  it("局所探索は少なくとも半分の場合で最適解に届く(実用の目安)", () => {
    // 「必ず最適」を要求すると局所探索ではなくなる。届く割合を記録して固定する。
    let hit = 0;
    let total = 0;
    for (let seed = 0; seed < 20; seed++) {
      const jobs = generateJobs(seed, 7);
      for (const w of [0, 0.5, 1]) {
        const best = scheduleCost(bruteForceBest(jobs, w), w).objective;
        const got = scheduleCost(localSearch(jobs, w), w).objective;
        if (Math.abs(got - best) < 1e-9) hit++;
        total++;
      }
    }
    // 実測値を毎回出す。閾値だけだと「ぎりぎり通っている」のか
    // 「余裕で通っている」のかが分からない。
    console.log(
      `局所探索が最適解に一致した割合: ${hit}/${total}(${((hit / total) * 100).toFixed(0)}%)`,
    );
    expect(hit / total, `${hit}/${total} が最適に一致`).toBeGreaterThanOrEqual(
      0.5,
    );
  });
});

/** テスト用の全順列。実装側の総当たりとは別に、ここでも独立に作る */
function allOrders(jobs: Job[]): Job[][] {
  if (jobs.length <= 1) return [jobs];
  const out: Job[][] = [];
  for (let i = 0; i < jobs.length; i++) {
    const rest = [...jobs.slice(0, i), ...jobs.slice(i + 1)];
    for (const tail of allOrders(rest)) out.push([jobs[i], ...tail]);
  }
  return out;
}

describe("綱引きが実在すること(T-100 / F-10)", () => {
  /*
    一度、納期を総所要と無関係に振ったせいで遅れが常に 0 になり、
    重みのつまみが何も動かさないデモになった(loop_004 の GEN-LOGIC)。
    「重みを振れば解が変わる」ことをテストで固定する。
  */
  it("T-100 受注順のままだと、必ずどれかのジョブが納期に落ちる", () => {
    for (let seed = 0; seed < 20; seed++) {
      const jobs = generateJobs(seed, 10);
      const cost = scheduleCost(fifo(jobs), 0.5);
      expect(
        cost.onTimeCount,
        `種 ${seed}: ${cost.onTimeCount}/${jobs.length} が納期内`,
      ).toBeLessThan(jobs.length);
    }
  });

  it("T-100 重み 0 と重み 1 で、選ばれる投入順が変わる", () => {
    let differ = 0;
    for (let seed = 0; seed < 20; seed++) {
      const jobs = generateJobs(seed, 7);
      const bySetup = bruteForceBest(jobs, 0).map((j) => j.id).join();
      const byDue = bruteForceBest(jobs, 1).map((j) => j.id).join();
      if (bySetup !== byDue) differ++;
    }
    // 全部で変わる必要はないが、大半で変わらないなら綱引きが無い
    expect(differ, `20 種中 ${differ} 種で順序が変わる`).toBeGreaterThanOrEqual(
      16,
    );
  });

  it("T-100 段取り最小の解は、納期優先の解より遅れが大きい傾向にある", () => {
    let worse = 0;
    for (let seed = 0; seed < 20; seed++) {
      const jobs = generateJobs(seed, 7);
      const setupFirst = scheduleCost(bruteForceBest(jobs, 0), 0);
      const dueFirst = scheduleCost(bruteForceBest(jobs, 1), 1);
      if (setupFirst.tardinessMinutes > dueFirst.tardinessMinutes) worse++;
    }
    expect(worse, `20 種中 ${worse} 種で成立`).toBeGreaterThanOrEqual(16);
  });
});
