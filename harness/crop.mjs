/** ページの一部だけを撮る(デモの検品用) */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("out");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".txt": "text/plain", ".woff2": "font/woff2", ".json": "application/json" };
const server = createServer(async (req, res) => {
  try {
    let p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
    try { if ((await stat(p)).isDirectory()) p = path.join(p, "index.html"); }
    catch { if (!path.extname(p)) p += ".html"; }
    res.writeHead(200, { "content-type": TYPES[path.extname(p)] ?? "application/octet-stream" });
    res.end(await readFile(p));
  } catch { res.writeHead(404).end("not found"); }
});
await new Promise((r) => server.listen(4322, r));

const [route, selector, name] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(`http://localhost:4322${route}`, { waitUntil: "networkidle" });
const el = await page.locator(selector).first();
await el.screenshot({ path: `harness/shots/${name}.png` });
console.log(`撮影 ${selector} → harness/shots/${name}.png`);
await browser.close();
server.close();
