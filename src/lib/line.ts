import { PROCESSES } from "@/data/process";

/**
 * SMT ライン図のレイアウト(F-04)。
 *
 * 実際の実装ラインは建屋の幅に合わせて折り返す。図もそれに倣い、
 * 上段を左から右へ、下段を右から左へ流す蛇行(ボストロフェドン)にしてある。
 * 位置は式で決めるので、静的書き出しと再描画で同じ図になる(N-03)。
 */

const COLS = 3;
const BOX = { w: 240, h: 120 } as const;
const PAD = { x: 40, y: 50 } as const;
const GAP = { x: 80, y: 80 } as const;

const ROWS = Math.ceil(PROCESSES.length / COLS);

export const LINE_VIEWBOX = {
  w: PAD.x * 2 + COLS * BOX.w + (COLS - 1) * GAP.x,
  h: PAD.y * 2 + ROWS * BOX.h + (ROWS - 1) * GAP.y,
} as const;

export type Point = { x: number; y: number };

export type Station = {
  id: string;
  index: number;
  row: number;
  col: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 矩形の中心。搬送路はここを通る */
  cx: number;
  cy: number;
};

export type Arrow = {
  x: number;
  y: number;
  /** 進行方向(度)。0 が右、180 が左、90 が下 */
  angle: number;
};

export type LineLayout = {
  stations: Station[];
  conveyor: Point[];
  d: string;
  arrows: Arrow[];
  /** 投入口。搬送路の始点そのもの */
  entry: Point;
  /** 出口。搬送路の終点そのもの。蛇行するので行数の偶奇で左右が変わる */
  exit: Point;
};

function rowY(row: number): number {
  return PAD.y + row * (BOX.h + GAP.y);
}

/** 上段は左から右、下段は右から左。行の偶奇で向きが反転する */
function direction(row: number): 1 | -1 {
  return row % 2 === 0 ? 1 : -1;
}

export function lineLayout(): LineLayout {
  const stations: Station[] = PROCESSES.map((p, index) => {
    const row = Math.floor(index / COLS);
    const posInRow = index % COLS;
    const col = direction(row) === 1 ? posInRow : COLS - 1 - posInRow;
    const x = PAD.x + col * (BOX.w + GAP.x);
    const y = rowY(row);
    return {
      id: p.id,
      index,
      row,
      col,
      x,
      y,
      w: BOX.w,
      h: BOX.h,
      cx: x + BOX.w / 2,
      cy: y + BOX.h / 2,
    };
  });

  const conveyor: Point[] = [];
  for (let row = 0; row < ROWS; row++) {
    const inRow = stations.filter((s) => s.row === row);
    if (inRow.length === 0) continue;
    const dir = direction(row);
    const cy = rowY(row) + BOX.h / 2;

    // 入口は最初の行だけ。以降は前の行の折り返しから続く
    if (row === 0) conveyor.push({ x: 0, y: cy });
    for (const s of inRow) conveyor.push({ x: s.cx, y: s.cy });

    if (row < ROWS - 1) {
      // 折り返し。端まで走ってから下の段へ落ちる
      const turnX = dir === 1 ? LINE_VIEWBOX.w - 20 : 20;
      conveyor.push({ x: turnX, y: cy });
      conveyor.push({ x: turnX, y: rowY(row + 1) + BOX.h / 2 });
    } else {
      conveyor.push({ x: dir === 1 ? LINE_VIEWBOX.w : 0, y: cy });
    }
  }

  const d = conveyor
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
    .join(" ");

  // 区間の中点に進行方向の矢印を置く。長さ 0 の区間は飛ばす
  const arrows: Arrow[] = [];
  for (let i = 1; i < conveyor.length; i++) {
    const a = conveyor[i - 1];
    const b = conveyor[i];
    if (a.x === b.x && a.y === b.y) continue;
    arrows.push({
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
    });
  }

  return {
    stations,
    conveyor,
    d,
    arrows,
    entry: conveyor[0],
    exit: conveyor[conveyor.length - 1],
  };
}
