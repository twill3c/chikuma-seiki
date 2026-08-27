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

/**
 * 禁止パターン。**悪い例と良い例を必ず対にして持つ。**
 *
 * loop_005 で、番地のパターンを単語「番地」だけにしていたため
 * 「番地は掲載していません」という本文自体を撃った(VERIF-FALSE)。
 * 実際の住所は必ず数字を伴うので、数字を要求する形に絞ってある。
 *
 * 絞ると今度は空振りしやすくなる。そこで各パターンに
 * `catches`(必ず捕まえるべき文字列)と `allows`(撃ってはならない文字列)を
 * 持たせ、パターン自身を検査する(T-025)。
 */
const RULES = [
  {
    id: "T-021",
    name: "電話番号・FAX 番号",
    // 末尾を 4 桁に固定していたため、フリーダイヤル(0120-000-000)を
    // 取りこぼしていた。T-025 を足した初回に判明(loop_005 の VERIF-GAP)
    pattern: /0\d{1,4}-\d{2,4}-\d{3,4}/,
    catches: [
      "0267-00-0000",
      "03-1234-5678",
      "TEL 0120-000-000",
      "0800-000-0000",
    ],
    allows: ["2026-08-27", "CTL-2635-128", "SNS-0407-003", "クラス 10000"],
  },
  {
    id: "T-022",
    name: "番地",
    pattern:
      /\d+\s*丁目|\d+\s*番地|\d+\s*番\s*\d+\s*号|(?:市|区|町|村)[^\s、。「」]{0,12}\d+[-−ー]\d+/,
    catches: [
      "佐久市中込 1 丁目",
      "岩村田 2500 番地",
      "3 番 12 号",
      "佐久市岩村田1-2-3",
    ],
    allows: [
      "番地・電話番号・資本金は掲載していません",
      "番地も地図のピンも持っていません",
      "長野県佐久市",
      "佐久インターチェンジ付近の工業団地内",
    ],
  },
  {
    id: "T-023",
    name: "認証番号・登録番号",
    pattern: /認証番号|登録番号|registration number/i,
    catches: ["認証番号 JQA-0000", "Registration Number 12345"],
    allows: ["いかなる認証も取得していません", "ISO 14644 クラス 7"],
  },
  {
    id: "T-024",
    name: "資本金・売上高の額",
    pattern: /(資本金|売上高)[^。\n]{0,24}(億|万|円)/,
    catches: ["資本金 4,800 万円", "売上高は約 32 億円です"],
    allows: ["資本金は掲載していません", "売上高の開示は行っていません"],
  },
] as const;

describe("架空明示ゲート(T-020〜T-025 / SPEC §6・N-02)", () => {
  it("T-020 写真素材を一枚も持たない(図版はすべて SVG)", () => {
    const photos = allFiles.filter((f) =>
      /\.(jpe?g|png|webp|avif|gif)$/i.test(f),
    );
    expect(photos.map((f) => path.relative(SRC, f))).toEqual([]);
  });

  for (const rule of RULES) {
    it(`${rule.id} ${rule.name}を書かない`, () => {
      expect(offenders(rule.pattern)).toEqual([]);
    });
  }

  it("T-025 各パターンが悪い例を確かに捕まえる(ゲートの空振り防止)", () => {
    // 絞ったパターンが何も捕まえなくなっていないか。
    // 「違反 0 件」が「検査していない」を意味しないための検査。
    for (const rule of RULES) {
      for (const bad of rule.catches) {
        expect(rule.pattern.test(bad), `${rule.id} が「${bad}」を見逃す`).toBe(
          true,
        );
      }
    }
  });

  it("T-025 各パターンが正当な文章を撃たない(誤検出の防止)", () => {
    for (const rule of RULES) {
      for (const good of rule.allows) {
        expect(rule.pattern.test(good), `${rule.id} が「${good}」を撃つ`).toBe(
          false,
        );
      }
    }
  });
});

describe("図版の決定性(T-031 / N-03)", () => {
  it("T-031 Math.random を使わない(静的書き出しと再描画で同じ絵になる)", () => {
    expect(offenders(/Math\.random/)).toEqual([]);
  });
});
