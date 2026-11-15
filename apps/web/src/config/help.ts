import { HELP_LANGS } from "@knm/content";

/**
 * Help translations: on the Dutch pages, a translation folded under each paragraph and question of a lesson, for
 * learners who read Dutch with difficulty (content: packages/content/i18n/<code>/themes/). The reader turns one on in
 * the settings menu or on a lesson (localStorage `help`, set on <html> as data-help before paint by head-settings.js).
 * The exam stays Dutch only, like the real one.
 */
export const HELP = [
  /** Dari, Afghan Persian: the name in its own script, the HTML language tag, and the name in Dutch. */
  {
    code: "fa-af",
    lang: "fa-AF",
    name: "دری",
    nl: "Dari",
    /** Shown above a translated lesson: a draft, and the exam is in Dutch. */
    note: "ترجمۀ کمکی به دری: زیر هر بخش، روی «دری» بزنید. این ترجمه هنوز بررسی نشده است. امتحان KNM به زبان هالندی است، پس متن هالندی را بخوانید و از ترجمه تنها برای فهمیدن استفاده کنید.",
    noteChecked: "ترجمۀ کمکی به دری، بررسی شده توسط {by}. امتحان KNM به زبان هالندی است، پس متن هالندی را بخوانید و از ترجمه تنها برای فهمیدن استفاده کنید.",
  },
] as const satisfies readonly { code: (typeof HELP_LANGS)[number]; lang: string; name: string; nl: string; note: string; noteChecked: string }[];
export type Help = (typeof HELP)[number];

/** The help languages shown on a page of this locale: only the Dutch pages have them. */
export const helpFor = (locale: string): readonly Help[] => (locale === "nl" ? HELP : []);
