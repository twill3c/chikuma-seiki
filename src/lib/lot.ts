/**
 * ロット番号(F-05)。
 *
 * 医療機器向けの製造では、出荷した製品から「どのロットの部品が入ったか」を
 * 後から辿れる必要がある。その入口になるのがこの番号で、
 * 機種・製造年週・その週の通番の三つを持つ。
 *
 * 往復検査(`parse(format(x)) === x`)だけを正しさの根拠にしない。
 * 可逆性は自己無矛盾を示すだけで、解釈が正しいことを示さない
 * (furigana-keiryo の HC-035 / fukuo-keiryo の HC-027)。
 * 値域の検査と、不正な入力を棄却することを別の根拠として置く。
 */

export type Lot = {
  /** 機種の頭 3 文字 */
  product: string;
  /** 西暦の下 2 桁 */
  year: number;
  /** 製造週(1–53)。年をまたぐ切り替えは週で追う */
  week: number;
  /** その週の通番(1–999) */
  serial: number;
};

/** `機種3文字-年2桁 + 週2桁-通番3桁` */
export const LOT_PATTERN = /^([A-Z]{3})-(\d{2})(\d{2})-(\d{3})$/;

export function formatLot(lot: Lot): string {
  const yy = String(lot.year).padStart(2, "0");
  const ww = String(lot.week).padStart(2, "0");
  const nnn = String(lot.serial).padStart(3, "0");
  return `${lot.product}-${yy}${ww}-${nnn}`;
}

/** 形が合わない・値域を外れるものは null。例外を投げない */
export function parseLot(text: string): Lot | null {
  const m = LOT_PATTERN.exec(text);
  if (!m) return null;

  const [, product, yy, ww, nnn] = m;
  const week = Number(ww);
  const serial = Number(nnn);

  // ISO 週番号は 1–53。0 週も 54 週も存在しない
  if (week < 1 || week > 53) return null;
  // 通番は 1 から。000 は採番されない
  if (serial < 1) return null;

  return { product, year: Number(yy), week, serial };
}

/** 番号の各欄が何を意味するか。画面の分解表示が参照する */
export const LOT_FIELDS = [
  { key: "product", label: "機種", note: "頭 3 文字。設計の系統を表す" },
  { key: "year", label: "製造年", note: "西暦の下 2 桁" },
  { key: "week", label: "製造週", note: "1〜53。年をまたぐ切り替えは週で追う" },
  { key: "serial", label: "通番", note: "その週の何本目か" },
] as const;
