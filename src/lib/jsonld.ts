import { COMPANY } from "@/data/company";

export const SITE_URL = "https://chikuma-seiki.vercel.app";

/**
 * schema.org の構造化データ(F-13)。
 *
 * 連絡先の鍵(telephone / streetAddress / faxNumber / email)を一切持たない。
 * 人間が読む本文に書かないだけでは足りない — 構造化データは機械に拾われるので、
 * 架空の会社の連絡先が検索結果や地図に載る経路をここで断つ(SPEC §6)。
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization" as const,
    "@id": `${SITE_URL}/#organization`,
    name: COMPANY.name,
    alternateName: COMPANY.nameEn,
    slogan: COMPANY.tagline,
    // 架空であることを構造化データの側にも書く。
    disambiguatingDescription: COMPANY.fictionNotice,
    url: `${SITE_URL}/`,
    inLanguage: "ja-JP",
    foundingDate: String(COMPANY.founded),
    address: {
      "@type": "PostalAddress",
      addressCountry: "JP",
      addressRegion: COMPANY.address.region,
      addressLocality: COMPANY.address.locality,
    },
    numberOfEmployees: {
      "@type": "QuantitativeValue",
      value: COMPANY.employees,
    },
    knowsAbout: [
      "電子機器受託製造",
      "表面実装",
      "自動光学検査",
      "生産計画の最適化",
    ],
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList" as const,
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${SITE_URL}${t.path}`,
    })),
  };
}

/** <script type="application/ld+json"> にそのまま流す文字列 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data);
}
