/**
 * 実装ラインの工程(F-01 の抜粋 / F-04 の本体)。
 * トップの帯と設備ページのライン図が同じ定義を共有する。
 */
export type Process = {
  id: string;
  name: string;
  short: string;
  /** その工程が何を決めてしまうか(後工程から見た意味) */
  stake: string;
};

export const PROCESSES: readonly Process[] = [
  {
    id: "print",
    name: "はんだ印刷",
    short: "印刷",
    stake: "刷り位置のずれは、この先どの工程でも取り返せない。",
  },
  {
    id: "mount",
    name: "部品実装",
    short: "実装",
    stake: "多品種少量では、動いている時間より段取り替えの時間が長い日がある。",
  },
  {
    id: "reflow",
    name: "リフロー",
    short: "リフロー",
    stake: "機種ごとの温度プロファイル。切り替えるたびに炉が落ち着くのを待つ。",
  },
  {
    id: "aoi",
    name: "自動光学検査",
    short: "AOI",
    stake: "見逃せば流出、拾いすぎれば目視再検査が現場を潰す。",
  },
  {
    id: "ict",
    name: "電気検査",
    short: "電気検査",
    stake: "見た目で分からない導通と定数をここで押さえる。",
  },
  {
    id: "assembly",
    name: "組立・最終検査",
    short: "組立",
    stake: "医療機器向けはクリーンルーム内。記録の粒度が一段細かい。",
  },
] as const;
