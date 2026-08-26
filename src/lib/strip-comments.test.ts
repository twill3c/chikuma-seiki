import { describe, expect, it } from "vitest";
import { stripComments } from "./strip-comments";

/*
  架空明示ゲートの前処理。ここが誤ると、ゲートは
  「見逃す」(危険)か「正しい実装を落とす」(邪魔)のどちらかになる。
*/

describe("コメント除去", () => {
  it("行コメントを落とす", () => {
    expect(stripComments("const a = 1; // 番地は書かない")).toBe(
      "const a = 1; ",
    );
  });

  it("ブロックコメントを落とす", () => {
    expect(stripComments("a /* 認証番号 */ b")).toBe("a  b");
  });

  it("文字列の中の // を落とさない(URL が壊れる)", () => {
    const src = 'const u = "https://example.test/x"; // 註';
    expect(stripComments(src)).toBe('const u = "https://example.test/x"; ');
  });

  it("文字列の中の /* を落とさない", () => {
    expect(stripComments('const s = "/* not a comment */";')).toBe(
      'const s = "/* not a comment */";',
    );
  });

  it("テンプレートリテラルを保つ", () => {
    expect(stripComments("const s = `a // b`;")).toBe("const s = `a // b`;");
  });

  it("エスケープされた引用符で状態が壊れない", () => {
    const src = 'const s = "he said \\"hi\\""; // 註';
    expect(stripComments(src)).toBe('const s = "he said \\"hi\\""; ');
  });

  it("行番号がずれない(改行を温存する)", () => {
    const src = "a\n/* 註\n註 */\nb";
    expect(stripComments(src).split("\n").length).toBe(src.split("\n").length);
  });

  it("コメントの外にある禁止語は残る(ゲートを素通りさせない)", () => {
    const src = 'const addr = "佐久市中込1丁目2番3号"; // 註';
    expect(stripComments(src)).toContain("丁目");
  });
});
