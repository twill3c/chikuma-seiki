/**
 * クリーンルームの断面と気流(F-05)。
 *
 * 写真を使わない(N-02)ので、天井の吹き出しから床の吸い込みへ向かう流れを
 * 式で描く。乱数は使わない(N-03)。
 *
 * 気流は**一方向に下る**。途中で上へ戻る流線を描くと、
 * 絵として嘘になる(粒子を巻き上げる部屋の絵になってしまう)。
 * その約束は T-131 でテストに固定してある。
 */

export const CLEANROOM_VIEWBOX = { w: 640, h: 360 } as const;

/** 天井の吹き出し口の数 */
const FILTERS = 4;
/** 1 本の流線を何点で描くか */
const STEPS = 26;

export type Point = { x: number; y: number };

export type AirflowLine = {
  id: string;
  points: Point[];
  d: string;
  /** どちら側の吸い込みへ向かうか */
  side: "left" | "right";
};

const CEILING_Y = CLEANROOM_VIEWBOX.h * 0.14;
const FLOOR_Y = CLEANROOM_VIEWBOX.h * 0.9;
const WALL_PAD = 44;

/** 吹き出し口の中心 x 座標 */
export function filterCenters(): number[] {
  const usable = CLEANROOM_VIEWBOX.w - WALL_PAD * 2;
  return Array.from(
    { length: FILTERS },
    (_, i) => WALL_PAD + (usable * (i + 0.5)) / FILTERS,
  );
}

/** 床の吸い込み口の中心 x 座標(両端の壁際) */
export function returnCenters(): number[] {
  return [WALL_PAD * 0.7, CLEANROOM_VIEWBOX.w - WALL_PAD * 0.7];
}

export function airflowLines(): AirflowLine[] {
  const returns = returnCenters();
  const lines: AirflowLine[] = [];

  filterCenters().forEach((cx, fi) => {
    // 吹き出し口 1 つにつき 3 本。口の幅の中に散らす
    for (let k = 0; k < 3; k++) {
      const offset = (k - 1) * 12;
      const startX = cx + offset;
      const side: "left" | "right" =
        startX < CLEANROOM_VIEWBOX.w / 2 ? "left" : "right";
      const target = side === "left" ? returns[0] : returns[1];

      const points: Point[] = [];
      for (let s = 0; s <= STEPS; s++) {
        const t = s / STEPS;
        const y = CEILING_Y + (FLOOR_Y - CEILING_Y) * t;
        /*
          上半分はほぼ真下に落ち、下半分で吸い込みへ寄る。
          t^3 にしているのは、天井直下の一様な下降流(層流)と
          床際でだけ曲がる実際の流れに形を合わせるため。
        */
        const pull = Math.pow(t, 3);
        const x = startX + (target - startX) * pull;
        points.push({
          x: Math.round(x * 100) / 100,
          y: Math.round(y * 100) / 100,
        });
      }

      lines.push({
        id: `f${fi}-${k}`,
        side,
        points,
        d: points
          .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
          .join(" "),
      });
    }
  });

  return lines;
}

export const CLEANROOM_GEOMETRY = {
  ceilingY: CEILING_Y,
  floorY: FLOOR_Y,
  wallPad: WALL_PAD,
} as const;

/**
 * 清浄度クラスの対照。
 *
 * 米国連邦規格 209E のクラス番号は「1 立方フィートあたり 0.5μm 以上の粒子数」
 * **そのもの**である。クラス 10000 なら 10,000 個以下。
 * これは制度の説明であり、認証を主張するものではない(SPEC §6)。
 */
export const CLEANROOM_CLASSES = [
  {
    label: "クラス 100",
    usClass: 100,
    isoClass: 5,
    particlesPerCubicFoot: 100,
    use: "半導体の前工程など。当社は持ちません。",
  },
  {
    label: "クラス 1000",
    usClass: 1000,
    isoClass: 6,
    particlesPerCubicFoot: 1000,
    use: "光学部品の組立など。当社は持ちません。",
  },
  {
    label: "クラス 10000",
    usClass: 10000,
    isoClass: 7,
    particlesPerCubicFoot: 10000,
    use: "医療機器向けセンサモジュールの組立と最終検査。当社が対応する区画です。",
  },
  {
    label: "クラス 100000",
    usClass: 100000,
    isoClass: 8,
    particlesPerCubicFoot: 100000,
    use: "前室・資材の受け渡し。",
  },
] as const;
