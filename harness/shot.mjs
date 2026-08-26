/**
 * 静的書き出しを実ブラウザで開いて撮る(目視検品用)。
 * sugi-nami で「暗い図を暗い背景に置くと絵に見えない」を踏んでいるので、
 * ビルドが通ったことと絵が読めることを別に確かめる。
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("out");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

const server = createServer(async (req, res) => {
  try {
    let p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
    try {
      if ((await stat(p)).isDirectory()) p = path.join(p, "index.html");
    } catch {
      if (!path.extname(p)) p += ".html";
    }
    const body = await readFile(p);
    res.writeHead(200, { "content-type": TYPES[path.extname(p)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
});

await new Promise((r) => server.listen(4321, r));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

for (const route of process.argv.slice(2).length ? process.argv.slice(2) : ["/"]) {
  await page.goto(`http://localhost:4321${route}`, { waitUntil: "networkidle" });
  const name = route === "/" ? "home" : route.replace(/\//g, "-").slice(1);
  await page.screenshot({ path: `harness/shots/${name}.png`, fullPage: true });
  console.log(`撮影 ${route} → harness/shots/${name}.png`);
}

console.log(errors.length ? `コンソールエラー ${errors.length} 件:\n` + errors.join("\n") : "コンソールエラーなし");
await browser.close();
server.close();
