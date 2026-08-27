"use client";

import { useMemo, useState } from "react";
import {
  BRUTE_FORCE_LIMIT,
  FEEDER_MINUTES,
  SETUP_FIXED_MINUTES,
  buildGantt,
  bruteForceBest,
  fifo,
  generateJobs,
  greedy,
  localSearch,
  scheduleCost,
  type Job,
} from "@/lib/schedule";
import { GanttChart } from "./GanttChart";

/**
 * 段取り替えつき生産計画のデモ(F-10)。
 *
 * 投入順を変えるだけで、一日に作れる枚数が変わる。
 * 段取りを詰めれば納期の遠い機種から流すことになり、遅れが増える——
 * この綱引きを重みのつまみで動かせるようにしてある。
 *
 * 計算はすべて src/lib/schedule.ts の純関数(N-04)。
 */

type Method = "fifo" | "greedy" | "local" | "brute";

const METHOD_LABEL: Record<Method, string> = {
  fifo: "受注順",
  greedy: "貪欲法",
  local: "局所探索",
  brute: "総当たり(厳密解)",
};

const METHOD_NOTE: Record<Method, string> = {
  fifo: "届いた順にそのまま流します。何も工夫しない基準線です。",
  greedy: "いま載っている構成から、次の一手が最も安いジョブを選び続けます。現場が手で組むときの考え方に近いやり方です。",
  local: "貪欲法の解から始めて、二点交換と一点移動で改善が無くなるまで回します。最適は保証しませんが、実用にはこれで足ります。",
  brute: "全ての投入順を試して最良を選びます。これが正解です。ただし n! なので、9 件を超えると現実的な時間では終わりません。",
};

