/**
 * 採用(F-07)と問い合わせの項目(F-08)。
 *
 * 求人の `dept` は `company.ts` の HEADCOUNT を指す。
 * 全部門がいずれかの求人から説明されることをテストで固定してある(T-161)——
 * 部門を足して採用ページに書き忘れる、という取りこぼしを捕まえるため。
 */

export type Opening = {
  id: string;
  /** HEADCOUNT の ID */
  dept: string;
  title: string;
  /** その日の仕事が具体的に何か */
  work: string;
  /** どういう人と働きたいか。抽象語を避ける */
  wanted: string[];
};

export const OPENINGS: readonly Opening[] = [
  {
    id: "smt",
    dept: "manufacturing",
    title: "実装オペレーター",
    work: "印刷機とマウンタ、リフロー炉を受け持ちます。多品種少量なので、一日に何度も機種を切り替えます。動かす時間より、次の機種の準備をしている時間の方が長い日があります。慣れると、切り替えの手順を自分で組み替えられるようになります。",
    wanted: [
      "同じ作業を毎日くり返すより、段取りが変わる方が性に合う人",
      "手順書のとおりにやって駄目だったとき、なぜ駄目かを見に行ける人",
      "未経験可。実装の経験より、推測ではなく実測を信じる姿勢を見ます",
    ],
  },
  {
    id: "qa",
    dept: "quality",
    title: "品質管理",
    work: "受入から出荷まで、記録を設計して回します。AOI の判定しきい値を機種ごとに詰めるのも仕事のうちで、見逃しと過検出のどちらを取るかを毎回決めます。医療機器向けの工程は記録の粒度が一段細かくなります。",
    wanted: [
      "「不良ゼロ」ではなく「どこまで許容するか」を数字で言える人",
      "現場に嫌がられても、残っていない記録を残そうと言える人",
    ],
  },
  {
    id: "pe",
    dept: "engineering",
    title: "生産技術・設計",
    work: "治具、実装条件、ライン構成。段取り替えの時間を削るのはここの仕事です。部品構成の近い機種をまとめて流す順番を考えたり、検査治具を起こしたりします。図面を読んで「このままだと歩留まりが落ちます」と言う役目でもあります。",
    wanted: [
      "作るものより、作り方を考える方が面白い人",
      "自分の直したことが、翌週の産出枚数に出るのを見たい人",
    ],
  },
  {
    id: "it",
    dept: "it",
    title: "社内システム・受託開発",
    work: "検査の判定、生産計画の組み替え、部品の欠品予測。自社のラインで先に回し、効いたものだけを受託の形にしています。要件は現場から直接もらいます。技術ページのデモは、ここで作っているものと同じ考え方で書いてあります。",
    wanted: [
      "何をもって正しいとするかを、実装より先に決めたい人",
      "動くものを見せて要件を詰めていくやり方が苦にならない人",
      "工場の中を歩いて、困っている人に直接聞ける人",
    ],
  },
  {
    id: "admin",
    dept: "admin",
    title: "調達・営業",
    work: "見積と部品の手当てです。半導体の一部は納期が数か月単位で動くので、受注前から動き始めます。リードタイムの大半をここが握っている、というのが実感できる仕事です。",
    wanted: [
      "「入らないかもしれない」を早く言える人",
      "価格より納期の方が難しい、という感覚のある人",
    ],
  },
] as const;

/** 働き方。数字は創作 */
export const WORK_STYLE = [
  { label: "所定労働", value: "1 日 7 時間 45 分" },
  { label: "休日", value: "完全週休二日(土日)・年末年始・夏季" },
  { label: "残業", value: "月平均 12 時間" },
  { label: "通勤", value: "自動車通勤可・駐車場あり" },
] as const;

/**
 * 問い合わせフォームの項目(F-08)。
 *
 * **送信先を持たない。** 型としても定数としても持たせないので、
 * うっかり送信できるようにすることができない(T-162)。
 */
export type ContactField = {
  id: string;
  label: string;
  kind: "text" | "email" | "textarea" | "select";
  placeholder: string;
};

export const CONTACT_FIELDS: readonly ContactField[] = [
  {
    id: "company",
    label: "会社名",
    kind: "text",
    placeholder: "株式会社〇〇",
  },
  { id: "name", label: "お名前", kind: "text", placeholder: "山田 太郎" },
  {
    id: "email",
    label: "メールアドレス",
    kind: "email",
    placeholder: "you@example.com",
  },
  {
    id: "subject",
    label: "ご用件",
    kind: "select",
    placeholder: "受託製造のご相談",
  },
  {
    id: "body",
    label: "お問い合わせ内容",
    kind: "textarea",
    placeholder: "ご相談の概要をお書きください",
  },
] as const;

export const CONTACT_SUBJECTS = [
  "受託製造のご相談",
  "システム開発のご相談",
  "採用について",
  "その他",
] as const;
