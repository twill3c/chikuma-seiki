/**
 * 品質保証と記録(F-05)。
 *
 * 工程ごとの管理項目は `process.ts` が持っている(何を見るか)。
 * ここが持つのは「何を残すか」で、両者は別物である。
 * 見ているが残していない項目は、後から辿れない。
 */

export type ProcessRecord = {
  /** process.ts の工程 ID */
  processId: string;
  items: string[];
  /** 保存年数。医療機器向けは長い */
  retentionYears: number;
};

export const RECORDS: readonly ProcessRecord[] = [
  {
    processId: "print",
    items: ["はんだの製造ロットと開封時刻", "印刷検査の実測値", "メタルマスクの識別番号"],
    retentionYears: 7,
  },
  {
    processId: "mount",
    items: [
      "リールごとの部品ロット",
      "フィーダ配置表",
      "実装プログラムの版",
      "吸着ミスの発生記録",
    ],
    retentionYears: 10,
  },
  {
    processId: "reflow",
    items: ["温度プロファイルの実測波形", "炉の号機", "投入時刻"],
    retentionYears: 10,
  },
  {
    processId: "aoi",
    items: ["判定結果と画像", "しきい値の設定値", "目視再検査の判断と担当者"],
    retentionYears: 10,
  },
  {
    processId: "ict",
    items: ["測定値の全項目", "治具の識別番号と点検記録", "測定機の校正日"],
    retentionYears: 10,
  },
  {
    processId: "assembly",
    items: [
      "作業者と作業時刻",
      "室内の清浄度と差圧の記録",
      "機能試験の結果",
      "出荷ロット番号との対応",
    ],
    retentionYears: 10,
  },
] as const;

/**
 * 辿る鎖。出荷した製品から部品のリールまで、どの記録で繋がっているか。
 * `from` と `to` が数珠つなぎになっていることをテストで固定してある。
 */
export type TraceLink = {
  from: string;
  to: string;
  label: string;
  via: string;
};

export const TRACE_CHAIN: readonly TraceLink[] = [
  {
    from: "出荷先",
    to: "出荷ロット",
    label: "納品書の番号から出荷ロットを引く",
    via: "出荷記録",
  },
  {
    from: "出荷ロット",
    to: "製造ロット",
    label: "出荷ロットに含まれる製造ロットを引く",
    via: "組立・最終検査の記録",
  },
  {
    from: "製造ロット",
    to: "基板",
    label: "製造ロットの各基板を引く",
    via: "電気検査の測定値",
  },
  {
    from: "基板",
    to: "リール",
    label: "その基板に載った部品のリールを引く",
    via: "実装機のフィーダ配置表",
  },
  {
    from: "リール",
    to: "部品ロット",
    label: "リールの部品ロットと受入検査の結果を引く",
    via: "受入検査の記録",
  },
] as const;

/** 品質保証の考え方。ページの導入に置く */
export const QUALITY_STANCE = [
  {
    title: "見ることと、残すことは別",
    body: "工程で何を見ているかと、何を残しているかは別の話です。見ているが残していない項目は、出荷したあとで問われたときに答えられません。当社は工程ごとに残す項目を先に決めています。",
  },
  {
    title: "抜き取りではなく全数の記録",
    body: "多品種少量なので、一機種あたりの枚数は多くありません。統計的に抜き取る意味が薄いぶん、全数の測定値をそのまま残せます。",
  },
  {
    title: "止まると困るものを作っている",
    body: "産業用ロボットが止まれば産線が止まり、医療機器のセンサが狂えば診断が狂います。歩留まりの数字より、一枚が通り抜けたときに何が起きるかで工程を組んでいます。",
  },
] as const;
