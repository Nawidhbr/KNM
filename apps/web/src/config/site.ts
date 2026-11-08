/**
 * Single source of truth for the site's name, address and indexing state.
 *
 * - SITE_URL: the canonical origin (https://www.nederlands.app). Changing the domain is this one value, or the SITE_URL
 *   environment variable in Vercel.
 * - INDEXING: "on" allows search engines to index the site. Anything else (including unset) puts noindex on every
 *   page. Preview deployments on Vercel are never indexed, whatever INDEXING says.
 */

const env = process.env;

export const SITE_URL = (env.SITE_URL ?? "https://www.nederlands.app").replace(/\/+$/, "");

const isPreview = env.VERCEL_ENV !== undefined && env.VERCEL_ENV !== "production";

export const INDEXING = env.INDEXING === "on" && !isPreview;

/** Cookieless page counts (Vercel Web Analytics), only on the production deployment. */
export const ANALYTICS = env.VERCEL_ENV === "production" && env.ANALYTICS !== "off";

export const SITE = {
  /** The working name of the site; change it here only. */
  name: "KNM",
  /**
   * The colour palette (styles/palettes.css): "oranje" (navy with orange) or "rwb" (the red, white and blue of the
   * flag). The header colour of the installed app follows it (THEME_COLOR).
   */
  palette: "oranje" as "oranje" | "rwb",
  /** The contact address. */
  email: "info@nederlands.app",
  defaultLocale: "nl",
  /**
   * Languages offered in the language menu. A language gets pages once its interface dictionary exists
   * (src/i18n/<code>.json) and it is in LIVE_LOCALES; content falls back to Dutch where a translation is missing.
   */
  languages: [
    { code: "nl", name: "Nederlands", english: "Dutch", dir: "ltr" },
    { code: "en", name: "English", english: "English", dir: "ltr" },
    { code: "ar", name: "العربية", english: "Arabic", dir: "rtl" },
    { code: "fa-af", name: "دری", english: "Dari", dir: "rtl" },
    { code: "tr", name: "Türkçe", english: "Turkish", dir: "ltr" },
    { code: "ti", name: "ትግርኛ", english: "Tigrinya", dir: "ltr" },
  ] as const,
};

/** The browser and app bar colour of each palette (the header colour). */
export const THEME_COLOR = { oranje: "#14213d", rwb: "#21468b" } as const;

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
