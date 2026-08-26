import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { stripComments } from "./strip-comments";

/*
  架空明示ゲート(SPEC §6)。この作品は実在しない製造業の会社を名乗る。
  製造業のサイトは飲食店より実在誤認の害が大きい(取引・与信・採用に使われうる)ので、
  「うっかり書いたら落ちる」状態をテストで維持する。

  走査対象は出荷されるソースのみ。*.test.ts は禁止パターンを regex として
  持たざるを得ないので除外する(ブラウザに出ない)。

  **コメントも走査対象から外す。** 最初はソースを生のまま行単位で見ていたが、
  「番地を持たない」「Math.random を使わない」と方針を書いたコメント自体が
  禁止語に当たり、正しい実装が落ちた(VERIF-FALSE / loop_001)。
  コメントはバンドル時に落ちて読者に届かないので、ゲートが見るべきものではない。
*/

const SRC = path.resolve(__dirname, "..");
const SHIPPED = /\.(ts|tsx|css)$/;
const EXCLUDED = /\.test\.ts$/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const allFiles = walk(SRC);
const shippedFiles = allFiles.filter(
  (f) => SHIPPED.test(f) && !EXCLUDED.test(f),
);

/** 禁止パターンに触れた「ファイル:行」を返す */
function offenders(pattern: RegExp): string[] {
  const hits: string[] = [];
  for (const file of shippedFiles) {
    const lines = stripComments(readFileSync(file, "utf8")).split("\n");
    lines.forEach((line, i) => {
      if (pattern.test(line)) {
        hits.push(`${path.relative(SRC, file)}:${i + 1}  ${line.trim()}`);
      }
    });
  }
  return hits;
}

describe("架空明示ゲート — 走査対象(前提の検算)", () => {
  it("走査すべきファイルが実際に見つかっている", () => {
    // 0 件なら「合格」ではなく「検査していない」。前提を assert で固定する。
    expect(shippedFiles.length).toBeGreaterThan(0);
  });
});

describe("架空明示ゲート(T-020〜T-024 / SPEC §6・N-02)", () => {
  it("T-020 写真素材を一枚も持たない(図版はすべて SVG)", () => {
    const photos = allFiles.filter((f) =>
      /\.(jpe?g|png|webp|avif|gif)$/i.test(f),
    );
    expect(photos.map((f) => path.relative(SRC, f))).toEqual([]);
  });

  it("T-021 電話番号・FAX 番号を書かない", () => {
    expect(offenders(/0\d{1,4}-\d{1,4}-\d{4}/)).toEqual([]);
  });

  it("T-022 番地を書かない(実在の区画を指さない)", () => {
    expect(offenders(/丁目|番地|\d+番\d+号/)).toEqual([]);
  });

  it("T-023 認証番号・登録番号を書かない(認証詐称の防止)", () => {
    expect(offenders(/認証番号|登録番号|registration number/i)).toEqual([]);
  });

  it("T-024 資本金・売上高の額を書かない(与信情報として誤用されうる)", () => {
    expect(offenders(/(資本金|売上高)[^。\n]{0,24}(億|万|円)/)).toEqual([]);
  });
});

describe("図版の決定性(T-031 / N-03)", () => {
  it("T-031 Math.random を使わない(静的書き出しと再描画で同じ絵になる)", () => {
    expect(offenders(/Math\.random/)).toEqual([]);
  });
});
