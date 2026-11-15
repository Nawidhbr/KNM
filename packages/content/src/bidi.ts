/**
 * Right-to-left text (Dari) quotes Dutch words, abbreviations and numbers: "(gemeente)", "UWV", "0800-2000". Inside
 * right-to-left text the browser reorders such runs (a phone number after Arabic letters comes out as "2000-0800"), so
 * each Latin or digit run is wrapped in invisible isolates (U+2066 LRI … U+2069 PDI) and keeps its own order. Applied
 * to the translated content when the bundle is written (scripts/validate.ts) and to the interface text of a
 * right-to-left language (apps/web/src/i18n). Placeholders such as {email} are left alone.
 */
/** The languages written right to left among the translations. */
export const RTL_LANGS = ["fa-af", "ar"];

export const LATIN_RUN = /[A-Za-z0-9À-ɏ](?:[A-Za-z0-9À-ɏ .,:'’/&+-]*[A-Za-z0-9À-ɏ!?])?/g;

export const isolate = (text: string): string =>
  text
    .split(/(\{\w+\})/)
    .map((part, i) => (i % 2 ? part : part.replace(LATIN_RUN, (m) => `⁦${m}⁩`)))
    .join("");

/** Every string in a value (object, list or string), isolated. */
export const isolateAll = <T>(value: T): T =>
  (typeof value === "string"
    ? isolate(value)
    : Array.isArray(value)
      ? value.map(isolateAll)
      : value && typeof value === "object"
        ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, isolateAll(v)]))
        : value) as T;
