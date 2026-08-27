/**
 * ループログを数え直す(F-12)。
 *
 * `/technology` に出している制作の実測値は、この出力と一致していなければならない。
 * 架空の会社の実績と、この作品そのものの記録を混ぜないための道具である。
 *
 *   node bin/practice-stats.mjs
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const DIR = path.resolve("logs/loops");

const codes = new Map();
let loops = 0;
let commits = 0;
let maxPassed = 0;

for (const file of readdirSync(DIR).filter((f) => f.endsWith(".jsonl"))) {
  for (const line of readFileSync(path.join(DIR, file), "utf8").split("\n")) {
    if (!line.trim()) continue;
    const record = JSON.parse(line);
    if (record.event === "loop_start") loops++;
    if (record.event === "commit") commits++;
    if (record.event === "failure") {
      const code = record.data.code;
      codes.set(code, (codes.get(code) ?? 0) + 1);
    }
    if (record.event === "test_run") {
      maxPassed = Math.max(maxPassed, record.data.passed);
    }
  }
}

const failures = [...codes.values()].reduce((a, b) => a + b, 0);

console.log(`ループ数        ${loops}`);
console.log(`記録した失敗    ${failures}`);
console.log(`コミット        ${commits}`);
console.log(`テスト(最大)  ${maxPassed}`);
console.log("失敗の内訳:");
for (const [code, n] of [...codes].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${code.padEnd(14)} ${n}`);
}
