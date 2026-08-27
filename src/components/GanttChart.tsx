import type { GanttSegment, Job } from "@/lib/schedule";

/**
 * ガントチャート(F-10)。
 *
 * 段取りと加工を塗り分ける。多品種少量では帯の中の
 * **段取りの色がどれだけ占めているか**が一番見せたいところなので、
 * 加工より段取りを目立つ色にしてある。
 */

const ROW_H = 22;
const GAP = 4;
const LABEL_W = 96;
const RIGHT_PAD = 8;
const TOP = 22;

export function GanttChart({
  order,
  gantt,
  makespan,
  className,
}: {
  order: readonly Job[];
  gantt: readonly GanttSegment[];
  makespan: number;
  className?: string;
}) {
  const width = 720;
  const plot = width - LABEL_W - RIGHT_PAD;
  const height = TOP + order.length * (ROW_H + GAP) + 26;
  const scale = (minutes: number) => (minutes / makespan) * plot;

  // 目盛は 2 時間ごと。総時間に合わせて間引く
  const stepMinutes = makespan > 1400 ? 240 : 120;
  const ticks: number[] = [];
  for (let t = 0; t <= makespan; t += stepMinutes) ticks.push(t);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="投入順のガントチャート。段取りと加工を塗り分けている"
    >
      {/* 目盛 */}
      <g>
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={LABEL_W + scale(t)}
              y1={TOP - 8}
              x2={LABEL_W + scale(t)}
              y2={height - 22}
              stroke="var(--color-suji)"
              strokeOpacity="0.6"
            />
            <text
              x={LABEL_W + scale(t)}
              y={TOP - 12}
              fontSize="10"
              fill="var(--color-usu)"
              textAnchor="middle"
            >
              {Math.round(t / 60)}h
            </text>
          </g>
        ))}
      </g>

      {gantt.map((seg, i) => {
        const job = order[i];
        const y = TOP + i * (ROW_H + GAP);
        const late = seg.end > job.dueMinutes;
        return (
          <g key={seg.jobId}>
            <text
              x={LABEL_W - 8}
              y={y + ROW_H * 0.7}
              fontSize="11"
              fill="var(--color-usu)"
              textAnchor="end"
            >
              {job.product}
            </text>

            {/* 段取り */}
            <rect
              x={LABEL_W + scale(seg.setupStart)}
              y={y}
              width={Math.max(scale(seg.processStart - seg.setupStart), 0.8)}
              height={ROW_H}
              fill="var(--color-do)"
            />
            {/* 加工 */}
            <rect
              x={LABEL_W + scale(seg.processStart)}
              y={y}
              width={Math.max(scale(seg.end - seg.processStart), 0.8)}
              height={ROW_H}
              fill={late ? "var(--color-akane)" : "var(--color-seiji)"}
              fillOpacity={late ? 0.75 : 0.55}
            />

            {/* 納期。図の中に居るときだけ引く */}
            {job.dueMinutes <= makespan && (
              <line
                x1={LABEL_W + scale(job.dueMinutes)}
                y1={y - 2}
                x2={LABEL_W + scale(job.dueMinutes)}
                y2={y + ROW_H + 2}
                stroke="var(--color-hakuro)"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                strokeOpacity="0.8"
              />
            )}

            <title>{describe(job, seg, late)}</title>
          </g>
        );
      })}
    </svg>
  );
}

/** ホバー用の一文。単一のテキスト子要素にまとめる(HC-037) */
function describe(job: Job, seg: GanttSegment, late: boolean): string {
  const setup = Math.round(seg.processStart - seg.setupStart);
  const process = Math.round(seg.end - seg.processStart);
  const state = late
    ? `納期 ${Math.round(job.dueMinutes / 60)}h に対して ${Math.round((seg.end - job.dueMinutes) / 60 * 10) / 10}h 遅れ`
    : "納期内";
  return `${job.product}(${job.quantity} 枚) — 段取り ${setup} 分 / 加工 ${process} 分 / ${state}`;
}
