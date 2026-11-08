import type { APIRoute } from "astro";
import { getGlossary, getThemeIndex, getTopics, tx, txl } from "@knm/content";
import { fmt, localePaths, t } from "../../i18n";
import { lessonPath, themePath, themes } from "../../lib/course";

export const getStaticPaths = localePaths;

/** The search index of one language: the themes, every lesson, every knowledge-base page and the words. */
export const GET: APIRoute = ({ params }) => {
  const locale = params.locale as string;
  const ui = t(locale);
  const cut = (x: string) => (x.length > 300 ? `${x.slice(0, 300)}…` : x);
  const themeName = new Map(getThemeIndex().map((x) => [x.id, tx(x.title, locale)]));
  const items = [
    ...themes().map((th) => ({ k: "kb", u: themePath(locale, th.id), t: tx(th.title, locale), w: fmt(ui.study.themeLabel, { n: th.n }), n: [tx(th.title, locale)], d: tx(th.lead, locale) })),
    ...themes().flatMap((th) =>
      th.lessons.map((l) => ({ k: "kb", u: lessonPath(locale, th.id, l.n), t: tx(l.title, locale), w: `${tx(th.title, locale)} · ${fmt(ui.lesson.of, { n: l.n, m: th.lessons.length })}`, n: [tx(l.title, locale)], d: cut([tx(l.situation, locale), ...txl(l.body, locale)].join(" ")) })),
    ),
    ...getTopics().map((x) => ({ k: "kb", u: `/${locale}/topics/${x.slug}/`, t: tx(x.title, locale), w: `${ui.topics.title}${x.theme ? ` · ${themeName.get(x.theme)}` : ""}`, n: [tx(x.title, locale)], d: cut([tx(x.summary, locale), ...x.sections.flatMap((s) => txl(s.paragraphs, locale))].join(" ")) })),
    ...getGlossary(locale).entries.map((e) => ({ k: "kb", u: `/${locale}/glossary/#${e.id}`, t: e.forms[0], w: ui.glossary.title, n: e.forms, d: e.plain })),
  ];
  return new Response(JSON.stringify(items), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
