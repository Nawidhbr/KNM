// The rules of the study path, in one place (taken over from The Mantiqi): which lessons are open, passed and next,
// and which themes have opened. Plain JavaScript without the DOM, so the same code runs in the browser before paint (sent inside
// /<locale>/study-data.js, see lib/study-data.ts, and called by scripts/head-study.js) and in the tests
// (apps/web/test/progress.test.js). Change a rule only together with a test.
// In the KNM course `path` is empty (there is no first reading of terms) and every theme is a track whose `a` lists
// what must be passed first: [] for the themes, which are open from the start, so a learner can begin anywhere.
//
// data: { path, gates, tracks } from lib/study-data.ts — path: the terms in book order ({ s: slug, q: number of
// questions }); tracks: the books after the first reading ({ id, a: what must be passed first ("terms" or book ids),
// l: lessons like path, d, v, t, nm }). scores: { slug: score out of 10 }; visited: slugs seen (for steps without a test).

/**
 * Stars from a score out of 10: one from 4, two from 7, three from 9. Two stars open the next lesson, so a lesson is
 * passed at 7 out of 10 — about the pass mark of the KNM exam itself (70%). With five questions: 4 right = 2 stars.
 */
export function stars(x) {
  return x >= 9 ? 3 : x >= 7 ? 2 : x >= 4 ? 1 : 0;
}

/**
 * Paid access (see config/offer.js): `access` is what the buy page stored ({ code, until } with until a time in ms);
 * it counts while `until` lies after `now`.
 */
export function hasAccess(access, now) {
  return Boolean(access && typeof access.code === "string" && access.code && Number.isFinite(access.until) && access.until > now);
}

/**
 * Smart review (slim herhalen): a question answered wrongly anywhere (a lesson test, review or the practice exam) comes
 * back later. `entry` is what the browser keeps for one question in `review` ({ b: box 0–3, d: due time in ms }), or
 * undefined. A wrong answer puts it in box 0, due at once; each right answer moves it up a box and further away (1, 3, 7
 * days); a right answer in the last box retires it (null). A question answered right that was never wrong is not kept.
 */
export const REVIEW_DAYS = [0, 1, 3, 7];
export function reviewAfter(entry, ok, now) {
  if (!ok) return { b: 0, d: now };
  if (!entry) return null;
  const b = entry.b + 1;
  if (b >= REVIEW_DAYS.length) return null;
  return { b, d: now + REVIEW_DAYS[b] * 86400000 };
}
export function reviewDue(entry, now) {
  return Boolean(entry && Number.isFinite(entry.d) && entry.d <= now);
}

/**
 * Taking progress to another device (a link with the progress in it): the scores and review of two browsers merged so
 * nothing is lost. The best score wins; seen pages are joined; for review the question stays in the lower box (it
 * still needs work), due at the earlier time; access is kept that lasts longest.
 */
export function mergeProgress(mine, theirs) {
  const scores = { ...mine.scores };
  for (const [k, v] of Object.entries(theirs.scores ?? {})) if (Number.isFinite(v) && !(scores[k] >= v)) scores[k] = v;
  const visited = [...new Set([...(mine.visited ?? []), ...(theirs.visited ?? [])])];
  const review = { ...mine.review };
  for (const [k, v] of Object.entries(theirs.review ?? {})) {
    if (!v || !Number.isFinite(v.b) || !Number.isFinite(v.d)) continue;
    const m = review[k];
    review[k] = !m ? v : { b: Math.min(m.b, v.b), d: Math.min(m.d, v.d) };
  }
  const a = mine.access, b = theirs.access;
  const access = !b || !Number.isFinite(b.until) || typeof b.code !== "string" ? a ?? null : !a || !(a.until >= b.until) ? b : a;
  return { scores, visited, review, access };
}

export function progress(data, scores, visited) {
  const { path, tracks } = data;
  // Passed: two stars on its test, or, for a step without a test, seen.
  const passed = (p) => (p.q ? stars(scores[p.s] ?? 0) >= 2 : visited.has(p.s));
  // The terms open one at a time: up to and including the first one not yet passed.
  let i = 0;
  while (i < path.length - 1 && passed(path[i])) i++;
  const open = new Set(path.slice(0, i + 1).map((p) => p.s));
  const done = new Set(path.filter((p, k) => k < i || (k === i && passed(p))).map((p) => p.s));
  const baseDone = path.length > 0 && done.has(path[path.length - 1].s);
  // A book opens once everything in its `a` is passed; inside a book the lessons open one by one.
  const tr = {};
  const levelDone = {};
  const bookDone = (id) => (id === "terms" ? baseDone : !!tr[id] && tr[id].opened && tr[id].lessons.every(passed));
  for (const k of tracks) {
    const opened = k.a.every(bookDone);
    let j = 0;
    while (opened && j < k.l.length - 1 && passed(k.l[j])) j++;
    tr[k.id] = {
      t: k.t,
      v: k.v,
      d: k.d,
      a: k.a,
      nm: k.nm,
      opened,
      lessons: k.l,
      open: new Set(opened ? k.l.slice(0, j + 1).map((p) => p.s) : []),
      done: new Set(opened ? k.l.filter((p, m) => m < j || (m === j && passed(p))).map((p) => p.s) : []),
      next: k.l[j]?.s,
    };
    levelDone[k.v] = (levelDone[k.v] ?? true) && opened && k.l.every(passed);
  }
  // The first thing still to pass before a book opens: the first reading, or a book (with its id), followed down to
  // the first book that is open, so its next lesson can be offered.
  const blocker = (id, depth = 0) => {
    const x = tr[id];
    if (!x || depth > 9) return null;
    for (const dep of x.a) if (!bookDone(dep)) return dep === "terms" ? { terms: true } : blocker(dep, depth + 1) ?? { id: dep, ...tr[dep] };
    return null;
  };
  // A lesson (kati-2) or term: its book (if any), whether it is open, passed, next, and its step.
  const info = (slug) => {
    for (const id in tr) {
      const x = tr[id];
      const p = x.lessons.find((l) => l.s === slug);
      if (p) return { track: id, open: x.open.has(slug), done: x.done.has(slug), next: x.next === slug, step: p };
    }
    const p = path.find((l) => l.s === slug);
    return { track: null, open: open.has(slug), done: done.has(slug), next: path[i]?.s === slug, step: p };
  };
  return { i, open, done, next: path[i]?.s, tracks: tr, baseDone, levelDone, info, blocker, bookDone, passed };
}
