import nl from "./nl.json";
import { RTL_LANGS, isolateAll } from "@knm/content";

/** The interface text of one language, with Dutch filling any key the translation lacks. */
export type UI = typeof nl;

const dictionaries = import.meta.glob<{ default: unknown }>("./*.json", { eager: true });
const byCode: Record<string, unknown> = {};
for (const [path, mod] of Object.entries(dictionaries)) {
  const code = path.replace(/^\.\/(.*)\.json$/, "$1");
  // Right-to-left languages: Latin words and numbers in the text keep their own order (@knm/content bidi).
  byCode[code] = RTL_LANGS.includes(code) ? isolateAll(mod.default) : mod.default;
}

const merge = (base: any, over: any): any => {
  if (typeof base !== "object" || base === null) return typeof over === typeof base ? over : base;
  const out: any = Array.isArray(base) ? [...base] : { ...base };
  for (const k of Object.keys(base)) if (over && k in over) out[k] = merge(base[k], over[k]);
  return out;
};

const cache = new Map<string, UI>();
export function t(locale: string): UI {
  if (!cache.has(locale)) cache.set(locale, locale === "nl" ? nl : merge(nl, byCode[locale] ?? {}));
  return cache.get(locale)!;
}

/** Search titles and descriptions of the main pages (`seo` in a dictionary, by path); only a language's own counts. */
export function seoFor(locale: string, path: string): { title?: string; description?: string } | undefined {
  return (byCode[locale] as any)?.seo?.[path];
}

/** Fill {placeholders}. */
export function fmt(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** The locale for dates and numbers: Dari with the Gregorian calendar (the default for fa-AF is the solar Hijri one). */
export const intlLocale = (locale: string) => (locale === "fa-af" ? "fa-AF-u-ca-gregory" : locale === "en" ? "en-GB" : locale === "nl" ? "nl-NL" : locale);

export const RTL = new Set(["ar", "fa-af", "ur", "fa"]);
export const dirOf = (locale: string) => (RTL.has(locale) ? "rtl" : "ltr");

/** Languages with pages: Dutch (the exam language and the source), English and Dari. More follow once their interface exists. */
export const LIVE_LOCALES: string[] = ["nl", "en", "fa-af"].filter((c) => c in byCode);

/**
 * Parts of the site whose content is not translated yet into a language: their pages there show the Dutch (marked
 * lang="nl"), put their canonical on the Dutch page, name no other languages and stay out of the sitemap (the filter
 * in astro.config.mjs). Remove a part once its content is translated.
 */
export const UNTRANSLATED: Record<string, string[]> = { "fa-af": ["/topics/", "/news/", "/glossary/"] };
export const untranslated = (locale: string, path: string) => (UNTRANSLATED[locale] ?? []).some((p) => path.startsWith(p));
/** Attributes for Dutch content shown on a page of another language (a missing translation). */
export const dutchAttrs = (locale: string, translated: boolean) => (translated || locale === "nl" ? {} : { lang: "nl", dir: "ltr" as const });

export const localePaths = () => LIVE_LOCALES.map((locale) => ({ params: { locale } }));
