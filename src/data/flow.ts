/**
 * 受注から出荷までの流れ(F-03)。
 *
 * EMS の受託製造は「作る」だけではない。多品種少量で効いてくるのは、
 * 見積の読みと、長納期部品をいつ手当てするかの側である。
 * リードタイムの大半が実装ではなく調達で決まる、という実態を段階の日数で出す。
 *
 * `dept` は company.ts の HEADCOUNT を指す。実在しない ID を書いたら落ちる(T-052)。
 */
export type FlowStage = {
  id: string;
  name: string;
  dept: string;
  minDays: number;
  maxDays: number;
  body: string;
  /** 実装ラインの 6 工程を含む段階。ちょうど 1 つであること(T-053) */
  containsProcesses?: boolean;
};

export const FLOW: readonly FlowStage[] = [
  {
    id: "inquiry",
    name: "引き合い・見積",
    dept: "admin",
    minDays: 3,
    maxDays: 10,
    body: "図面と部品表を受け取り、作れるかどうかと、いくらで作れるかを見ます。ここで一番時間がかかるのは価格ではなく、指定部品が手に入るかの確認です。",
  },
  {
    id: "dfm",
    name: "製造性の確認",
    dept: "engineering",
    minDays: 2,
    maxDays: 7,
    body: "設計のまま作ると歩留まりが落ちる箇所を洗い、必要なら変更を提案します。ランドの形、部品の間隔、検査治具を当てられる場所。作る前に言わないと、あとで全数手直しになります。",
  },
  {
    id: "procure",
    name: "部品調達",
    dept: "admin",
    minDays: 14,
    maxDays: 120,
    body: "ここがリードタイムの大半を占めます。半導体の一部は納期が数か月単位で動き、一点でも欠ければラインは組めません。長納期品は受注前から手当てを始めます。",
  },
  {
    id: "incoming",
    name: "受入検査",
    dept: "quality",
    minDays: 1,
    maxDays: 3,
    body: "届いた部品を数え、品番と実物を照合します。リールのラベルと中身が違うことは実際に起きるので、ここで止めます。",
  },
  {
    id: "fixture",
    name: "治具・条件出し",
    dept: "engineering",
    minDays: 3,
    maxDays: 15,
    body: "メタルマスク、実装プログラム、リフローの温度プロファイル、検査治具。初回はここに時間がかかり、二回目からは段取り替えの時間だけで済みます。",
  },
  {
    id: "production",
    name: "実装・組立",
    dept: "manufacturing",
    minDays: 2,
    maxDays: 10,
    body: "印刷からリフロー、検査を経て組立まで。六つの工程を通ります。多品種少量では、この段階の時間の多くが段取り替えに使われます。",
    containsProcesses: true,
  },
  {
    id: "shipping",
    name: "出荷検査・出荷",
    dept: "quality",
    minDays: 1,
    maxDays: 4,
    body: "抜き取りではなく全数の記録を添えて出します。医療機器向けは、どのロットの部品がどの製品に入ったかを後から辿れる形で残します。",
  },
] as const;

export function leadTimeRange(): { min: number; max: number } {
  return {
    min: FLOW.reduce((s, f) => s + f.minDays, 0),
    max: FLOW.reduce((s, f) => s + f.maxDays, 0),
  };
}

/** 段階が全体のリードタイムに占める割合(帯グラフ用)。最大日数で見る */
export function flowShare(stage: FlowStage): number {
  return stage.maxDays / leadTimeRange().max;
}
