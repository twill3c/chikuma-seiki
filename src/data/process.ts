/**
 * 実装ラインの工程(F-01 の抜粋 / F-04 の本体)。
 * トップの帯・設備ページのライン図・受注フローの実装段階が、同じ定義を共有する。
 *
 * `equipment` は company.ts の EQUIPMENT を、`dept` は HEADCOUNT を指す。
 * 実在しない ID を書いたらテストが落ちる(T-041 / T-042)。
 */
export type Process = {
  id: string;
  name: string;
  short: string;
  /** その工程が何を決めてしまうか(後工程から見た意味) */
  stake: string;
  /** 何をしているか(ライン図で駅を押したときに出る) */
  detail: string;
  /** 担当部門(HEADCOUNT の ID) */
  dept: string;
  /** 使う設備(EQUIPMENT の ID) */
  equipment: string[];
  /** 管理項目。多品種少量では「切り替えても崩れない」ための項目が並ぶ */
  checks: string[];
  /** 段取り替えの目安(分)。生産計画のデモ(F-10)がこの桁を参照する */
  changeoverMin: number;
};

export const PROCESSES: readonly Process[] = [
  {
    id: "print",
    name: "はんだ印刷",
    short: "印刷",
    stake: "刷り位置のずれは、この先どの工程でも取り返せない。",
    detail:
      "メタルマスクを基板に合わせ、クリームはんだを刷る。機種が変わればマスクも変わる。刷り厚と位置は基板ごとに測り、印刷機に戻して補正する。",
    dept: "manufacturing",
    equipment: ["printer"],
    checks: ["はんだ印刷位置", "印刷厚", "マスク開口の目詰まり", "はんだの粘度と使用時間"],
    changeoverMin: 25,
  },
  {
    id: "mount",
    name: "部品実装",
    short: "実装",
    stake: "多品種少量では、動いている時間より段取り替えの時間が長い日がある。",
    detail:
      "マウンタが部品を載せる。一機種あたり数十枚なので、機械が動いている時間より、フィーダを載せ替えて座標を合わせている時間の方が長い日がある。段取り替えの順番をどう組むかが、その日の産出を決める。",
    dept: "manufacturing",
    equipment: ["mounter"],
    checks: ["部品の照合(品番・極性)", "フィーダの配置", "吸着ミス率", "実装座標のずれ"],
    changeoverMin: 45,
  },
  {
    id: "reflow",
    name: "リフロー",
    short: "リフロー",
    stake: "機種ごとの温度プロファイル。切り替えるたびに炉が落ち着くのを待つ。",
    detail:
      "炉を通してはんだを溶かし、部品を固定する。温度プロファイルは基板の厚みと部品の熱容量で決まるので機種ごとに違う。プロファイルを変えたら、炉の温度が落ち着くまで次の機種は流せない。",
    dept: "manufacturing",
    equipment: ["reflow"],
    checks: ["炉内温度プロファイル", "ピーク温度と保持時間", "搬送速度", "実基板での熱電対測定"],
    changeoverMin: 30,
  },
  {
    id: "aoi",
    name: "自動光学検査",
    short: "AOI",
    stake: "見逃せば流出、拾いすぎれば目視再検査が現場を潰す。",
    detail:
      "はんだの形状と、部品の有無・向き・ずれをカメラで見る。しきい値を厳しくすれば見逃しは減るが、良品まで弾いて目視再検査が積み上がる。多品種少量では機種ごとに癖が違うため、この見極めが効く。AI(画像認識)を併用して過検出を減らしている。",
    dept: "quality",
    equipment: ["aoi"],
    checks: ["はんだフィレット形状", "部品の有無・極性", "位置ずれ量", "判定しきい値の機種別設定"],
    changeoverMin: 15,
  },
  {
    id: "ict",
    name: "電気検査",
    short: "電気検査",
    stake: "見た目で分からない導通と定数をここで押さえる。",
    detail:
      "治具に載せて導通と部品定数を測る。見た目が正しくても、はんだの内部に空隙があれば電気は通らない。治具は機種ごとの専用品で、設計・生産技術が起こす。",
    dept: "quality",
    equipment: ["ict"],
    checks: ["導通・絶縁", "部品定数の実測", "治具の接触抵抗", "測定機の日常点検"],
    changeoverMin: 20,
  },
  {
    id: "assembly",
    name: "組立・最終検査",
    short: "組立",
    stake: "医療機器向けはクリーンルーム内。記録の粒度が一段細かい。",
    detail:
      "筐体に組み、機能を通しで確かめる。医療機器向けのセンサモジュールはクリーンルーム(クラス 10000 対応)の中で組み、どの作業者がいつ何をしたかまで残す。",
    dept: "manufacturing",
    equipment: ["cleanroom"],
    checks: ["機能通電試験", "外観", "作業記録(誰が・いつ)", "室内の清浄度と差圧"],
    changeoverMin: 10,
  },
] as const;

/** 段取り替え時間の合計(分)。生産計画のデモが参照する目安 */
export function totalChangeoverMin(): number {
  return PROCESSES.reduce((s, p) => s + p.changeoverMin, 0);
}
