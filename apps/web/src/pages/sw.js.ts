import type { APIRoute } from "astro";
import { offlinePages } from "../lib/routes";
import { LIVE_LOCALES } from "../i18n";

/**
 * The service worker. Each build gets a new version, so a deploy replaces the
 * offline copy. Pages: network first, then the offline copy. Hashed assets
 * and fonts: cache first. Analytics is never cached. Only the reader's own
 * language is saved for offline use: the page registers "/sw.js?lang=<code>",
 * so switching language installs a fresh copy for that language.
 */
export const GET: APIRoute = () => {
  const version = new Date().toISOString();
  const pages = Object.fromEntries(LIVE_LOCALES.map((l) => [l, offlinePages(l)]));
  const body = `/* KNM service worker, built ${version} */
const VERSION = ${JSON.stringify(version)};
const BY_LOCALE = ${JSON.stringify(pages)};
const LANG = BY_LOCALE[new URL(self.location.href).searchParams.get("lang")] ? new URL(self.location.href).searchParams.get("lang") : "nl";
const PAGES = BY_LOCALE[LANG];
const STATIC = ${JSON.stringify(["/favicon.svg", "/icons/icon-192.png", "/manifest.webmanifest"])}.concat("/" + LANG + "/search.json", "/" + LANG + "/glossary.json", "/" + LANG + "/practice/questions.json");
const CACHE = "knm-" + VERSION;
const FONTS = "knm-fonts";
// Pages read online are kept here across versions (the newest 200), so they open offline too.
const VISITED = "knm-visited";
// Hashed stylesheets and scripts never change, so they are kept across versions too (an older saved page still finds its own).
const ASSETS = "knm-assets";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(STATIC);
    // The pages, and the stylesheets and scripts they use.
    const assets = new Set();
    for (const url of PAGES) {
      try {
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) continue;
        const html = await res.clone().text();
        for (const m of html.matchAll(/(?:href|src)="(\\/(?:_astro\\/|[a-z]{2}\\/study-data\\.js)[^"]+)"/g)) assets.add(m[1].replace(/&amp;/g, "&"));
        await cache.put(url, res);
      } catch {}
    }
    const assetCache = await caches.open(ASSETS);
    await Promise.all([...assets].map(async (a) => { if (!(await assetCache.match(a))) await assetCache.add(a).catch(() => {}); }));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE && key !== FONTS && key !== VISITED && key !== ASSETS) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/_vercel/")) return;

  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) event.waitUntil(keepVisited(url.pathname, res.clone()));
        return res;
      } catch {
        return (await caches.match(req, { ignoreSearch: true })) || (await caches.match("/" + LANG + "/offline/")) || Response.error();
      }
    })());
    return;
  }
  if (url.pathname.startsWith("/_astro/") || /^\\/[a-z]{2}\\/study-data\\.js$/.test(url.pathname)) {
    event.respondWith(cacheFirst(req, ASSETS));
  } else if (url.pathname.startsWith("/icons/") || STATIC.includes(url.pathname)) {
    event.respondWith(cacheFirst(req, CACHE));
  }
});

async function keepVisited(path, res) {
  const cache = await caches.open(VISITED);
  await cache.delete(path);
  await cache.put(path, res);
  const keys = await cache.keys();
  for (const old of keys.slice(0, Math.max(0, keys.length - 200))) await cache.delete(old);
}

async function cacheFirst(req, name) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") (await caches.open(name)).put(req, res.clone());
  return res;
}
`;
  return new Response(body, { headers: { "Content-Type": "text/javascript; charset=utf-8" } });
};
