import { clamp01, lcg } from "./rng";

/**
 * 検査対象の基板を生成する(F-09)。
 *
 * 実物の写真を使わない(N-02)ので、部品の並びと欠陥の作り込みを式で決める。
 * 乱数は種から回すため、静的書き出しと再描画で同じ基板になる(N-03)。
 */

export type DefectKind =
  | "missing"
  | "polarity"
  | "bridge"
  | "offset"
  | "insufficient";

export const DEFECT_KINDS: readonly DefectKind[] = [
  "missing",
  "polarity",
  "bridge",
  "offset",
  "insufficient",
] as const;

export const DEFECT_LABEL: Record<DefectKind, string> = {
  missing: "部品欠品",
  polarity: "極性逆",
  bridge: "はんだブリッジ",
  offset: "位置ずれ",
  insufficient: "はんだ不足",
};

/**
 * 欠陥ごとの「見つけやすさ」。
 *
 * 部品が丸ごと無ければ画像上の差は大きく、はんだが少し足りないだけなら差は小さい。
 * この差が、しきい値を動かしたときにどの欠陥から順に見逃されるかを決める。
 */
export const DEFECT_SIGNAL: Record<DefectKind, number> = {
  missing: 0.92,
  polarity: 0.8,
  bridge: 0.72,
  offset: 0.6,
  insufficient: 0.4,
};

export type PartKind = "chip" | "ic" | "connector";

export type Part = {
  id: string;
  col: number;
  row: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: PartKind;
  defect: DefectKind | null;
  /**
   * 良品でも上がってしまう見かけの信号(機種の癖)。
   *
   * 部品の刻印のかすれ、レジストの色むら、基板のわずかな反り。
   * 不良ではないのに画像の差として出るもので、**過検出の正体**はこれである。
   * AI 併用の効き目は、欠陥を余計に見つけることではなく、ここを割り引けることにある。
   */
  quirk: number;
};

export const BOARD_VIEWBOX = { w: 720, h: 460 } as const;

const COLS = 8;
const ROWS = 6;
const PAD = 40;
const CELL = {
  w: (BOARD_VIEWBOX.w - PAD * 2) / COLS,
  h: (BOARD_VIEWBOX.h - PAD * 2) / ROWS,
} as const;

/** 部品の種類。左端の列は大きめの IC、右下はコネクタ、残りはチップ部品 */
function partKind(col: number, row: number): PartKind {
  if (col <= 1 && row >= 2 && row <= 3) return "ic";
  if (col === COLS - 1 && row >= ROWS - 2) return "connector";
  return "chip";
}

function partSize(kind: PartKind): { w: number; h: number } {
  if (kind === "ic") return { w: CELL.w * 0.72, h: CELL.h * 0.64 };
  if (kind === "connector") return { w: CELL.w * 0.62, h: CELL.h * 0.5 };
  return { w: CELL.w * 0.44, h: CELL.h * 0.3 };
}

/**
 * 基板を作る。`defectCount` 個の部品に欠陥を仕込む。
 * 部品数を超える要求は部品数で頭打ちにする(全数不良の基板になる)。
 */
export function generateBoard(seed: number, defectCount: number): Part[] {
  const rnd = lcg(seed);

  const parts: Part[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const kind = partKind(col, row);
      const size = partSize(kind);
      // 実装のわずかなばらつき。格子にきっちり乗ると基板に見えない
      const jitterX = (rnd() - 0.5) * CELL.w * 0.12;
      const jitterY = (rnd() - 0.5) * CELL.h * 0.12;
      const cx = PAD + col * CELL.w + CELL.w / 2 + jitterX;
      const cy = PAD + row * CELL.h + CELL.h / 2 + jitterY;
      parts.push({
        id: `${String.fromCharCode(65 + col)}${row + 1}`,
        col,
        row,
        x: cx - size.w / 2,
        y: cy - size.h / 2,
        w: size.w,
        h: size.h,
        kind,
        defect: null,
        // 大半の部品は癖が小さい。三乗で裾を作り、少数だけが高く出る
        quirk: clamp01(Math.pow(rnd(), 2) * 1.2),
      });
    }
  }

  // 欠陥を仕込む位置を、重複しないように選ぶ
  const wanted = Math.max(0, Math.min(defectCount, parts.length));
  const remaining = parts.map((_, i) => i);
  for (let n = 0; n < wanted; n++) {
    const pick = Math.floor(rnd() * remaining.length);
    const index = remaining.splice(pick, 1)[0];
    const kind = DEFECT_KINDS[Math.floor(rnd() * DEFECT_KINDS.length)];
    parts[index].defect = kind;
  }

  return parts;
}

/** 部品の中心。図の注記や矢印がここを参照する */
export function partCenter(p: Part): { x: number; y: number } {
  return { x: p.x + p.w / 2, y: p.y + p.h / 2 };
}
