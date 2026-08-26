/**
 * ヒーローの図(F-01 / N-03)。
 *
 * 写真素材を持たない方針(N-02)なので、トップの主図は式で描く。
 * 題材は「基板の配線 × 佐久平の等高線」— 会社が作っているものと、
 * 会社が居る場所を一枚に重ねる。
 *
 * 乱数を使わない。線形合同法の擬似乱数を種から回すので、サーバでの静的書き出しと
 * ブラウザでの再描画が必ず一致する(一致しなければハイドレーション不整合になる)。
 */

export const HERO_VIEWBOX = { w: 1200, h: 520 } as const;

/** 配線を載せる格子。実際の基板と同じく、線はこの目に乗る */
const GRID = 8;

export type Point = { x: number; y: number };

export type Trace = {
  /** SVG の d 属性 */
  d: string;
  points: Point[];
  /** 線幅。信号線と電源線を描き分ける */
  width: number;
  /** ビア(層を貫く穴)の位置 */
  via: Point[];
};

/** 線形合同法。Math.random を使わないための最小の擬似乱数(N-03) */
function lcg(seed: number): () => number {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function snap(v: number, max: number): number {
  const g = Math.round(v / GRID) * GRID;
  return Math.min(max, Math.max(0, g));
}

/**
 * 2 点を直交と 45 度だけで結ぶ。基板の配線は鋭角に曲げない(酸だまり・
 * インピーダンス不連続を避けるため)ので、その約束をそのまま形にしている。
 *
 * 長い方の軸で差を詰めてから、残りを 45 度で消化する。格子に乗った整数同士なので
 * |dx| と |dy| は厳密に一致し、丸め誤差で 45 度が崩れない。
 */
function route(a: Point, b: Point): Point[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  const mid: Point =
    adx >= ady
      ? { x: a.x + Math.sign(dx) * (adx - ady), y: a.y }
      : { x: a.x, y: a.y + Math.sign(dy) * (ady - adx) };

  const out: Point[] = [a];
  for (const p of [mid, b]) {
    const last = out[out.length - 1];
    if (p.x !== last.x || p.y !== last.y) out.push(p);
  }
  return out;
}

function toPath(points: Point[]): string {
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
    .join(" ");
}

const TRACE_COUNT = 16;

/**
 * 配線。左の端子列から右の端子列へ、途中に一つ経由点を置いて引く。
 * 経由点があることで、まっすぐ束ねただけの縞に見えなくなる。
 */
export function heroTraces(seed: number): Trace[] {
  const rnd = lcg(seed);
  const { w, h } = HERO_VIEWBOX;
  const traces: Trace[] = [];

  for (let i = 0; i < TRACE_COUNT; i++) {
    // 端子は上下に均等に散らす。乱数は「ゆらぎ」にだけ使い、骨格は式で決める。
    const lane = (i + 0.5) / TRACE_COUNT;
    const start: Point = {
      x: snap(rnd() * 40, w),
      y: snap(lane * h + (rnd() - 0.5) * 24, h),
    };
    const waypoint: Point = {
      x: snap(w * (0.28 + rnd() * 0.4), w),
      y: snap(lane * h + (rnd() - 0.5) * 140, h),
    };
    const end: Point = {
      x: snap(w - rnd() * 40, w),
      y: snap(lane * h + (rnd() - 0.5) * 40, h),
    };

    const points = [...route(start, waypoint), ...route(waypoint, end).slice(1)];
    // 電源線は 4 本に 1 本。太さで役割を描き分ける。
    traces.push({
      d: toPath(points),
      points,
      width: i % 4 === 0 ? 3 : 1.5,
      via: [waypoint],
    });
  }

  return traces;
}

export type Contour = { d: string; level: number };

const CONTOUR_COUNT = 7;

/**
 * 等高線。佐久平は千曲川に向かって落ちる河岸段丘なので、
 * 右下に向かってゆるく下がる帯として描く。正弦の重ね合わせで決めるので
 * 種が同じなら同じ地形になる。
 */
export function contourBands(seed: number): Contour[] {
  const rnd = lcg(seed + 101);
  const { w, h } = HERO_VIEWBOX;
  const bands: Contour[] = [];

  for (let k = 0; k < CONTOUR_COUNT; k++) {
    const base = h * (0.18 + (k / CONTOUR_COUNT) * 0.9);
    const a1 = 18 + rnd() * 22;
    const a2 = 6 + rnd() * 10;
    const f1 = 1.2 + rnd() * 0.9;
    const f2 = 3.1 + rnd() * 1.7;
    const p1 = rnd() * Math.PI * 2;
    const p2 = rnd() * Math.PI * 2;

    const pts: string[] = [];
    for (let x = 0; x <= w; x += 20) {
      const t = x / w;
      const y =
        base +
        a1 * Math.sin(t * Math.PI * f1 + p1) +
        a2 * Math.sin(t * Math.PI * f2 + p2) +
        t * 26; // 右へ行くほど下がる(千曲川へ落ちる)
      pts.push(`${x} ${Math.round(y * 100) / 100}`);
    }

    bands.push({
      d: `M${pts.join(" L")}`,
      level: CONTOUR_COUNT - k,
    });
  }

  return bands;
}
