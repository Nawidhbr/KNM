import type { APIRoute } from "astro";
import { getGlossary, getTopic, tx } from "@knm/content";
import { localePaths } from "../../i18n";

export const getStaticPaths = localePaths;

/** The word explanations of one language, for the pop-ups: id → plain word, note, and the page about it with its title. */
export const GET: APIRoute = ({ params }) => {
  const locale = params.locale as string;
  const data = Object.fromEntries(
    getGlossary(locale).entries.map((e) => {
      const topic = e.topic ? getTopic(e.topic) : undefined;
      return [e.id, { p: e.plain, ...(e.note ? { n: e.note } : {}), ...(topic ? { h: `/${locale}/topics/${topic.slug}/`, t: tx(topic.title, locale) } : {}) }];
    }),
  );
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
