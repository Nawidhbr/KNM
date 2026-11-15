import type { APIRoute } from "astro";
import { tx, txl } from "@knm/content";
import { localePaths } from "../../../i18n";
import { helpFor } from "../../../config/help";
import { lessonKey, themes } from "../../../lib/course";

export const getStaticPaths = localePaths;

/**
 * Every question of one language for review: each lesson's test, offered once that lesson is passed (t); h is its
 * theme (for the practice exam), g the drawing of its lesson, x its help translations (Dutch only, config/help.ts).
 */
export const GET: APIRoute = ({ params }) => {
  const locale = params.locale as string;
  type Help = { p: string; o: string[]; e: string };
  const out: Record<string, { p: string; o: string[]; k: number; e: string; t: string[]; h: string; g?: string; x?: Record<string, Help> }> = {};
  const help = (q: { prompt: any; options: any; explanation: any }) => {
    const x = Object.fromEntries(helpFor(locale).filter((h) => q.prompt[h.code]).map((h) => [h.code, { p: q.prompt[h.code], o: q.options[h.code], e: q.explanation[h.code] }]));
    return Object.keys(x).length ? x : undefined;
  };
  for (const th of themes())
    for (const l of th.lessons)
      for (const q of l.quiz) out[q.id] = { p: tx(q.prompt, locale), o: txl(q.options, locale), k: q.answer, e: tx(q.explanation, locale), t: [lessonKey(th.id, l.n)], h: th.id, g: l.picture, x: help(q) };
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
