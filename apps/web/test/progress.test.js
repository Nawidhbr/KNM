// The rules of the study path (lib/progress.js), as the head script runs them. Change a rule only with a test here.
import { describe, expect, it } from "vitest";
import { mergeProgress, progress, reviewAfter, reviewDue, stars } from "../src/lib/progress.js";

const theme = (id, n) => ({ id, t: "1", v: 1, d: 1, a: [], nm: id, l: Array.from({ length: n }, (_, i) => ({ s: `${id}-${i + 1}`, q: 1, n: String(i + 1) })) });
const data = { path: [], tracks: [theme("werk", 3), theme("wonen", 2)] };
const run = (scores) => progress(data, scores, new Set());

describe("stars", () => {
  it("gives one star from 4, two from 7, three from 9 (out of 10)", () => {
    expect([0, 3.9, 4, 6.9, 7, 8.9, 9, 10].map(stars)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });
  it("passes a five-question test with four right answers, not with three", () => {
    expect(stars((4 / 5) * 10)).toBe(2);
    expect(stars((3 / 5) * 10)).toBe(1);
  });
});

describe("study path", () => {
  it("opens every theme from the start, each at its first lesson only", () => {
    const p = run({});
    expect(p.tracks.werk.opened && p.tracks.wonen.opened).toBe(true);
    expect([...p.tracks.werk.open]).toEqual(["werk-1"]);
    expect([...p.tracks.wonen.open]).toEqual(["wonen-1"]);
    expect(p.info("werk-2").open).toBe(false);
  });
  it("opens the next lesson only with two stars on the one before", () => {
    expect(run({ "werk-1": 6 }).info("werk-2").open).toBe(false);
    const p = run({ "werk-1": 8 });
    expect(p.info("werk-1").done).toBe(true);
    expect(p.info("werk-2").open).toBe(true);
    expect(p.info("werk-2").next).toBe(true);
    expect(p.info("werk-3").open).toBe(false);
  });
  it("keeps the themes apart: passing one theme opens nothing in another", () => {
    const p = run({ "werk-1": 10, "werk-2": 10, "werk-3": 10 });
    expect(p.bookDone("werk")).toBe(true);
    expect([...p.tracks.wonen.open]).toEqual(["wonen-1"]);
  });
});

describe("smart review", () => {
  const DAY = 86400000;
  const now = Date.UTC(2026, 10, 14);
  it("keeps a wrong answer, due at once", () => {
    expect(reviewAfter(undefined, false, now)).toEqual({ b: 0, d: now });
    expect(reviewDue({ b: 0, d: now }, now)).toBe(true);
  });
  it("does not keep a question that was right the first time", () => {
    expect(reviewAfter(undefined, true, now)).toBe(null);
  });
  it("moves a right answer up a box and further away: 1, 3, 7 days, then retires it", () => {
    let e = reviewAfter(undefined, false, now);
    e = reviewAfter(e, true, now);
    expect(e).toEqual({ b: 1, d: now + DAY });
    expect(reviewDue(e, now)).toBe(false);
    expect(reviewDue(e, now + DAY)).toBe(true);
    e = reviewAfter(e, true, now);
    expect(e).toEqual({ b: 2, d: now + 3 * DAY });
    e = reviewAfter(e, true, now);
    expect(e).toEqual({ b: 3, d: now + 7 * DAY });
    expect(reviewAfter(e, true, now)).toBe(null);
  });
  it("sends a question back to the start after a wrong answer", () => {
    expect(reviewAfter({ b: 3, d: now }, false, now)).toEqual({ b: 0, d: now });
  });
  it("is not due without a valid entry", () => {
    expect(reviewDue(undefined, now)).toBe(false);
    expect(reviewDue({ b: 0 }, now)).toBe(false);
  });
});

describe("taking progress to another device", () => {
  it("keeps the best score and joins what was seen", () => {
    const m = mergeProgress({ scores: { a: 8, b: 4 }, visited: ["x"] }, { scores: { a: 6, b: 10, c: 7 }, visited: ["x", "y"] });
    expect(m.scores).toEqual({ a: 8, b: 10, c: 7 });
    expect(m.visited).toEqual(["x", "y"]);
  });
  it("keeps a review question in the lower box, due at the earlier time", () => {
    const m = mergeProgress({ scores: {}, review: { q1: { b: 2, d: 50 }, q2: { b: 1, d: 9 } } }, { scores: {}, review: { q1: { b: 0, d: 70 }, q3: { b: 1, d: 5 } } });
    expect(m.review).toEqual({ q1: { b: 0, d: 50 }, q2: { b: 1, d: 9 }, q3: { b: 1, d: 5 } });
  });
  it("keeps the access that lasts longest and ignores broken data", () => {
    const short = { code: "a", until: 10 }, long = { code: "b", until: 20 };
    expect(mergeProgress({ scores: {}, access: short }, { scores: {}, access: long }).access).toEqual(long);
    expect(mergeProgress({ scores: {}, access: long }, { scores: {}, access: short }).access).toEqual(long);
    expect(mergeProgress({ scores: {}, access: null }, { scores: {}, access: { code: 5, until: 30 } }).access).toBe(null);
    expect(mergeProgress({ scores: { a: 5 } }, { scores: { a: "x" }, review: { q: { b: "1" } } })).toEqual({ scores: { a: 5 }, visited: [], review: {}, access: null });
  });
});
