import { describe, expect, it } from "vitest";
import { FLEET_FOOTER, NAV } from "./site";

describe("フッタとナビ(T-190 / F-16・N-06)", () => {
  it("T-190 フッタが規約どおり 5 項目である", () => {
    // フリート共通規約(koho-lens が正本): 5 項目・この並び
    expect(FLEET_FOOTER).toHaveLength(5);
    expect(FLEET_FOOTER.map((f) => f.label)).toEqual([
      "MIT License © 2026 坂田哲朗",
      "GitHub",
      "千曲精機の見方",
      "設計図",
      "App Menu",
    ]);
  });

  it("T-190 全項目がリンク先を持つ(公開待ちが残っていない)", () => {
    const pending = FLEET_FOOTER.filter((f) => f.href === null).map(
      (f) => f.label,
    );
    expect(pending, "リンク先が未設定の項目").toEqual([]);
  });

  it("T-190 リンク先が https の絶対 URL である", () => {
    for (const f of FLEET_FOOTER) {
      expect(f.href, f.label).toMatch(/^https:\/\//);
    }
  });

  it("ナビの経路が重複せず、すべて絶対パスである", () => {
    const hrefs = NAV.map((n) => n.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const h of hrefs) expect(h.startsWith("/"), h).toBe(true);
  });

  it("ナビが全部公開済みである(未公開のページが残っていない)", () => {
    const notReady = NAV.filter((n) => !n.ready).map((n) => n.href);
    expect(notReady).toEqual([]);
  });
});
