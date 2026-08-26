import {
  BOARD_VIEWBOX,
  DEFECT_LABEL,
  partCenter,
  type Part,
} from "@/lib/board";
import type { Scored } from "@/lib/aoi";

/**
 * 検査中の基板(F-09)。写真ではなく式で描く(N-02)。
 *
 * 判定結果を四通りに塗り分ける。見逃し(不良を良品と判定)だけは
 * 塗りでは目立たないので、破線の輪で囲って別扱いにしている。
 */
export function BoardView({
  scored,
  threshold,
  className,
}: {
  scored: Scored[];
  threshold: number;
  className?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${BOARD_VIEWBOX.w} ${BOARD_VIEWBOX.h}`}
      className={className}
      role="img"
      aria-label="判定結果を塗り分けた模擬基板"
    >
      <rect
        width={BOARD_VIEWBOX.w}
        height={BOARD_VIEWBOX.h}
        rx="6"
        fill="#101a17"
        stroke="var(--color-suji)"
      />

      {/* 基板の配線らしさ。判定とは無関係の飾り */}
      <g stroke="var(--color-seiji)" strokeOpacity="0.14" strokeWidth="1.5" fill="none">
        {Array.from({ length: 7 }, (_, i) => (
          <path
            key={i}
            d={`M20 ${52 + i * 60} H${BOARD_VIEWBOX.w - 20}`}
          />
        ))}
      </g>

      {scored.map((s) => {
        const flagged = s.score >= threshold;
        const missed = s.actual && !flagged;
        const falseAlarm = !s.actual && flagged;
        const hit = s.actual && flagged;

        const fill = hit
          ? "var(--color-akane)"
          : falseAlarm
            ? "var(--color-do)"
            : missed
              ? "var(--color-ban)"
              : "var(--color-seiji)";

        return (
          <g key={s.part.id}>
            <Body part={s.part} fill={fill} />
            {missed && (
              <rect
                x={s.part.x - 5}
                y={s.part.y - 5}
                width={s.part.w + 10}
                height={s.part.h + 10}
                rx="2"
                fill="none"
                stroke="var(--color-akane)"
                strokeWidth="1.6"
                strokeDasharray="3 3"
              />
            )}
            {/*
              title は単一のテキスト子要素でなければならない。式を並べて書くと
              React が配列として扱い、読み上げに乗らない(HC-037)。
            */}
            <title>{describe(s, flagged)}</title>
          </g>
        );
      })}
    </svg>
  );
}

/** ホバー・読み上げ用の一文。必ず単一の文字列にまとめる(HC-037) */
function describe(s: Scored, flagged: boolean): string {
  const what = s.part.defect ? DEFECT_LABEL[s.part.defect] : "良品";
  const judged = flagged ? "不良判定" : "良品判定";
  return `${s.part.id} — ${what}(スコア ${s.score.toFixed(2)} / ${judged})`;
}

/** 部品の形。IC は脚つき、コネクタは横長、チップ部品は両端に電極 */
function Body({ part, fill }: { part: Part; fill: string }) {
  const c = partCenter(part);
  if (part.kind === "ic") {
    return (
      <>
        <rect
          x={part.x}
          y={part.y}
          width={part.w}
          height={part.h}
          rx="1.5"
          fill={fill}
          fillOpacity="0.85"
        />
        <circle cx={part.x + 6} cy={part.y + 6} r="2" fill="var(--color-tetsu)" />
        {Array.from({ length: 5 }, (_, i) => (
          <rect
            key={i}
            x={part.x - 3}
            y={part.y + 5 + i * ((part.h - 10) / 4)}
            width={part.w + 6}
            height="1.6"
            fill={fill}
            fillOpacity="0.55"
          />
        ))}
      </>
    );
  }
  if (part.kind === "connector") {
    return (
      <>
        <rect
          x={part.x}
          y={part.y}
          width={part.w}
          height={part.h}
          rx="1"
          fill={fill}
          fillOpacity="0.75"
        />
        {Array.from({ length: 6 }, (_, i) => (
          <rect
            key={i}
            x={part.x + 2 + i * ((part.w - 4) / 6)}
            y={part.y + 2}
            width="1.8"
            height={part.h - 4}
            fill="var(--color-tetsu)"
          />
        ))}
      </>
    );
  }
  return (
    <>
      <rect
        x={part.x}
        y={part.y}
        width={part.w}
        height={part.h}
        rx="0.8"
        fill={fill}
        fillOpacity="0.8"
      />
      <rect x={part.x} y={part.y} width="3" height={part.h} fill={fill} />
      <rect
        x={part.x + part.w - 3}
        y={part.y}
        width="3"
        height={part.h}
        fill={fill}
      />
      <circle cx={c.x} cy={c.y} r="0" fill="none" />
    </>
  );
}
