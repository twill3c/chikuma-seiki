import {
  CLEANROOM_GEOMETRY,
  CLEANROOM_VIEWBOX,
  airflowLines,
  filterCenters,
  returnCenters,
} from "@/lib/airflow";

/**
 * クリーンルームの断面(F-05)。
 *
 * 天井の吹き出しから床の吸い込みへ、空気が一方向に下る。
 * 人と基板は流れの中に置かれ、発塵は下へ運ばれて戻ってこない——
 * この一方向性が、クリーンルームが清浄度を保てる理由そのものである。
 */
export function CleanroomSection({ className }: { className?: string }) {
  const { w, h } = CLEANROOM_VIEWBOX;
  const { ceilingY, floorY, wallPad } = CLEANROOM_GEOMETRY;
  const lines = airflowLines();

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      role="img"
      aria-label="クリーンルームの断面図。天井の吹き出しから床の吸い込みへ空気が下る"
    >
      {/* 部屋 */}
      <rect
        x={wallPad * 0.4}
        y={ceilingY}
        width={w - wallPad * 0.8}
        height={floorY - ceilingY}
        fill="#0d1922"
        stroke="var(--color-suji)"
      />

      {/* 気流 */}
      <g fill="none" stroke="var(--color-seiji)" strokeOpacity="0.55" strokeWidth="1.2">
        {lines.map((l) => (
          <path key={l.id} d={l.d} />
        ))}
      </g>

      {/* 天井の吹き出し口(HEPA) */}
      <g>
        {filterCenters().map((cx, i) => (
          <g key={i}>
            <rect
              x={cx - 46}
              y={ceilingY - 16}
              width={92}
              height={16}
              fill="var(--color-suji)"
              stroke="var(--color-do)"
              strokeWidth="1.2"
            />
            {Array.from({ length: 7 }, (_, k) => (
              <line
                key={k}
                x1={cx - 40 + k * 13}
                y1={ceilingY - 14}
                x2={cx - 40 + k * 13}
                y2={ceilingY - 2}
                stroke="var(--color-do)"
                strokeOpacity="0.5"
              />
            ))}
          </g>
        ))}
      </g>

      {/* 床の吸い込み口 */}
      <g>
        {returnCenters().map((cx, i) => (
          <rect
            key={i}
            x={cx - 26}
            y={floorY}
            width={52}
            height={12}
            fill="var(--color-suji)"
            stroke="var(--color-seiji)"
            strokeWidth="1.2"
          />
        ))}
      </g>

      {/* 作業台と人。流れの中に置かれていることを示すためだけの記号 */}
      <g fill="var(--color-usu)" fillOpacity="0.55">
        <rect x={w * 0.36} y={floorY - 62} width={140} height="6" />
        <rect x={w * 0.38} y={floorY - 56} width="5" height="56" />
        <rect x={w * 0.36 + 128} y={floorY - 56} width="5" height="56" />
        <circle cx={w * 0.32} cy={floorY - 92} r="10" />
        <path
          d={`M${w * 0.32 - 13} ${floorY} L${w * 0.32 - 10} ${floorY - 80} L${w * 0.32 + 10} ${floorY - 80} L${w * 0.32 + 13} ${floorY} Z`}
        />
      </g>

      {/* 注記 */}
      <text x={wallPad * 0.4} y={ceilingY - 24} fontSize="11" fill="var(--color-do)">
        天井 HEPA フィルタ(吹き出し)
      </text>
      <text
        x={returnCenters()[0] - 26}
        y={floorY + 26}
        fontSize="11"
        fill="var(--color-usu)"
      >
        床 吸い込み
      </text>
      <text
        x={w - wallPad * 0.4}
        y={floorY + 26}
        fontSize="11"
        fill="var(--color-usu)"
        textAnchor="end"
      >
        床 吸い込み
      </text>
    </svg>
  );
}
