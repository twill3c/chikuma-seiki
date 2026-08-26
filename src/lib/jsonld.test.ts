import { describe, expect, it } from "vitest";
import { organizationJsonLd, breadcrumbJsonLd, SITE_URL } from "./jsonld";
import { COMPANY } from "@/data/company";

describe("構造化データ(T-010〜T-013 / F-13)", () => {
  it("T-010 Organization として組み立つ", () => {
    const ld = organizationJsonLd();
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Organization");
    expect(ld.name).toBe(COMPANY.name);
    expect(ld.url.startsWith(SITE_URL)).toBe(true);
  });

  it("T-011 架空である旨を構造化データ側にも書いている", () => {
    expect(organizationJsonLd().disambiguatingDescription).toContain("架空");
  });

  it("T-012 連絡先の鍵を一切出力しない(実在企業への誤接続を防ぐ)", () => {
    const serialized = JSON.stringify(organizationJsonLd());
    for (const forbidden of [
      "telephone",
      "streetAddress",
      "faxNumber",
      "email",
    ]) {
      expect(serialized, forbidden).not.toContain(forbidden);
    }
  });

  it("T-013 所在地は都道府県・市までで止まる", () => {
    const addr = organizationJsonLd().address;
    expect(addr.addressRegion).toBe(COMPANY.address.region);
    expect(addr.addressLocality).toBe(COMPANY.address.locality);
    expect(Object.keys(addr).sort()).toEqual([
      "@type",
      "addressCountry",
      "addressLocality",
      "addressRegion",
    ]);
  });

  it("従業員数は構造化データでも SPEC §2 と同じ値になる", () => {
    expect(organizationJsonLd().numberOfEmployees.value).toBe(
      COMPANY.employees,
    );
  });
});

describe("パンくず", () => {
  it("position が 1 から順に振られ、絶対 URL になる", () => {
    const bc = breadcrumbJsonLd([
      { name: "千曲精機", path: "/" },
      { name: "技術", path: "/technology" },
    ]);
    expect(bc.itemListElement.map((e) => e.position)).toEqual([1, 2]);
    for (const e of bc.itemListElement) {
      expect(e.item.startsWith("https://")).toBe(true);
    }
  });
});
