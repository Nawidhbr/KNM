import type { GlossaryEntry, NewsItem, ReviewState, Text, TextList, Theme, ThemeIndex, Topic } from "./schema.ts";
import themeData from "../generated/themes.json" with { type: "json" };
import topicData from "../generated/topics.json" with { type: "json" };
import glossaryData from "../generated/glossary.json" with { type: "json" };
import newsData from "../generated/news.json" with { type: "json" };
import reviewData from "../generated/reviews.json" with { type: "json" };

export * from "./schema.ts";

/**
 * The validated content. The bundles are written by `npm run validate -w @knm/content`, which fails on any content
 * error, so the site never builds on broken content.
 */

/** A text in a language, falling back to Dutch (the source) while a translation is missing. */
export const tx = (text: Text | undefined, locale: string): string => (text ? ((text as Record<string, string | undefined>)[locale] ?? text.nl) : "");
export const txl = (text: TextList | undefined, locale: string): string[] => (text ? ((text as Record<string, string[] | undefined>)[locale] ?? text.nl) : []);
/** Whether a text exists in this language (not only as the Dutch fallback). */
export const has = (text: Text | TextList | undefined, locale: string) => locale === "nl" || Boolean(text && (text as Record<string, unknown>)[locale]);

/** All eight themes, in order (with or without a course yet). */
export const getThemeIndex = (): ThemeIndex["themes"] => (themeData as { index: ThemeIndex["themes"] }).index;
/** The themes that have a course (lessons), in order. */
export const getThemes = (): Theme[] => (themeData as { courses: Theme[] }).courses;
export const getTheme = (id: string): Theme | undefined => getThemes().find((t) => t.id === id);

/** The pages of the knowledge base, by Dutch title. */
export const getTopics = (): Topic[] => topicData as Topic[];
export const getTopic = (slug: string): Topic | undefined => getTopics().find((t) => t.slug === slug);

/** The word explanations of one language (empty when it has none). */
export const getGlossary = (locale: string): { entries: GlossaryEntry[] } => (glossaryData as Record<string, { entries: GlossaryEntry[] }>)[locale] ?? { entries: [] };

/** What is changing, newest first. */
export const getNews = (): NewsItem[] => newsData as NewsItem[];

/** The review of a lesson ("<theme>-<n>") or a page ("topic:<slug>"): a draft until a teacher has reviewed it. */
export const getReview = (key: string): ReviewState => {
  const r = (reviewData as Record<string, { by: string; date: string }>)[key];
  return r ? { status: "reviewed", by: r.by, date: r.date } : { status: "draft" };
};
