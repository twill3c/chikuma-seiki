/**
 * OG 画像の文言(F-15)。
 *
 * 画像の生成そのものは `og-image.tsx` にあり、ここは**文言だけ**を持つ。
 * 分けてあるのは、文言なら DOM 無しでテストできるからで、
 * とくに「描く字がフォント取得の text= に全部入っているか」は
 * ここでしか確かめられない(取り漏らすと画像が豆腐になる)。
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;

export const OG_ROUTES = ["/", "/technology"] as const;
export type OgRoute = (typeof OG_ROUTES)[number];

export type OgContent = {
  /**
   * 見出し。**行に割ってから渡す。**
   * Satori に折り返させると語の途中で割れる(「少しず／つ」になった)。
   */
  title: string[];
  subtitle: string;
  /** 架空である旨。画像の下端に小さく載る */
  note: string;
};

export const OG_CONTENT: Record<OgRoute, OgContent> = {
  "/": {
    title: ["止まらない基板を、", "少しずつ、確かに。"],
    subtitle: "株式会社 千曲精機 ／ 長野県佐久市",
    note: "架空の企業のポートフォリオ作品です",
  },
  "/technology": {
    title: ["言う代わりに、", "動かします。"],
    subtitle: "自動光学検査と AI ／ 段取り替えと生産計画",
    note: "架空の企業のポートフォリオ作品です",
  },
};

/**
 * 画像に描く字をすべて集める。
 *
 * Google Fonts に `text=` で絞って取りに行くので、ここに漏れがあると
 * その字だけ豆腐になる。文言から機械的に集めるので、
 * 文言を書き換えても取り漏らさない。
 */
export function ogGlyphs(): string {
  const seen = new Set<string>();
  for (const c of Object.values(OG_CONTENT)) {
    for (const ch of c.title.join("") + c.subtitle + c.note) seen.add(ch);
  }
  return [...seen].join("");
}

/** 1 行あたりの字数の上限。これを超えると画像からはみ出す(実測 2026-08-27) */
export const OG_TITLE_MAX_CHARS = 13;
