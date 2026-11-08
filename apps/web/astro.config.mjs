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
      // The root only redirects; the offline page is a fallback. Neither belongs in the sitemap.
      filter: (page) => page !== `${site}/` && !page.endsWith("/offline/"),
      i18n: { defaultLocale: SITE.defaultLocale, locales: { nl: "nl", en: "en" } },
    }),
  ],
});
