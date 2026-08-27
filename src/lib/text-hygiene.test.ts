import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/*
  文字種の検査(HC-037)。

  日本語の本文にキリル文字やハングルが混ざる事故は、**字形が似ていて
  目視では見つからない**。loop_006 で実際に「измерение」が採用ページの
  本文に混入した。型検査も build も通り、レビューも素通りする。

  HC-037 が senoto-mori で記録済みの型だが、当該 HC は Proposed のまま
  未展開で、このプロジェクトに検査が無かった。ここで新設する。

  HC-041 に従い、**陽性対照**を対で置く。走査対象が空でないことも確かめる。
*/

const ROOT = path.resolve(__dirname, "../..");
const SCAN_DIRS = ["src", "."];
const SCAN_EXT = /\.(ts|tsx|css|md)$/;
const SKIP = /node_modules|\.next|out|harness[\\/]shots|logs[\\/]/;

function walk(dir: string, depth = 0): string[] {
  if (depth > 6) return [];
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (SKIP.test(full)) return [];
    try {
      return statSync(full).isDirectory() ? walk(full, depth + 1) : [full];
    } catch {
      return [];
    }
  });
}

const files = [
  ...new Set(
    SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d), d === "." ? 5 : 0)).filter(
      (f) => SCAN_EXT.test(f),
    ),
  ),
];

/** 混ざってはならない文字。この作品は日本語と英数字だけで書く */
const FOREIGN = {
  キリル: /[Ѐ-ӿ]/,
  ハングル: /[가-힣ᄀ-ᇿ]/,
  タイ: /[฀-๿]/,
} as const;

/** この検査自身は禁止文字を持たざるをえないので除外する */
const SELF = "text-hygiene.test.ts";

describe("文字種の検査(HC-037)", () => {
  it("走査対象が実際に見つかっている", () => {
    // 0 件なら「合格」ではなく「検査していない」
    expect(files.length).toBeGreaterThan(10);
  });

  for (const [name, pattern] of Object.entries(FOREIGN)) {
    it(`日本語の本文に${name}が混ざらない`, () => {
      const hits: string[] = [];
      for (const file of files) {
        if (file.endsWith(SELF)) continue;
        readFileSync(file, "utf8")
          .split("\n")
          .forEach((line, i) => {
            if (pattern.test(line)) {
              hits.push(
                `${path.relative(ROOT, file)}:${i + 1}  ${line.trim().slice(0, 80)}`,
              );
            }
          });
      }
      expect(hits).toEqual([]);
    });
  }

  it("各パターンが実際に混入を捕まえる(陽性対照)", () => {
    // 字形が似ているので、目で見ても違いが分からない。
    // 下の 3 行はいずれも日本語の文に他言語の文字が混ざったもの。
    expect(FOREIGN.キリル.test("実測ではなく измерение を信じる")).toBe(true);
    expect(FOREIGN.ハングル.test("段取り替えの 시간 を削る")).toBe(true);
    expect(FOREIGN.タイ.test("検査の ตรวจสอบ 記録")).toBe(true);
  });

  it("正しい日本語・英数字を撃たない", () => {
    for (const good of [
      "段取り替えの時間を削る",
      "AOI の判定しきい値を機種ごとに詰める",
      "Chikuma Seiki Co., Ltd.",
      "ISO 14644 クラス 7 / 209E クラス 10000",
    ]) {
      for (const [name, pattern] of Object.entries(FOREIGN)) {
        expect(pattern.test(good), `${name} が「${good}」を撃つ`).toBe(false);
      }
    }
  });
});
