/**
 * Help texts beside the lesson, folded under each paragraph and question, turned on by the reader (lesson button or
 * settings switch; localStorage `help` holds the codes turned on, set on <html> as data-help before paint by
 * head-settings.js). The exam has none, like the real one.
 *
 * - On the Dutch pages: a translation, for learners who read Dutch with difficulty (content:
 *   packages/content/i18n/<code>/themes/). Dari is the first.
 * - On the pages of a translated language: the Dutch original, since the exam is in Dutch.
 */
export interface Help {
  /** The language of the help text: its code in the content, its HTML tag and direction. */
  code: string;
  lang: string;
  dir: "ltr" | "rtl";
  /** Its name in its own language, and in the language of the page. */
  name: string;
  label: string;
  /** Shown above a lesson that has it, in the reader's language (noteLang): what it is and, for a translation, that it is a draft. */
  note: string;
  noteChecked: string;
  noteLang: string;
  noteDir: "ltr" | "rtl";
}

const DARI_NOTE = "امتحان KNM به زبان هالندی است، پس متن هالندی را بخوانید و از ترجمه تنها برای فهمیدن استفاده کنید.";

export const HELP: Record<string, Help[]> = {
  nl: [
    {
      code: "fa-af", lang: "fa-AF", dir: "rtl", name: "دری", label: "Dari",
      note: `ترجمۀ کمکی به دری: زیر هر بخش، روی «دری» بزنید. این ترجمه هنوز بررسی نشده است. ${DARI_NOTE}`,
      noteChecked: `ترجمۀ کمکی به دری، بررسی شده توسط {by}. ${DARI_NOTE}`,
      noteLang: "fa-AF", noteDir: "rtl",
    },
  ],
  "fa-af": [
    {
      code: "nl", lang: "nl", dir: "ltr", name: "Nederlands", label: "هالندی",
      note: "متن اصلی هالندی: زیر هر بخش، روی «Nederlands» بزنید. امتحان KNM به زبان هالندی است، پس واژه_های هالندی را هم یاد بگیرید.".replace(/_/g, "‌"),
      noteChecked: "",
      noteLang: "fa-AF", noteDir: "rtl",
    },
  ],
};

/** The help languages shown on a page of this locale. */
export const helpFor = (locale: string): readonly Help[] => HELP[locale] ?? [];
