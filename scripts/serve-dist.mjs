// A small static server for the built site (apps/web/dist), for the end-to-end tests: serves /x/ as /x/index.html,
// answers 404 for what is not there (so /api/contact/ fails as it does without a mail service).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = normalize(process.argv[2] ?? "apps/web/dist");
const port = Number(process.argv[3] ?? 4321);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".avif": "image/avif", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain", ".webmanifest": "application/manifest+json" };

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = join(root, normalize(path).replace(/^(\.\.[/\\])+/, ""));
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
