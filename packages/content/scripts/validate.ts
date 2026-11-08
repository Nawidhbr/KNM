/**
 * Validates every content file against the schema and the rules that tie them together, and writes the bundles the
 * site imports (generated/*.json). Fails on any error, so the site never builds on broken content.
 *
 *   npm run validate -w @knm/content
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { Glossary, LOCALES, News, Reviews, Theme, ThemeIndex, Topic } from "../src/schema.ts";

const root = new URL("..", import.meta.url).pathname;
const read = (p: string) => JSON.parse(readFileSync(join(root, p), "utf8"));
const errors: string[] = [];
const fail = (where: string, msg: string) => errors.push(`${where}: ${msg}`);

const parse = <T,>(schema: { safeParse: (x: unknown) => { success: true; data: T } | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } } }, data: unknown, where: string): T | null => {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  for (const i of r.error.issues) fail(where, `${i.path.join(".") || "(root)"}: ${i.message}`);
  return null;
};

// The eight themes, in order.
const index = parse(ThemeIndex, read("themes/index.json"), "themes/index.json");
const themeIds = new Set(index?.themes.map((t) => t.id) ?? []);
index?.themes.forEach((t, i) => t.n !== i + 1 && fail("themes/index.json", `theme ${t.id} has n ${t.n}, expected ${i + 1}`));

// The courses: one file per theme that has lessons.
const themes = readdirSync(join(root, "themes"))
  .filter((f) => f.endsWith(".json") && f !== "index.json")
  .map((f) => ({ f, t: parse(Theme, read(`themes/${f}`), `themes/${f}`) }))
  .filter((x): x is { f: string; t: NonNullable<typeof x.t> } => x.t !== null);
const questionIds = new Set<string>();
for (const { f, t } of themes) {
  const where = `themes/${f}`;
  if (`${t.id}.json` !== f) fail(where, `id ${t.id} does not match the file name`);
  const entry = index?.themes.find((x) => x.id === t.id);
  if (!entry) fail(where, `theme ${t.id} is not in themes/index.json`);
  else if (entry.n !== t.n) fail(where, `n ${t.n} differs from the index (${entry.n})`);
  t.lessons.forEach((l, i) => {
    const lw = `${where} lesson ${l.n}`;
    if (l.n !== i + 1) fail(lw, `lessons must be numbered 1, 2, … in order (found ${l.n} at place ${i + 1})`);
    for (const h of l.handeling) if (!h.startsWith(`${t.n}.`)) fail(lw, `crucial action ${h} is not in theme ${t.n}`);
    for (const loc of LOCALES) {
      if (loc !== "nl" && !l.title[loc]) continue;
      if (loc !== "nl" && (!l.situation[loc] || !l.body[loc] || !l.remember[loc])) fail(lw, `${loc}: translation incomplete (title given, but not situation, body and remember)`);
    }
    for (const q of l.quiz) {
      const qw = `${lw} question ${q.id}`;
      if (questionIds.has(q.id)) fail(qw, "id used twice");
      questionIds.add(q.id);
      if (!q.id.startsWith(`${t.id}-${l.n}-`)) fail(qw, `id must start with ${t.id}-${l.n}-`);
      if (!q.eindterm.startsWith(`${t.n}.`)) fail(qw, `eindterm ${q.eindterm} is not in theme ${t.n}`);
      if (q.options.nl.length !== 3) fail(qw, "a question has three options (nl)");
      if (q.answer >= q.options.nl.length) fail(qw, "answer is out of range");
      if (q.options.en && q.options.en.length !== q.options.nl.length) fail(qw, "en has a different number of options");
      if (q.options.en && (!q.prompt.en || !q.explanation.en)) fail(qw, "en options given, but not the prompt and explanation");
      if (new Set(q.options.nl).size !== q.options.nl.length) fail(qw, "two options are the same");
    }
  });
}

// The knowledge base.
const topics = readdirSync(join(root, "topics"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({ f, t: parse(Topic, read(`topics/${f}`), `topics/${f}`) }))
  .filter((x): x is { f: string; t: NonNullable<typeof x.t> } => x.t !== null);
const topicSlugs = new Set(topics.map((x) => x.t.slug));
for (const { f, t } of topics) {
  if (`${t.slug}.json` !== f) fail(`topics/${f}`, `slug ${t.slug} does not match the file name`);
  if (t.theme && !themeIds.has(t.theme)) fail(`topics/${f}`, `theme ${t.theme} is not in themes/index.json`);
}

// Word explanations, per language.
const glossary: Record<string, unknown> = {};
for (const loc of LOCALES) {
  const p = `glossary/${loc}.json`;
  if (!existsSync(join(root, p))) continue;
  const g = parse(Glossary, read(p), p);
  if (!g) continue;
  const ids = new Set<string>();
  for (const e of g.entries) {
    if (ids.has(e.id)) fail(p, `id ${e.id} used twice`);
    ids.add(e.id);
    if (e.topic && !topicSlugs.has(e.topic)) fail(p, `${e.id}: topic ${e.topic} does not exist`);
  }
  glossary[loc] = g;
}

const news = parse(News, read("news.json"), "news.json");
const reviews = parse(Reviews, read("reviews.json"), "reviews.json") ?? {};
const lessonKeys = new Set(themes.flatMap(({ t }) => t.lessons.map((l) => `${t.id}-${l.n}`)));
for (const k of Object.keys(reviews)) {
  const ok = k.startsWith("topic:") ? topicSlugs.has(k.slice(6)) : lessonKeys.has(k);
  if (!ok) fail("reviews.json", `${k} is not a lesson or topic`);
}

if (errors.length) {
  console.error(`Content has ${errors.length} error(s):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

mkdirSync(join(root, "generated"), { recursive: true });
const write = (name: string, data: unknown) => writeFileSync(join(root, "generated", name), JSON.stringify(data));
write("themes.json", { index: index!.themes, courses: themes.map((x) => x.t).sort((a, b) => a.n - b.n) });
write("topics.json", topics.map((x) => x.t).sort((a, b) => a.title.nl.localeCompare(b.title.nl, "nl")));
write("glossary.json", glossary);
write("news.json", [...news!.items].sort((a, b) => b.date.localeCompare(a.date)));
write("reviews.json", reviews);
const lessonCount = themes.reduce((n, x) => n + x.t.lessons.length, 0);
console.log(`Content OK: ${themes.length} course(s), ${lessonCount} lessons, ${questionIds.size} questions, ${topics.length} topics.`);
