import nl from "./nl.json";

/** The interface text of one language, with Dutch filling any key the translation lacks. */
export type UI = typeof nl;

const dictionaries = import.meta.glob<{ default: unknown }>("./*.json", { eager: true });
const byCode: Record<string, unknown> = {};
for (const [path, mod] of Object.entries(dictionaries)) byCode[path.replace(/^\.\/(.*)\.json$/, "$1")] = mod.default;

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

export const RTL = new Set(["ar", "fa-af", "ur", "fa"]);
export const dirOf = (locale: string) => (RTL.has(locale) ? "rtl" : "ltr");

/** Languages with pages: Dutch (the exam language and the source) and English. More follow once their interface exists. */
export const LIVE_LOCALES: string[] = ["nl", "en"].filter((c) => c in byCode);

export const localePaths = () => LIVE_LOCALES.map((locale) => ({ params: { locale } }));
