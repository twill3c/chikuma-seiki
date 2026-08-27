/**
 * ページの一部だけを撮る(デモの検品用)。
 *
 *   MSYS_NO_PATHCONV=1 node harness/crop.mjs /technology "section:nth-of-type(5)" practice
 *
 * Git Bash は `/` で始まる引数を Windows パスに変換するので、
 * MSYS_NO_PATHCONV=1 を前置すること(HC-038)。
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

const missing = [];

const server = createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  let body = null;
  let type = "application/octet-stream";
  try {
    /*
      解決の順序が要点。out/technology は OG 画像を置くディレクトリでもあるので、
      「ディレクトリなら index.html」を先に試すと /technology が 404 になる。
      拡張子が無いときは **.html を先に**試し、それが無ければディレクトリとして扱う
      (loop_007 の TOOL-ENV)。
    */
    let p = path.join(ROOT, url);
    if (!path.extname(p)) {
      const asFile = `${p}.html`;
      try {
        await stat(asFile);
        p = asFile;
      } catch {
        p = path.join(p, "index.html");
      }
    }
    body = await readFile(p);
    type = TYPES[path.extname(p)] ?? "application/octet-stream";
  } catch {
    body = null;
  }

  // ヘッダは一度だけ。try の中で書くと、readFile の失敗後に二重送信になる
  if (body) {
    res.writeHead(200, { "content-type": type });
    res.end(body);
  } else {
    missing.push(url);
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  }
});

await new Promise((r) => server.listen(4322, r));

const [route, selector, name] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(`http://localhost:4322${route}`, { waitUntil: "networkidle" });

const element = page.locator(selector).first();
const count = await page.locator(selector).count();
if (count === 0) {
  console.log(`該当なし: ${selector}`);
} else {
  await element.screenshot({ path: `harness/shots/${name}.png` });
  console.log(`撮影 ${selector}(${count} 件中の 1 件目) → harness/shots/${name}.png`);
}

if (missing.length > 0) {
  console.log("404 になった要求:", [...new Set(missing)].join(", "));
}

await browser.close();
server.close();
