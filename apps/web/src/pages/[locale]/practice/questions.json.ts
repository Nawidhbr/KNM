import type { APIRoute } from "astro";
import { tx, txl } from "@knm/content";
import { localePaths } from "../../../i18n";
import { lessonKey, themes } from "../../../lib/course";

export const getStaticPaths = localePaths;

/** Every question of one language for review: each lesson's test, offered once that lesson is passed (t); h is its theme (for the practice exam). */
export const GET: APIRoute = ({ params }) => {
  const locale = params.locale as string;
  const out: Record<string, { p: string; o: string[]; k: number; e: string; t: string[]; h: string }> = {};
  for (const th of themes())
    for (const l of th.lessons)
      for (const q of l.quiz) out[q.id] = { p: tx(q.prompt, locale), o: txl(q.options, locale), k: q.answer, e: tx(q.explanation, locale), t: [lessonKey(th.id, l.n)], h: th.id };
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
