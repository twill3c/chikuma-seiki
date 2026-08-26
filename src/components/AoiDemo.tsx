"use client";

import { useMemo, useState } from "react";
import { generateBoard, DEFECT_LABEL } from "@/lib/board";
import {
  INSPECTOR_LABEL,
  WORKLOAD_ASSUMPTIONS,
  aucByRanking,
  confusion,
  rocCurve,
  scoreAll,
  workload,
  type Inspector,
} from "@/lib/aoi";
import { BoardView } from "./BoardView";
import { RocChart } from "./RocChart";

/**
 * AOI × AI 判定シミュレータ(F-09)。この作品の目玉。
 *
 * 計算はすべて src/lib/aoi.ts の純関数に置いてあり、ここは操作と表示だけを持つ(N-04)。
 * しきい値を動かすと見逃しと過検出が入れ替わり、検査器を切り替えると
 * 曲線そのものが動く——この二つが別の話であることを見せるのが目的。
 */

const DEFECT_COUNT = 6;
const COLOR: Record<Inspector, string> = {
  rule: "var(--color-usu)",
  ai: "var(--color-do)",
};

export function AoiDemo() {
  const [seed, setSeed] = useState(11);
  const [inspector, setInspector] = useState<Inspector>("rule");
  const [threshold, setThreshold] = useState(0.5);

  const model = useMemo(() => {
    const board = generateBoard(seed, DEFECT_COUNT);
    const rule = scoreAll(board, "rule", seed);
    const ai = scoreAll(board, "ai", seed);
    return {
      board,
      scored: { rule, ai },
      roc: { rule: rocCurve(rule), ai: rocCurve(ai) },
      auc: { rule: aucByRanking(rule), ai: aucByRanking(ai) },
    };
  }, [seed]);

  const scored = model.scored[inspector];
  const c = confusion(scored, threshold);
  const w = workload(c);

  const other: Inspector = inspector === "rule" ? "ai" : "rule";
  const otherW = workload(confusion(model.scored[other], threshold));
  // 相手に替えたときの増減。負なら減る。符号の向きを取り違えると意味が逆になる
  const hoursDelta = otherW.recheckHoursPerMonth - w.recheckHoursPerMonth;

  const missed = scored.filter((s) => s.actual && s.score < threshold);

  return (
    <div className="space-y-6">
      {/* 操作 */}
      <div className="panel flex flex-wrap items-center gap-x-8 gap-y-4 p-5">
        <div className="flex items-center gap-2">
          <span className="text-xs tracking-[0.2em] text-do">検査器</span>
          <div className="flex overflow-hidden rounded-sm border border-suji">
            {(["rule", "ai"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setInspector(k)}
                aria-pressed={inspector === k}
                className={
                  inspector === k
                    ? "bg-suji px-3 py-1.5 text-xs text-hakuro"
                    : "px-3 py-1.5 text-xs text-usu hover:text-hakuro"
                }
              >
                {INSPECTOR_LABEL[k]}
              </button>
            ))}
          </div>
        </div>

        <label className="flex min-w-64 flex-1 items-center gap-3">
          <span className="whitespace-nowrap text-xs tracking-[0.2em] text-do">
            判定しきい値
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="h-1 flex-1 accent-do"
          />
          <span className="tabular w-10 text-right text-sm text-hakuro">
            {threshold.toFixed(2)}
          </span>
        </label>

        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          className="rounded-sm border border-suji px-3 py-1.5 text-xs text-usu hover:border-do hover:text-hakuro"
        >
          別の基板を流す
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <BoardView
            scored={scored}
            threshold={threshold}
            className="w-full rounded-sm"
          />
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-usu">
            <Legend color="var(--color-akane)">不良を捕まえた</Legend>
            <Legend color="var(--color-do)">良品を弾いた(再検査へ回る)</Legend>
            <Legend color="var(--color-ban)" dashed>
              見逃した(流出する)
            </Legend>
            <Legend color="var(--color-seiji)">良品を通した</Legend>
          </ul>
        </div>

        <div className="space-y-5">
          {/* 混同行列 */}
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-suji bg-suji">
            <Cell label="捕まえた不良" value={c.tp} tone="ok" />
            <Cell label="見逃した不良" value={c.fn} tone="bad" />
            <Cell label="弾いた良品" value={c.fp} tone="warn" />
            <Cell label="通した良品" value={c.tn} tone="ok" />
          </div>

          <RocChart
            className="w-full max-w-72"
            curves={[
              {
                id: "rule",
                label: INSPECTOR_LABEL.rule,
                color: COLOR.rule,
                points: model.roc.rule,
              },
              {
                id: "ai",
                label: INSPECTOR_LABEL.ai,
                color: COLOR.ai,
                points: model.roc.ai,
              },
            ]}
            markers={[
              {
                id: inspector,
                color: COLOR[inspector],
                fpr: w.falseAlarmRate,
                tpr: 1 - w.missRate,
              },
            ]}
          />

          {/*
            凡例の色は曲線の色そのものを使う。別々に決めると図と対応が崩れる(HC-039)。
          */}
          <dl className="space-y-1 text-xs text-usu">
            {(["rule", "ai"] as const).map((k) => (
              <div key={k} className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2">
                  <span
                    className="inline-block h-0.5 w-4"
                    style={{ backgroundColor: COLOR[k] }}
                  />
                  AUC — {INSPECTOR_LABEL[k]}
                </dt>
                <dd className="tabular" style={{ color: COLOR[k] }}>
                  {model.auc[k].toFixed(3)}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-[0.7rem] leading-relaxed text-usu">
            AUC は曲線の下の面積。しきい値を動かしても曲線は動きません
            ——動くのは曲線上の一点です。しきい値の調整と検査器の性能は別の話で、
            AI 併用が動かしているのは曲線の方です。
          </p>
        </div>
      </div>

      {/* 工数への換算 */}
      <div className="panel p-6">
        <h3 className="text-xs tracking-[0.25em] text-do">現場に出る形</h3>
        <div className="mt-5 grid gap-6 sm:grid-cols-3">
          <Figure
            value={w.recheckHoursPerMonth.toFixed(0)}
            unit="時間 / 月"
            label="目視再検査に取られる時間"
          />
          <Figure
            value={(w.missRate * 100).toFixed(1)}
            unit="%"
            label="不良を見逃す割合"
            tone="bad"
          />
          <Figure
            value={`${hoursDelta > 0 ? "+" : hoursDelta < 0 ? "−" : "±"}${Math.abs(hoursDelta).toFixed(0)}`}
            unit="時間 / 月"
            label={`${INSPECTOR_LABEL[other]}に替えたときの増減`}
            tone={hoursDelta <= 0 ? "ok" : "warn"}
          />
        </div>

        <p className="mt-6 text-xs leading-relaxed text-usu">
          換算の前提:{" "}
          <span className="text-hanare">この模擬ライン</span>
          (上の基板と同じ {model.board.length} 点/枚)を月{" "}
          {WORKLOAD_ASSUMPTIONS.boardsPerMonth.toLocaleString()} 枚 流し、
          過検出 1 件の目視確認に {WORKLOAD_ASSUMPTIONS.recheckMinutes} 分かかるとした場合。
          模擬基板の不良率({DEFECT_COUNT}/{model.board.length})は実機より二桁高く
          設定してあるので、<span className="text-hanare">絶対値ではなく、
          しきい値を動かしたときの増減</span>を見てください。
        </p>

        {missed.length > 0 && (
          <p className="mt-4 border-t border-suji pt-4 text-xs leading-relaxed text-usu">
            いま見逃しているのは{" "}
            <span className="text-akane">
              {missed
                .map((m) => `${m.part.id}(${DEFECT_LABEL[m.part.defect!]})`)
                .join("、")}
            </span>
            。しきい値を下げれば捕まりますが、そのぶん良品を弾きます。
          </p>
        )}
      </div>
    </div>
  );
}

function Legend({
  color,
  dashed,
  children,
}: {
  color: string;
  dashed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        className="inline-block h-3 w-3 rounded-xs"
        style={{
          backgroundColor: color,
          border: dashed ? "1.5px dashed var(--color-akane)" : "none",
        }}
      />
      {children}
    </li>
  );
}

function Cell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "bad" | "warn";
}) {
  const color =
    tone === "bad" ? "text-akane" : tone === "warn" ? "text-do" : "text-hakuro";
  return (
    <div className="bg-ban px-4 py-4">
      <p className={`tabular text-2xl ${color}`}>{value}</p>
      <p className="mt-1 text-[0.7rem] leading-snug text-usu">{label}</p>
    </div>
  );
}

function Figure({
  value,
  unit,
  label,
  tone = "ok",
}: {
  value: string;
  unit: string;
  label: string;
  tone?: "ok" | "bad" | "warn";
}) {
  const color =
    tone === "bad" ? "text-akane" : tone === "warn" ? "text-do" : "text-hakuro";
  return (
    <div>
      <p className={`tabular text-2xl ${color}`}>
        {value}
        <span className="ml-1.5 text-xs text-usu">{unit}</span>
      </p>
      <p className="mt-1 text-xs text-usu">{label}</p>
    </div>
  );
}
