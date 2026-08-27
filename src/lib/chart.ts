import type { Department } from "@/data/company";

/**
 * 内訳の扇形(F-06)。
 *
 * 中心角は人数比から式で決める。図から角度を読み取るのではなく、
 * 角度が人数比に一致することをテストで固定してある(T-122)。
 */

export const DONUT = {
  size: 260,
  outerRadius: 118,
  innerRadius: 66,
} as const;

export type Slice = {
  id: string;
  name: string;
  count: number;
  startAngle: number;
  endAngle: number;
  /** ドーナツの帯の真ん中。ラベルの引き出し元になる */
  labelPoint: { x: number; y: number };
  d: string;
};

/** 12 時の位置を 0 度とし、時計回りに進む */
function polar(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const c = DONUT.size / 2;
  return {
    x: round(c + radius * Math.cos(rad)),
    y: round(c + radius * Math.sin(rad)),
  };
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}

export function donutSlices(departments: readonly Department[]): Slice[] {
  const total = departments.reduce((sum, d) => sum + d.count, 0);
  const slices: Slice[] = [];
  let cursor = 0;

  for (const d of departments) {
    const sweep = (d.count / total) * 360;
    const start = cursor;
    const end = cursor + sweep;
    cursor = end;

    const outerStart = polar(start, DONUT.outerRadius);
    const outerEnd = polar(end, DONUT.outerRadius);
    const innerEnd = polar(end, DONUT.innerRadius);
    const innerStart = polar(start, DONUT.innerRadius);
    const largeArc = sweep > 180 ? 1 : 0;

    slices.push({
      id: d.id,
      name: d.name,
      count: d.count,
      startAngle: start,
      endAngle: end,
      labelPoint: polar(
        (start + end) / 2,
        (DONUT.outerRadius + DONUT.innerRadius) / 2,
      ),
      d: [
        `M${outerStart.x} ${outerStart.y}`,
        `A${DONUT.outerRadius} ${DONUT.outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
        `L${innerEnd.x} ${innerEnd.y}`,
        `A${DONUT.innerRadius} ${DONUT.innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
        "Z",
      ].join(" "),
    });
  }

  return slices;
}
