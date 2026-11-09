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
