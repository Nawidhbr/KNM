import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { SITE } from "./src/config/site.ts";

const site = (process.env.SITE_URL ?? "https://www.nederlands.app").replace(/\/+$/, "");

export default defineConfig({
  site,
  trailingSlash: "always",
  build: { format: "directory" },
  // Scripts are never inlined into the page: a strict Content-Security-Policy (vercel.json) allows only files from this site.
  vite: { build: { assetsInlineLimit: 0 } },
  integrations: [
    sitemap({
      // The root only redirects; the offline page is a fallback; the buy and terms pages are not indexed.
      filter: (page) => page !== `${site}/` && !/\/(offline|unlock|terms|transfer)\/$/.test(page),
      i18n: { defaultLocale: SITE.defaultLocale, locales: { nl: "nl", en: "en" } },
    }),
  ],
});
