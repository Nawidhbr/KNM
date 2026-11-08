// The rules of the study path (lib/progress.js), as the head script runs them. Change a rule only with a test here.
import { describe, expect, it } from "vitest";
import { progress, stars } from "../src/lib/progress.js";

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
