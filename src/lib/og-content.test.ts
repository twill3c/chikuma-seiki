import { describe, expect, it } from "vitest";
import {
  OG_CONTENT,
  OG_ROUTES,
  OG_SIZE,
  OG_TITLE_MAX_CHARS,
  ogGlyphs,
} from "./og-content";

describe("OG 画像の文言(T-150〜T-152 / F-15)", () => {
  it("T-150 対象ルートの集合と文言の鍵集合が一致する", () => {
    expect(Object.keys(OG_CONTENT).sort()).toEqual([...OG_ROUTES].sort());
  });

  it("T-151 寸法が 1200 × 630 である", () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 });
  });

  it("T-152 どの文言にも架空である旨の脚注が入る", () => {
    for (const [route, c] of Object.entries(OG_CONTENT)) {
      expect(c.note, route).toContain("架空");
      expect(c.title.length, route).toBeGreaterThan(0);
      for (const line of c.title) {
        expect(line.length, `${route} の「${line}」`).toBeGreaterThan(0);
      }
      expect(c.subtitle.length, route).toBeGreaterThan(0);
    }
  });

  it("字を絞る対象に、実際に描く文字がすべて含まれている", () => {
    // Google Fonts に text= で絞って取りに行くので、
    // 取り漏らした字は OG 画像で豆腐になる。文言から機械的に集める。
    const glyphs = ogGlyphs();
    for (const c of Object.values(OG_CONTENT)) {
      for (const ch of c.title.join("") + c.subtitle + c.note) {
        expect(glyphs.includes(ch), `「${ch}」が字の一覧に無い`).toBe(true);
      }
    }
  });

  it("見出しの各行が上限字数に収まる(画像からはみ出さない)", () => {
    // Satori に折り返させると語の途中で割れるので、行に割ってから渡している。
    // 上限を超えた行は画像の外へ出るため、ここで止める。
    for (const [route, c] of Object.entries(OG_CONTENT)) {
      for (const line of c.title) {
        expect(line.length, `${route} の「${line}」`).toBeLessThanOrEqual(
          OG_TITLE_MAX_CHARS,
        );
      }
    }
  });

  it("字の一覧に重複が無い(取得 URL を無駄に長くしない)", () => {
    const glyphs = [...ogGlyphs()];
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });
});
