import { z } from "zod";

/**
 * The content of the KNM course. Dutch (nl) is the source language: the exam is in Dutch. English (en) is the first
 * translation. Every text field is an object with one string per language; a language may be missing while a
 * translation is under way (the page then shows the Dutch). All content is a draft until a qualified teacher has
 * reviewed it (reviews.json).
 *
 * The eindtermen (attainment targets) are those of Staatscourant 2024, 15802, in force since 1 July 2025: eight
 * themes, each with crucial actions ("cruciale handelingen", e.g. 1.1) and the knowledge they need (e.g. 1.1.2).
 */

export const LOCALES = ["nl", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** One string per language; Dutch is required. */
export const Text = z.object({ nl: z.string().min(1), en: z.string().min(1).optional() });
export type Text = z.infer<typeof Text>;
/** A list of strings per language (paragraphs, answer options). */
export const TextList = z.object({ nl: z.array(z.string().min(1)).min(1), en: z.array(z.string().min(1)).min(1).optional() });
export type TextList = z.infer<typeof TextList>;

/** An eindterm code: theme.action (1.1) or theme.action.knowledge (1.1.2). */
export const Code = z.string().regex(/^[1-8]\.\d+(\.\d+)?$/);

export const Source = z.object({ title: z.string().min(1), url: z.string().url() });
export type Source = z.infer<typeof Source>;

/** A date, YYYY-MM-DD. */
export const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * The eindtermen themselves (eindtermen.json, from the Staatscourant): per theme its crucial actions (1.1), each with
 * the knowledge it needs (1.1.1) and the concrete indicators of that knowledge. Every code used in the content must
 * be one of these.
 */
export const Eindtermen = z.object({
  source: z.string().min(1),
  url: z.string().url(),
  themes: z.array(z.object({
    n: z.number().int().min(1).max(8),
    title: z.string().min(1),
    goal: z.string().min(1),
    actions: z.array(z.object({
      code: Code,
      text: z.string().min(1),
      knowledge: z.array(z.object({ code: Code, text: z.string().min(1), indicators: z.array(z.string().min(1)) })).min(1),
    })).min(1),
  })).length(8),
});
export type Eindtermen = z.infer<typeof Eindtermen>;

/** One question of a lesson's test: three options, one right, tied to the eindterm it tests. */
export const Question = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** The knowledge item it tests (1.1.2), or a crucial action (1.1) when it tests the action as a whole. */
  eindterm: Code,
  /** Which of the lesson's sources (its index in `sources`) the right answer was checked against. */
  source: z.number().int().min(0).optional(),
  prompt: Text,
  options: TextList,
  answer: z.number().int().min(0),
  explanation: Text,
});
export type Question = z.infer<typeof Question>;

/** A lesson: one crucial action of the eindtermen (or part of one), taught in a few short paragraphs, with a test. */
export const Lesson = z.object({
  n: z.number().int().min(1),
  /** The crucial action(s) the lesson teaches, e.g. ["1.1"]. */
  handeling: z.array(Code).min(1),
  title: Text,
  /** One sentence that sets the scene ("Ahmed is looking for work…"). */
  situation: Text,
  body: TextList,
  /** The one rule to remember, with the why. */
  remember: Text,
  sources: z.array(Source).min(1),
  /** The day the lesson and its questions were last checked against the sources. A lesson without it is unchecked. */
  checked: Day.optional(),
  /** A drawing in the house style that shows the situation (an id of apps/web/src/lib/pictures.ts). */
  picture: z.string().regex(/^[a-z]+$/).optional(),
  quiz: z.array(Question).min(3).max(8),
});
export type Lesson = z.infer<typeof Lesson>;

/** A theme of the eindtermen, taught as a course of lessons. */
export const Theme = z.object({
  id: z.string().regex(/^[a-z-]+$/),
  /** The theme's number in the eindtermen (1–8). */
  n: z.number().int().min(1).max(8),
  title: Text,
  lead: Text,
  lessons: z.array(Lesson).min(1),
});
export type Theme = z.infer<typeof Theme>;

/** The list of all eight themes, in order; a theme without a course yet is shown as "in preparation". */
export const ThemeIndex = z.object({
  themes: z.array(z.object({ id: z.string().regex(/^[a-z-]+$/), n: z.number().int().min(1).max(8), title: Text, lead: Text })).length(8),
});
export type ThemeIndex = z.infer<typeof ThemeIndex>;

/** A page of the knowledge base: one subject from the eindtermen, explained for reading, not tested. */
export const Topic = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: Text,
  summary: Text,
  sections: z.array(z.object({ heading: Text, paragraphs: TextList })).min(1),
  eindtermen: z.array(Code).min(1),
  /** The theme it belongs to (an id of the theme index); none for a page about the exam itself. */
  theme: z.string().optional(),
  sources: z.array(Source).min(1),
  /** The date the facts were last checked against the sources (YYYY-MM-DD). */
  checked: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type Topic = z.infer<typeof Topic>;

/** A word explanation for the pop-ups: the forms as they occur in the text, a plain word or short explanation. */
export const GlossaryEntry = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  forms: z.array(z.string().min(1)).min(1),
  plain: z.string().min(1),
  note: z.string().optional(),
  /** A knowledge-base page about it, if there is one. */
  topic: z.string().optional(),
});
export type GlossaryEntry = z.infer<typeof GlossaryEntry>;
export const Glossary = z.object({ entries: z.array(GlossaryEntry) });
export type Glossary = z.infer<typeof Glossary>;

/** "What is changing": changes in the rules of inburgering and the exam, each with its official source. */
export const NewsItem = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  headline: Text,
  gist: Text,
  source: Source,
});
export type NewsItem = z.infer<typeof NewsItem>;
export const News = z.object({ items: z.array(NewsItem) });

/** Reviews given by a qualified teacher: key "<theme>-<n>" for a lesson or "topic:<slug>" for a page. */
export const Reviews = z.record(z.string(), z.object({ by: z.string().min(1), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }));
export type ReviewState = { status: "draft" | "reviewed"; by?: string; date?: string };
