/**
 * 本番の実測。デプロイのたびに叩く。
 *
 *   node bin/check-production.mjs
 *
 * ビルドが通ったことと、本番で正しく配信されていることは別である。
 * 実際、OG 画像は 200 で返っていたが Content-Type が
 * application/octet-stream になっており、プレビューに出なかった。
 */
const BASE = "https://chikuma-seiki.vercel.app";

const PAGES = [
  "/",
  "/business",
  "/facility",
  "/technology",
  "/quality",
  "/company",
  "/recruit",
  "/contact",
];

const IMAGES = ["/opengraph-image", "/technology/opengraph-image"];

let failed = 0;

for (const path of PAGES) {
  const res = await fetch(BASE + path);
  const html = await res.text();
  const checks = {
    "200": res.status === 200,
    "架空明示": html.includes("架空の企業"),
    "img 0 個": !/<img[\s>]/.test(html),
    "フッタ 5 項目": (html.match(/class="sep"/g) ?? []).length === 4,
    "禁止語なし": !/\d+\s*丁目|\d+\s*番地|0\d{1,4}-\d{2,4}-\d{3,4}|認証番号/.test(html),
  };
  const bad = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  if (bad.length > 0) failed++;
  console.log(
    `${path.padEnd(14)} ${bad.length === 0 ? "OK" : "NG: " + bad.join(", ")}`,
  );
}

for (const path of IMAGES) {
  const res = await fetch(BASE + path);
  const type = res.headers.get("content-type") ?? "";
  const ok = res.status === 200 && type.startsWith("image/png");
  if (!ok) failed++;
  console.log(`${path.padEnd(30)} ${res.status} ${type} ${ok ? "OK" : "NG"}`);
}

console.log(failed === 0 ? "\nすべて合格" : `\n${failed} 件が不合格`);
process.exitCode = failed === 0 ? 0 : 1;
