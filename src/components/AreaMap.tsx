/**
 * 所在地の略図(F-06)。
 *
 * **縮尺も座標も持たない。** 実在の区画を指さないための設計であり
 * (SPEC §6)、描くのは位置関係だけ——浅間山を背にして、千曲川が南西から北東へ流れ、
 * 高速道路と新幹線がその間を走る、というところまで。
 * 番地も地図のピンも無い。
 */

const VB = { w: 560, h: 380 } as const;

/**
 * 地図のラベル。**必ず下敷きを敷く。**
 *
 * 略図では線とラベルの交差を避けきれない(河川と道路は実際に交わる)。
 * 位置をずらして逃げると、こんどはラベルが指すものから離れてしまうので、
 * 交差してもよいように背後を塗る。
 */
function MapLabel({
  x,
  y,
  color,
  size = 12,
  anchor = "start",
  children,
}: {
  x: number;
  y: number;
  color: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
  children: string;
}) {
  // 全角も半角も混ざるので、幅は文字数からの概算で足りる
  const width = children.length * size * 0.95 + 8;
  const left =
    anchor === "start"
      ? x - 4
      : anchor === "end"
        ? x - width + 4
        : x - width / 2;
  return (
    <g>
      <rect
        x={left}
        y={y - size}
        width={width}
        height={size * 1.45}
        rx="2"
        fill="#0d1620"
        fillOpacity="0.82"
      />
      <text x={x} y={y} fontSize={size} fill={color} textAnchor={anchor}>
        {children}
      </text>
    </g>
  );
}

export function AreaMap({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      className={className}
      role="img"
      aria-label="佐久平の位置関係を示す略図。縮尺は持たない"
    >
      <rect width={VB.w} height={VB.h} fill="#0d1620" />

      {/* 段丘。奥から手前へ、千曲川に向かって落ちる */}
      <g fill="none" stroke="var(--color-seiji)" strokeOpacity="0.16">
        {[110, 150, 190, 230].map((y, i) => (
          <path
            key={y}
            d={`M0 ${y} C ${VB.w * 0.25} ${y - 14 - i * 3}, ${VB.w * 0.6} ${y + 12 + i * 2}, ${VB.w} ${y - 6 + i * 4}`}
            strokeWidth={1 + i * 0.3}
          />
        ))}
      </g>

      {/* 浅間山 */}
      <g>
        <path
          d="M300 96 L360 26 L420 96 Z"
          fill="var(--color-ban)"
          stroke="var(--color-suji)"
        />
        <path d="M340 50 L360 26 L380 50 L360 44 Z" fill="var(--color-hakuro)" fillOpacity="0.5" />
        <MapLabel x={430} y={60} color="var(--color-usu)">
          浅間山
        </MapLabel>
      </g>

      {/* 千曲川 */}
      <path
        /*
          千曲川は南西から北東へ流れるので、図でも右上へ向かう。
          ただし浅間山の高さまで上げると山の手前を横切る絵になるので、
          右端では道路より下に抜ける高さで止める。
        */
        d={`M40 ${VB.h - 20} C 120 ${VB.h - 90}, 150 ${VB.h - 150}, 250 ${VB.h - 180} S 420 ${VB.h - 195}, ${VB.w - 30} ${VB.h - 215}`}
        fill="none"
        stroke="var(--color-seiji)"
        strokeWidth="7"
        strokeOpacity="0.55"
        strokeLinecap="round"
      />
      <MapLabel x={60} y={VB.h - 34} color="var(--color-seiji)">
        千曲川
      </MapLabel>

      {/* 上信越自動車道 */}
      <path
        d="M20 300 L200 250 L360 232 L540 196"
        fill="none"
        stroke="var(--color-do)"
        strokeWidth="4"
      />
      <MapLabel x={24} y={316} color="var(--color-do)">
        上信越自動車道
      </MapLabel>

      {/* 北陸新幹線 */}
      <path
        d="M20 216 L180 190 L340 176 L540 150"
        fill="none"
        stroke="var(--color-usu)"
        strokeWidth="2.5"
        strokeDasharray="10 5"
      />
      <MapLabel x={440} y={140} color="var(--color-usu)" anchor="end">
        北陸新幹線
      </MapLabel>

      {/* 佐久インターチェンジ */}
      <g>
        <path
          d="M236 244 C 250 236, 258 252, 244 258"
          fill="none"
          stroke="var(--color-do)"
          strokeWidth="2.5"
        />
        <circle cx="240" cy="248" r="5" fill="var(--color-do)" />
        <MapLabel x={252} y={272} color="var(--color-hakuro)">
          佐久インターチェンジ
        </MapLabel>
      </g>

      {/* 工業団地。位置関係だけを示す帯で、区画は描かない */}
      <g>
        <rect
          x="150"
          y="278"
          width="150"
          height="52"
          rx="3"
          fill="var(--color-suji)"
          fillOpacity="0.85"
          stroke="var(--color-hanare)"
          strokeDasharray="4 3"
        />
        <text x="225" y="308" fontSize="13" fill="var(--color-hanare)" textAnchor="middle">
          工業団地
        </text>
        <text x="225" y="324" fontSize="10" fill="var(--color-usu)" textAnchor="middle">
          この一帯に当社があります
        </text>
      </g>

      {/* 方位 */}
      <g transform={`translate(${VB.w - 46} 40)`}>
        <path d="M0 -16 L6 6 L0 1 L-6 6 Z" fill="var(--color-usu)" />
        <text x="0" y="22" fontSize="10" fill="var(--color-usu)" textAnchor="middle">
          N
        </text>
      </g>

      <text x="12" y={VB.h - 8} fontSize="10" fill="var(--color-usu)" fillOpacity="0.7">
        位置関係だけの略図です。縮尺はありません。
      </text>
    </svg>
  );
}
