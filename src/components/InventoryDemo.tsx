"use client";

import { useMemo, useState } from "react";
import {
  PARTS,
  inventoryPlan,
  safetyStock,
  type Part,
} from "@/lib/inventory";

/**
 * 部品の欠品リスクと安全在庫のデモ(F-11)。
 *
 * 主題は一本の式。安全在庫は `z · σ · √L` で、
 * **リードタイムの平方根**に比例する。納期が 4 倍になっても在庫は 2 倍で済むが、
 * 逆に言えば納期の長い部品ほど、在庫で吸収する費用が跳ね上がる。
 *
 * 計算はすべて src/lib/inventory.ts の純関数(N-04)。
 */

const LEVELS = [0.9, 0.95, 0.98, 0.99, 0.995, 0.999] as const;
const SEED = 31;

export function InventoryDemo() {
  const [partId, setPartId] = useState(PARTS[0].id);
  const [level, setLevel] = useState(0.95);

  const part = PARTS.find((p) => p.id === partId)!;
  const plan = useMemo(
    () => inventoryPlan(part, level, SEED),
    [part, level],
  );

  // 全部品の在庫金額。納期の差がそのまま金額の差になる
  const allValues = PARTS.map((p) => ({
    part: p,
    value: safetyStock(level, p.weeklySd, p.leadTimeWeeks) * p.unitCost,
  }));
  const maxValue = Math.max(...allValues.map((v) => v.value));

  return (
    <div className="space-y-6">
      {/* 操作 */}
      <div className="panel space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs tracking-[0.2em] text-do">部品</span>
          <div className="flex flex-wrap overflow-hidden rounded-sm border border-suji">
            {PARTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPartId(p.id)}
                aria-pressed={p.id === partId}
                className={
                  p.id === partId
                    ? "bg-suji px-3 py-1.5 text-xs text-hakuro"
                    : "px-3 py-1.5 text-xs text-usu hover:text-hakuro"
                }
              >
                {p.name}
              </button>
            ))}
          </div>
          <span className="tabular ml-2 text-xs text-hanare">
            納期 {part.leadTimeWeeks} 週
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs tracking-[0.2em] text-do">
            欠品させない確率
          </span>
          <div className="flex flex-wrap overflow-hidden rounded-sm border border-suji">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                aria-pressed={l === level}
                className={
                  l === level
                    ? "tabular bg-suji px-3 py-1.5 text-xs text-hakuro"
                    : "tabular px-3 py-1.5 text-xs text-usu hover:text-hakuro"
                }
              >
                {(l * 100).toFixed(l >= 0.995 ? 1 : 0)}%
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs leading-relaxed text-usu">{part.note}</p>
      </div>

      {/* 数字 */}
      <div className="grid gap-px overflow-hidden rounded-sm border border-suji bg-suji sm:grid-cols-2 lg:grid-cols-4">
        <Figure
          label="安全在庫"
          value={Math.round(plan.safety).toLocaleString("en-US")}
          unit="個"
        />
        <Figure
          label="発注点"
          value={Math.round(plan.reorder).toLocaleString("en-US")}
          unit="個"
        />
        <Figure
          label="安全在庫として寝る金額"
          value={formatYen(plan.value).value}
          unit={formatYen(plan.value).unit}
          tone="warn"
        />
        <Figure
          label="欠品するサイクルの割合"
          value={(plan.measuredStockoutRate * 100).toFixed(2)}
          unit="%"
          tone="bad"
        />
      </div>

      {/* オラクルの一致をそのまま見せる */}
      <div className="panel p-5">
        <h3 className="text-xs tracking-[0.25em] text-do">
          閉形式と実測が合っているか
        </h3>
        <dl className="tabular mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
          <Row label="閉形式 1 − Φ(z)">
            {(plan.theoreticalStockoutRate * 100).toFixed(2)} %
          </Row>
          <Row label={`実測(${plan.sim.cycles.toLocaleString("en-US")} サイクル)`}>
            {(plan.measuredStockoutRate * 100).toFixed(2)} %
          </Row>
          <Row label="差">
            {(
              Math.abs(plan.measuredStockoutRate - plan.theoreticalStockoutRate) *
              100
            ).toFixed(2)}{" "}
            ポイント
          </Row>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-usu">
          シミュレーションは <span className="text-hanare">週ごとに</span>
          需要を引いて足しています。閉形式の側だけが σ√L を使うので、
          この二つが合うことは
          <span className="text-hanare">
            「ばらつきはリードタイムの平方根で効く」
          </span>
          が実際に成り立っていることの検算になります。
          まとめて一度に引くと恒等式になり、何も確かめたことになりません。
        </p>
      </div>

      {/* 部品ごとの比較 */}
      <div className="panel p-5">
        <h3 className="text-xs tracking-[0.25em] text-do">
          納期の差が、そのまま金額の差になる
        </h3>
        <ul className="mt-5 space-y-3">
          {allValues.map(({ part: p, value }) => (
            <li key={p.id}>
              <div className="flex flex-wrap items-baseline gap-x-3 text-sm">
                <span
                  className={p.id === partId ? "text-hakuro" : "text-usu"}
                >
                  {p.name}
                </span>
                <span className="tabular text-xs text-usu">
                  納期 {p.leadTimeWeeks} 週
                </span>
                <span className="tabular ml-auto text-xs text-hanare">
                  {formatYen(value).value} {formatYen(value).unit}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-tetsu">
                <div
                  className={
                    p.id === partId
                      ? "h-full rounded-full bg-do"
                      : "h-full rounded-full bg-suji"
                  }
                  style={{
                    width: `${Math.max((value / maxValue) * 100, 1)}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs leading-relaxed text-usu">
          安全在庫は <span className="tabular text-hanare">z · σ · √L</span>。
          納期が 4 倍になると在庫は 2 倍で済みますが、
          単価の高い長納期部品では、その 2 倍がそのまま資金になって寝ます。
          <span className="text-hanare">
            調達が早く動くほど、この金額を積まずに済みます。
          </span>
        </p>
      </div>

      {/* 在庫推移 */}
      <SawtoothChart part={part} reorder={plan.reorder} safety={plan.safety} />
    </div>
  );
}

/**
 * 在庫の推移(鋸歯)。
 *
 * 発注量 Q を **リードタイム 1.5 本分**と決めてサイクルを閉じる。
 * こうすると、入荷直後の在庫 SS+Q から平均的に減って発注点に達し、
 * その L 週後の入荷時点でちょうど安全在庫 SS に戻る——山も谷も式で決まる。
 *
 * 最初、山の高さを「発注点の 1.6 倍」と場当たりに決めていたら、
 * 山が枠を突き抜けた(loop_007 の GEN-LOGIC)。図の縦軸は
 * **描くものの最大値から**決める。
 */
function SawtoothChart({
  part,
  reorder,
  safety,
}: {
  part: Part;
  reorder: number;
  safety: number;
}) {
  const W = 720;
  const H = 220;
  const PAD = { l: 8, r: 8, t: 18, b: 26 };
  const CYCLES = 3;

  const L = part.leadTimeWeeks;
  // 発注量。リードタイム 1.5 本分にすると、サイクル長は 1.5L 週になる
  const orderQty = part.weeklyMean * L * 1.5;
  const peak = safety + orderQty;
  const cycleWeeks = orderQty / part.weeklyMean;
  const totalWeeks = cycleWeeks * CYCLES;

  const top = peak * 1.12;
  const y = (v: number) => PAD.t + (1 - v / top) * (H - PAD.t - PAD.b);
  const x = (w: number) => PAD.l + (w / totalWeeks) * (W - PAD.l - PAD.r);

  // 山 → 谷 → 山 …。谷はちょうど安全在庫の高さになる
  const points: string[] = [];
  for (let c = 0; c < CYCLES; c++) {
    const start = c * cycleWeeks;
    points.push(`${x(start)} ${y(peak)}`);
    points.push(`${x(start + cycleWeeks)} ${y(safety)}`);
  }

  // 発注点を割る時刻(各サイクルで 1 回)
  const orderAt = (orderQty - part.weeklyMean * L) / part.weeklyMean;

  return (
    <div className="panel p-5">
      <h3 className="text-xs tracking-[0.25em] text-do">在庫の推移</h3>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-4 w-full"
        role="img"
        aria-label="発注点方式の在庫推移。谷が安全在庫の高さに一致する"
      >
        {/* 安全在庫の帯 */}
        <rect
          x={PAD.l}
          y={y(safety)}
          width={W - PAD.l - PAD.r}
          height={Math.max(y(0) - y(safety), 0)}
          fill="var(--color-do)"
          fillOpacity="0.12"
        />
        <line
          x1={PAD.l}
          y1={y(safety)}
          x2={W - PAD.r}
          y2={y(safety)}
          stroke="var(--color-do)"
          strokeDasharray="4 3"
        />

        {/* 発注点 */}
        <line
          x1={PAD.l}
          y1={y(reorder)}
          x2={W - PAD.r}
          y2={y(reorder)}
          stroke="var(--color-usu)"
          strokeOpacity="0.45"
          strokeDasharray="2 4"
        />

        {/* 発注の時点 */}
        {Array.from({ length: CYCLES }, (_, c) => (
          <circle
            key={c}
            cx={x(c * cycleWeeks + orderAt)}
            cy={y(reorder)}
            r="3.5"
            fill="var(--color-tetsu)"
            stroke="var(--color-usu)"
            strokeWidth="1.5"
          />
        ))}

        {/* 在庫 */}
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="var(--color-seiji)"
          strokeWidth="2"
        />

        {/* 注記は帯の外に置く */}
        <text
          x={PAD.l + 4}
          y={Math.min(y(safety) + 16, H - PAD.b - 2)}
          fontSize="11"
          fill="var(--color-do)"
        >
          安全在庫 {Math.round(safety).toLocaleString("en-US")} 個
        </text>
        <text
          x={W - PAD.r - 4}
          y={y(reorder) - 6}
          fontSize="11"
          fill="var(--color-usu)"
          textAnchor="end"
        >
          発注点 {Math.round(reorder).toLocaleString("en-US")} 個 ●が発注
        </text>

        <text x={PAD.l} y={H - 8} fontSize="11" fill="var(--color-usu)">
          0 週
        </text>
        <text
          x={W - PAD.r}
          y={H - 8}
          fontSize="11"
          fill="var(--color-usu)"
          textAnchor="end"
        >
          {Math.round(totalWeeks)} 週
        </text>
      </svg>
      <p className="mt-3 text-xs leading-relaxed text-usu">
        発注量をリードタイム {L} 週の 1.5 本分としたときの推移です。
        入荷して満ちた在庫が平均的な使用で減り、発注点(●)で発注し、
        その {L} 週後の入荷でちょうど安全在庫の高さに戻ります。
        <span className="text-hanare">
          使用がいつもより多い週が続くと、谷は帯の下へ食い込みます。
        </span>
        それが欠品です。
      </p>
    </div>
  );
}

/**
 * 金額の表示。万円に丸めるだけだと、3 千円が「0 万円」になって
 * 金額が無いように読める(loop_007)。1 万円未満は円のまま出す。
 */
function formatYen(yen: number): { value: string; unit: string } {
  if (yen < 10000) {
    return { value: Math.round(yen).toLocaleString("en-US"), unit: "円" };
  }
  return {
    value: Math.round(yen / 10000).toLocaleString("en-US"),
    unit: "万円",
  };
}

function Figure({
  label,
  value,
  unit,
  tone = "ok",
}: {
  label: string;
  value: string;
  unit: string;
  tone?: "ok" | "bad" | "warn";
}) {
  const color =
    tone === "bad" ? "text-akane" : tone === "warn" ? "text-do" : "text-hakuro";
  return (
    <div className="bg-ban px-5 py-5">
      <p className={`tabular text-2xl ${color}`}>
        {value}
        <span className="ml-1.5 text-xs text-usu">{unit}</span>
      </p>
      <p className="mt-1 text-xs leading-snug text-usu">{label}</p>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-usu">{label}</dt>
      <dd className="mt-1 text-hakuro">{children}</dd>
    </div>
  );
}
