import { HERO_VIEWBOX, contourBands, heroTraces } from "@/lib/hero";

/**
 * トップの主図(F-01)。基板の配線と佐久平の等高線を一枚に重ねる。
 * 種を固定して呼ぶので、静的書き出しと再描画で同じ絵になる(N-03)。
 */
const SEED = 7;

export function Hero({ className }: { className?: string }) {
  const traces = heroTraces(SEED);
  const contours = contourBands(SEED);

  return (
    <svg
      viewBox={`0 0 ${HERO_VIEWBOX.w} ${HERO_VIEWBOX.h}`}
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="基板の配線と佐久平の等高線を重ねた図"
    >
      <defs>
        <linearGradient id="hero-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--color-do)" stopOpacity="0.18" />
          <stop offset="0.42" stopColor="var(--color-hanare)" stopOpacity="0.95" />
          <stop offset="1" stopColor="var(--color-do)" stopOpacity="0.30" />
        </linearGradient>
        <linearGradient id="hero-veil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-tetsu)" stopOpacity="0.05" />
          <stop offset="0.55" stopColor="var(--color-tetsu)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--color-tetsu)" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* 地形。奥に置いて、配線を透かす */}
      <g fill="none" stroke="var(--color-seiji)" strokeLinecap="round">
        {contours.map((c) => (
          <path
            key={c.level}
            d={c.d}
            strokeWidth={0.9 + c.level * 0.22}
            strokeOpacity={0.26 + c.level * 0.055}
          />
        ))}
      </g>

      {/* 段丘の面。線だけだと地形に見えないので、ごく薄い塗りを重ねる */}
      <g fill="var(--color-seiji)" fillOpacity="0.05" stroke="none">
        {contours.map((c) => (
          <path
            key={`fill-${c.level}`}
            d={`${c.d} L${HERO_VIEWBOX.w} ${HERO_VIEWBOX.h} L0 ${HERO_VIEWBOX.h} Z`}
          />
        ))}
      </g>

      {/* 配線 */}
      <g fill="none" stroke="url(#hero-fade)" strokeLinecap="square">
        {traces.map((t, i) => (
          <path key={i} d={t.d} strokeWidth={t.width} />
        ))}
      </g>

      {/* ビア */}
      <g>
        {traces.map((t, i) =>
          t.via.map((v, j) => (
            <circle
              key={`${i}-${j}`}
              cx={v.x}
              cy={v.y}
              r={t.width > 2 ? 3.4 : 2.2}
              fill="var(--color-tetsu)"
              stroke="var(--color-hanare)"
              strokeWidth="1"
              strokeOpacity="0.5"
            />
          )),
        )}
      </g>

      <rect
        width={HERO_VIEWBOX.w}
        height={HERO_VIEWBOX.h}
        fill="url(#hero-veil)"
      />
    </svg>
  );
}
