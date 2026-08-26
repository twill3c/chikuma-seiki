"use client";

import { useState } from "react";
import { PROCESSES } from "@/data/process";
import { EQUIPMENT, HEADCOUNT } from "@/data/company";
import { LINE_VIEWBOX, lineLayout } from "@/lib/line";

/**
 * 押せる SMT ライン図(F-04)。
 *
 * 駅を押すと、その工程が何をしていて、何を管理していて、
 * 切り替えに何分かかるかが出る。工程の説明を並べた表より、
 * 「順番に流れている一本のもの」として見えることを優先している。
 */
export function LineDiagram() {
  const { stations, d, arrows, entry, exit } = lineLayout();
  // ラベルは駅の行の外側に出す。搬送路の高さに置くと駅の矩形に重なる。
  const first = stations[0];
  const last = stations[stations.length - 1];
  const [selected, setSelected] = useState(PROCESSES[0].id);
  const current = PROCESSES.find((p) => p.id === selected)!;
  const dept = HEADCOUNT.find((h) => h.id === current.dept)!;
  const equipment = EQUIPMENT.filter((e) => current.equipment.includes(e.id));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <svg
        viewBox={`0 0 ${LINE_VIEWBOX.w} ${LINE_VIEWBOX.h}`}
        className="w-full"
        role="group"
        aria-label="実装ラインの工程図"
      >
        {/* 搬送路。駅の中心を順に通る */}
        <path
          d={d}
          fill="none"
          stroke="var(--color-suji)"
          strokeWidth="26"
          strokeLinecap="square"
          strokeLinejoin="round"
        />
        <path
          d={d}
          fill="none"
          stroke="var(--color-tetsu)"
          strokeWidth="20"
          strokeLinecap="square"
          strokeLinejoin="round"
        />

        {/* 進行方向 */}
        <g fill="var(--color-do)" fillOpacity="0.5">
          {arrows.map((a, i) => (
            <path
              key={i}
              d="M-5 -4 L5 0 L-5 4 Z"
              transform={`translate(${a.x} ${a.y}) rotate(${a.angle})`}
            />
          ))}
        </g>

        {/* 駅 */}
        {stations.map((s) => {
          const p = PROCESSES[s.index];
          const active = p.id === selected;
          return (
            <g
              key={s.id}
              onClick={() => setSelected(p.id)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-pressed={active}
              aria-label={`${p.name}の説明を見る`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(p.id);
                }
              }}
            >
              <rect
                x={s.x}
                y={s.y}
                width={s.w}
                height={s.h}
                rx="3"
                fill={active ? "var(--color-suji)" : "var(--color-ban)"}
                stroke={active ? "var(--color-do)" : "var(--color-suji)"}
                strokeWidth={active ? 2 : 1.5}
              />
              <text
                x={s.x + 16}
                y={s.y + 32}
                className="tabular"
                fontSize="14"
                fill="var(--color-do)"
                letterSpacing="2"
              >
                {String(s.index + 1).padStart(2, "0")}
              </text>
              <text
                x={s.x + 16}
                y={s.y + 62}
                fontSize="21"
                fill={active ? "var(--color-hakuro)" : "var(--color-usu)"}
              >
                {p.name}
              </text>
              <text x={s.x + 16} y={s.y + 92} fontSize="14" fill="var(--color-usu)">
                段取り替え {p.changeoverMin} 分
              </text>
            </g>
          );
        })}

        {/*
          ラベルの位置は搬送路の両端から取る。左下・右下に決め打ちすると、
          蛇行で下段が右から左へ流れたときに図と矛盾する(loop_002 の GEN-LOGIC)。
        */}
        <text
          x={entry.x === 0 ? 4 : LINE_VIEWBOX.w - 4}
          y={first.y - 14}
          fontSize="14"
          fill="var(--color-usu)"
          textAnchor={entry.x === 0 ? "start" : "end"}
        >
          投入
        </text>
        <text
          x={exit.x === 0 ? 4 : LINE_VIEWBOX.w - 4}
          y={last.y + last.h + 26}
          fontSize="14"
          fill="var(--color-usu)"
          textAnchor={exit.x === 0 ? "start" : "end"}
        >
          次工程へ
        </text>
      </svg>

      {/* 押された駅の中身 */}
      <aside className="panel p-6" aria-live="polite">
        <p className="text-xs tracking-[0.25em] text-do">
          {String(PROCESSES.indexOf(current) + 1).padStart(2, "0")}
        </p>
        <h3 className="mt-2 text-xl text-hakuro">{current.name}</h3>
        <p className="mt-4 text-sm leading-relaxed text-usu">{current.detail}</p>

        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="text-xs tracking-[0.2em] text-do">担当</dt>
            <dd className="mt-1 text-usu">{dept.name}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.2em] text-do">設備</dt>
            <dd className="mt-1 space-y-1 text-usu">
              {equipment.map((e) => (
                <p key={e.id}>{e.name}</p>
              ))}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.2em] text-do">管理項目</dt>
            <dd className="mt-1">
              <ul className="flex flex-wrap gap-1.5">
                {current.checks.map((c) => (
                  <li
                    key={c}
                    className="rounded-sm border border-suji px-2 py-0.5 text-xs text-usu"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>

        <p className="mt-6 border-t border-suji pt-4 text-xs leading-relaxed text-hanare">
          {current.stake}
        </p>
      </aside>
    </div>
  );
}
