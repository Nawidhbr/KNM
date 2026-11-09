#!/usr/bin/env node
/**
 * Tells Bing, Yandex and the other IndexNow engines which pages the live site has (https://www.indexnow.org).
 * Run by GitHub Actions after a production deploy (.github/workflows/indexnow.yml), at most once a day.
 * The key is public by design: the engines check that https://www.nederlands.app/<key>.txt holds it.
 */
const SITE = process.env.SITE_URL || "https://www.nederlands.app";
const KEY = "bda26c9b4ac2f5d402f1f044646c08de";

const text = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.text();
};
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

// While the site is kept out of the index (INDEXING not "on" in Vercel), there is nothing to announce.
if (/<meta name="robots" content="noindex/.test(await text(`${SITE}/nl/`))) {
  console.log("IndexNow: the live site is noindex; nothing sent");
  process.exit(0);
}
const index = await text(`${SITE}/sitemap-index.xml`);
const urls = (await Promise.all(locs(index).map(async (s) => locs(await text(s))))).flat();
const host = new URL(SITE).host;
// Batches of 100: until the engines have checked the key, larger batches are refused (UserForbiddedToAccessSite).
const BATCH = 100;
for (let i = 0; i < urls.length; i += BATCH) {
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls.slice(i, i + BATCH) }),
  });
  console.log(`IndexNow: URLs ${i + 1}–${Math.min(urls.length, i + BATCH)}, answer ${r.status}`);
  // 403: the engines have not checked the key yet (it can take a day after the first call); try again tomorrow.
  if (r.status === 403) { console.log("IndexNow: key not yet confirmed, trying again on the next run"); break; }
  if (r.status >= 400 && r.status !== 429) process.exit(1);
  await new Promise((ok) => setTimeout(ok, 500));
}