export function ScheduleDemo() {
  const [seed, setSeed] = useState(21);
  const [count, setCount] = useState(8);
  const [weight, setWeight] = useState(0.4);
  const [method, setMethod] = useState<Method>("fifo");

  const jobs = useMemo(() => generateJobs(seed, count), [seed, count]);
  const bruteAvailable = count <= BRUTE_FORCE_LIMIT;

  const results = useMemo(() => {
    const solve = (m: Method): Job[] => {
      if (m === "fifo") return fifo(jobs);
      if (m === "greedy") return greedy(jobs, weight);
      if (m === "local") return localSearch(jobs, weight);
      return bruteForceBest(jobs, weight);
    };
    const methods: Method[] = bruteAvailable
      ? ["fifo", "greedy", "local", "brute"]
      : ["fifo", "greedy", "local"];
    return methods.map((m) => {
      const order = solve(m);
      return { method: m, order, cost: scheduleCost(order, weight) };
    });
  }, [jobs, weight, bruteAvailable]);

  const active = method === "brute" && !bruteAvailable ? "local" : method;
  const current = results.find((r) => r.method === active) ?? results[0];
  const baseline = results[0];
  const gantt = buildGantt(current.order);

  const setupSaved = baseline.cost.setupMinutes - current.cost.setupMinutes;

  return (
    <div className="space-y-6">
      {/* 操作 */}
      <div className="panel space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-[0.2em] text-do">組み方</span>
            <div className="flex flex-wrap overflow-hidden rounded-sm border border-suji">
              {(["fifo", "greedy", "local", "brute"] as const).map((m) => {
                const disabled = m === "brute" && !bruteAvailable;
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={disabled}
                    onClick={() => setMethod(m)}
                    aria-pressed={active === m}
                    className={
                      disabled
                        ? "px-3 py-1.5 text-xs text-usu/35"
                        : active === m
                          ? "bg-suji px-3 py-1.5 text-xs text-hakuro"
                          : "px-3 py-1.5 text-xs text-usu hover:text-hakuro"
                    }
                  >
                    {METHOD_LABEL[m]}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2">
            <span className="whitespace-nowrap text-xs tracking-[0.2em] text-do">
              ジョブ数
            </span>
            <input
              type="range"
              min={5}
              max={16}
              step={1}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="h-1 w-28 accent-do"
            />
            <span className="tabular w-6 text-right text-sm text-hakuro">
              {count}
            </span>
          </label>

          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="rounded-sm border border-suji px-3 py-1.5 text-xs text-usu hover:border-do hover:text-hakuro"
          >
            別の週の受注にする
          </button>
        </div>

        <label className="flex flex-wrap items-center gap-3">
          <span className="whitespace-nowrap text-xs tracking-[0.2em] text-do">
            何を優先するか
          </span>
          <span className="text-xs text-usu">段取りを詰める</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="h-1 min-w-40 flex-1 accent-do"
          />
          <span className="text-xs text-usu">納期を守る</span>
          <span className="tabular w-10 text-right text-sm text-hakuro">
            {weight.toFixed(2)}
          </span>
        </label>

        {!bruteAvailable && (
          <p className="text-xs leading-relaxed text-usu">
            総当たりは {BRUTE_FORCE_LIMIT} 件までです。
            <span className="tabular text-hanare">
              {" "}
              {count} 件の投入順は {factorialText(count)} 通り
            </span>
            {" "}あり、全部試すことはできません。ここから先は
            「最適か分からないが十分よい解」を取るしかない、というのがこの問題の性格です。
          </p>
        )}
      </div>

      {/* 手法の比較 */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-suji text-left text-xs tracking-wider text-do">
              <th className="py-2 pr-4 font-normal">組み方</th>
              <th className="py-2 pr-4 text-right font-normal">段取り合計</th>
              <th className="py-2 pr-4 text-right font-normal">総所要</th>
              <th className="py-2 pr-4 text-right font-normal">遅れ合計</th>
              <th className="py-2 text-right font-normal">納期内</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {results.map((r) => (
              <tr
                key={r.method}
                onClick={() => setMethod(r.method)}
                className={
                  r.method === active
                    ? "cursor-pointer border-b border-suji/60 bg-ban text-hakuro"
                    : "cursor-pointer border-b border-suji/60 text-usu hover:text-hakuro"
                }
              >
                <td className="py-2 pr-4">{METHOD_LABEL[r.method]}</td>
                <td className="py-2 pr-4 text-right">
                  {Math.round(r.cost.setupMinutes)} 分
                </td>
                <td className="py-2 pr-4 text-right">
                  {(r.cost.makespanMinutes / 60).toFixed(1)} h
                </td>
                <td className="py-2 pr-4 text-right">
                  {formatMinutes(r.cost.tardinessMinutes)}
                </td>
                <td className="py-2 text-right">
                  {r.cost.onTimeCount} / {jobs.length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs leading-relaxed text-usu">
        {METHOD_NOTE[active]}
        {setupSaved > 0 && (
          <>
            {" "}
            受注順に流すのと比べて、段取りが
            <span className="text-hanare"> {Math.round(setupSaved)} 分</span>{" "}
            減っています。
          </>
        )}
      </p>

      {/* ガント */}
      <div className="space-y-3">
        <GanttChart
          order={current.order}
          gantt={gantt}
          makespan={current.cost.makespanMinutes}
          className="w-full"
        />
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-usu">
          <Legend color="var(--color-do)">段取り替え</Legend>
          <Legend color="var(--color-seiji)">加工(納期内)</Legend>
          <Legend color="var(--color-akane)">加工(納期遅れ)</Legend>
          <Legend dashed>納期</Legend>
        </ul>
      </div>

      <p className="text-xs leading-relaxed text-usu">
        段取り時間の決め方: 固定 {SETUP_FIXED_MINUTES} 分 ＋ 載せ替えるフィーダ 1 本につき{" "}
        {FEEDER_MINUTES} 分。前の機種と部品構成が近ければ載せ替えが減るので、
        <span className="text-hanare">似た機種を続けて流すほど段取りは短くなります</span>。
        ただしそれは納期の順番とは無関係なので、詰めるほど遅れが出ます。
      </p>
    </div>
  );
}

/**
 * 遅れの表示。時間に丸めるだけだと、20 分の遅れが「0 h」になって
 * 遅れが無いように読める。1 時間未満は分のまま出す。
 */
function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "なし";
  if (minutes < 60) return `${Math.round(minutes)} 分`;
  return `${(minutes / 60).toFixed(1)} h`;
}

function factorialText(n: number): string {
  let value = 1;
  for (let i = 2; i <= n; i++) value *= i;
  return value.toExponential(1).replace("e+", " × 10^");
}

function Legend({
  color,
  dashed,
  children,
}: {
  color?: string;
  dashed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        className="inline-block h-3 w-3 rounded-xs"
        style={
          dashed
            ? { borderLeft: "2px dashed var(--color-hakuro)" }
            : { backgroundColor: color }
        }
      />
      {children}
    </li>
  );
}
