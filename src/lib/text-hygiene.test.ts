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

/**
 * 行単位の除外マーカー。
 *
 * 混入した実例を文書に残そうとすると、その行が検査に引っかかる
 * (loop_007 で AGENTS.md がそうなった)。実例を消すと教訓が痩せるので、
 * **その行だけ**明示的に除外できるようにする。
 *
 * ただし黙って増えると検査が骨抜きになるので、
 * **マーカーが実際に必要かどうかも検査する**(不要なマーカーは落とす)。
 *
 * マーカーは**コメントの形**でなければ効かない。ただの文字列として認めると、
 * この仕組みを説明した散文(「`text-hygiene:allow` を付ける」)まで
 * 印が付いたことになり、その行が「不要なマーカー」として落ちてしまう。
 */
const ALLOW = /(?:<!--|\/\/|\/\*)\s*text-hygiene:allow/;

type Hit = { location: string; line: string; allowed: boolean };

function scan(pattern: RegExp): Hit[] {
  const hits: Hit[] = [];
  for (const file of files) {
    if (file.endsWith(SELF)) continue;
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        if (pattern.test(line)) {
          hits.push({
            location: `${path.relative(ROOT, file)}:${i + 1}`,
            line: line.trim().slice(0, 80),
            allowed: ALLOW.test(line),
          });
        }
      });
  }
  return hits;
}

/** マーカーの付いた全行(混入の有無を問わない) */
function markedLines(): { location: string; line: string }[] {
  const marked: { location: string; line: string }[] = [];
  for (const file of files) {
    if (file.endsWith(SELF)) continue;
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        if (ALLOW.test(line)) {
          marked.push({
            location: `${path.relative(ROOT, file)}:${i + 1}`,
            line: line.trim().slice(0, 80),
          });
        }
      });
  }
  return marked;
}

describe("文字種の検査(HC-037)", () => {
  it("走査対象が実際に見つかっている", () => {
    // 0 件なら「合格」ではなく「検査していない」
    expect(files.length).toBeGreaterThan(10);
  });

  for (const [name, pattern] of Object.entries(FOREIGN)) {
    it(`日本語の本文に${name}が混ざらない`, () => {
      const hits = scan(pattern)
        .filter((h) => !h.allowed)
        .map((h) => `${h.location}  ${h.line}`);
      expect(hits).toEqual([]);
    });
  }

  it("除外マーカーが実際に必要な行にだけ付いている(骨抜き防止)", () => {
    const needed = new Set(
      Object.values(FOREIGN)
        .flatMap((p) => scan(p))
        .filter((h) => h.allowed)
        .map((h) => h.location),
    );
    const stale = markedLines()
      .filter((m) => !needed.has(m.location))
      .map((m) => `${m.location}  ${m.line}`);
    expect(stale, "混入していない行に除外マーカーが付いている").toEqual([]);
  });

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
