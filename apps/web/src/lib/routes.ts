import { getTopics } from "@knm/content";
import { lessonPath, themePath, themes } from "./course";

/** Pages saved for offline use when the app is installed, in one language: the whole course and the main pages. */
export function offlinePages(locale = "nl"): string[] {
  return [
    `/${locale}/`,
    `/${locale}/study/`,
    ...themes().flatMap((t) => [themePath(locale, t.id), ...t.lessons.map((l) => lessonPath(locale, t.id, l.n))]),
    `/${locale}/practice/`,
    `/${locale}/glossary/`,
    `/${locale}/topics/`,
    ...getTopics().map((t) => `/${locale}/topics/${t.slug}/`),
    `/${locale}/news/`,
    `/${locale}/about/`,
    `/${locale}/privacy/`,
    `/${locale}/offline/`,
  ];
}
