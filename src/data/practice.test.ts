import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  FAILURE_BREAKDOWN,
  PRACTICE_STATS,
  PRINCIPLES,
} from "./practice";

/*
  /technology に出している制作の実測値は、**この作品そのものの記録**である。
  架空の会社の実績と混ぜてはならない(SPEC §6)。

  したがって、画面に出す数字はループログを数え直した値と一致していなければ
  ならない。ここが合わなくなったら、数字を直すのではなく
  「いつの時点の値か」を書き換えること。
*/

const LOOP_DIR = path.resolve(__dirname, "../../logs/loops");

function readLoopLog() {
  const codes = new Map<string, number>();
  let loops = 0;
  for (const file of readdirSync(LOOP_DIR).filter((f) => f.endsWith(".jsonl"))) {
    for (const line of readFileSync(path.join(LOOP_DIR, file), "utf8").split(
      "\n",
    )) {
      if (!line.trim()) continue;
      const record = JSON.parse(line);
      if (record.event === "loop_start") loops++;
      if (record.event === "failure") {
        const code = record.data.code as string;
        codes.set(code, (codes.get(code) ?? 0) + 1);
      }
    }
  }
  return { loops, codes };
}

/** 「SPEC-GAP/AMB」のような略記を、実際の分類コードに展開する */
function expandCodes(code: string): string[] {
  const parts = code.split("/");
  const [prefix] = parts[0].split("-");
  return parts.map((p) => (p.includes("-") ? p : `${prefix}-${p}`));
}

describe("開発の進め方(F-12)", () => {
  it("ログの走査対象が実際に見つかっている", () => {
    expect(readdirSync(LOOP_DIR).filter((f) => f.endsWith(".jsonl")).length)
      .toBeGreaterThan(0);
  });

  it("画面に出すループ数がログと一致する", () => {
    // 数字が合わなくなったら、数字ではなく「いつ時点か」を直す
    expect(PRACTICE_STATS.loops).toBe(readLoopLog().loops);
  });

  it("失敗の内訳の合計が、記録した失敗の総数と一致する", () => {
    const sum = FAILURE_BREAKDOWN.reduce((a, b) => a + b.count, 0);
    expect(sum).toBe(PRACTICE_STATS.failures);
  });

  it("画面に出す失敗の総数がログと一致する", () => {
    // 架空の実績と、この作品そのものの記録を混ぜないための検査。
    // ループを回すたびに増えるので、ループの終わりに数え直して更新する。
    const { codes } = readLoopLog();
    const logged = [...codes.values()].reduce((a, b) => a + b, 0);
    expect(
      PRACTICE_STATS.failures,
      `画面 ${PRACTICE_STATS.failures} 件 / ログ ${logged} 件`,
    ).toBe(logged);
  });

  it("分類ごとの件数がログと一致する", () => {
    const { codes } = readLoopLog();
    for (const row of FAILURE_BREAKDOWN) {
      // 「SPEC-GAP/AMB」のように複数の分類をまとめて出している行がある
      const total = expandCodes(row.code).reduce(
        (sum, code) => sum + (codes.get(code) ?? 0),
        0,
      );
      expect(
        total,
        `${row.label}(${row.code}): 画面 ${row.count} / ログ ${total}`,
      ).toBe(row.count);
    }
  });

  it("内訳に挙げた分類が、実際にログに現れたものだけである", () => {
    const seen = new Set(readLoopLog().codes.keys());
    for (const row of FAILURE_BREAKDOWN) {
      const found = expandCodes(row.code).some((c) => seen.has(c));
      expect(found, `${row.code} がログに無い`).toBe(true);
    }
  });

  it("どの原則にも、このサイトでの実例が付いている", () => {
    for (const p of PRINCIPLES) {
      expect(p.body.length, p.id).toBeGreaterThan(40);
      expect(p.example.length, p.id).toBeGreaterThan(30);
    }
  });

  it("原則の ID が一意である", () => {
    const ids = PRINCIPLES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
