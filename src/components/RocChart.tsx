import type { RocPoint } from "@/lib/aoi";

/**
 * ROC 曲線(F-09)。
 *
 * 二本の曲線を重ねて、しきい値を動かしても曲線そのものは動かないこと
 * ——動くのは曲線の上の一点であること——が見えるようにしている。
 * 「しきい値の調整」と「検査器の性能」が別物だ、という話がこの図の要点。
 */
const SIZE = 240;
const PAD = 34;
const PLOT = SIZE - PAD * 2;

function toXY(p: { fpr: number; tpr: number }) {
  return { x: PAD + p.fpr * PLOT, y: SIZE - PAD - p.tpr * PLOT };
}

function toPath(points: readonly RocPoint[]): string {
  return points
    .map((p, i) => {
      const { x, y } = toXY(p);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function RocChart({
  curves,
  markers,
  className,
}: {
  curves: { id: string; label: string; color: string; points: RocPoint[] }[];
  markers: { id: string; color: string; fpr: number; tpr: number }[];
  className?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={className}
      role="img"
      aria-label="ROC 曲線。横軸が過検出率、縦軸が検出率"
    >
      {/* 目盛 */}
      <g stroke="var(--color-suji)" strokeWidth="1">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line
              x1={PAD + t * PLOT}
              y1={PAD}
              x2={PAD + t * PLOT}
              y2={SIZE - PAD}
              strokeOpacity="0.35"
            />
            <line
              x1={PAD}
              y1={SIZE - PAD - t * PLOT}
              x2={SIZE - PAD}
              y2={SIZE - PAD - t * PLOT}
              strokeOpacity="0.35"
            />
          </g>
        ))}
      </g>

      {/* 当てずっぽうの線。曲線がこれに近いほど、検査器が効いていない */}
      <line
        x1={PAD}
        y1={SIZE - PAD}
        x2={SIZE - PAD}
        y2={PAD}
        stroke="var(--color-usu)"
        strokeOpacity="0.35"
        strokeDasharray="3 3"
      />

      {curves.map((c) => (
        <path
          key={c.id}
          d={toPath(c.points)}
          fill="none"
          stroke={c.color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ))}

      {/* いま選んでいるしきい値が、曲線のどこに居るか */}
      {markers.map((m) => {
        const { x, y } = toXY(m);
        return (
          <circle
            key={m.id}
            cx={x}
            cy={y}
            r="4.5"
            fill="var(--color-tetsu)"
            stroke={m.color}
            strokeWidth="2.5"
          />
        );
      })}

      <text x={SIZE / 2} y={SIZE - 8} fontSize="10" fill="var(--color-usu)" textAnchor="middle">
        過検出率(良品を弾く割合)
      </text>
      <text
        x="12"
        y={SIZE / 2}
        fontSize="10"
        fill="var(--color-usu)"
        textAnchor="middle"
        transform={`rotate(-90 12 ${SIZE / 2})`}
      >
        検出率(不良を捕まえる割合)
      </text>
    </svg>
  );
}
