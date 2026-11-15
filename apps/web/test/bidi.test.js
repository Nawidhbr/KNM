import { describe, expect, it } from "vitest";
import { bidiRuns } from "../src/lib/bidi.js";

describe("bidiRuns", () => {
  it("isolates Dutch words, abbreviations and numbers in right-to-left text", () => {
    const runs = bidiRuns("به Veilig Thuis زنگ بزنید: 0800-2000، رایگان.");
    expect(runs.filter((r) => r.latin).map((r) => r.t)).toEqual(["Veilig Thuis", "0800-2000"]);
    expect(runs.map((r) => r.t).join("")).toBe("به Veilig Thuis زنگ بزنید: 0800-2000، رایگان.");
  });
  it("keeps brackets outside the run, so they mirror with the Dari around them", () => {
    expect(bidiRuns("خشونت خانگی (huiselijk geweld)").filter((r) => r.latin).map((r) => r.t)).toEqual(["huiselijk geweld"]);
  });
  it("leaves text without Latin letters whole", () => {
    expect(bidiRuns("در سال ۱۹۴۵.")).toEqual([{ t: "در سال ۱۹۴۵.", latin: false }]);
  });
});

it("scripts/practice.js uses the same pattern", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/scripts/practice.js", import.meta.url), "utf8");
  const theirs = new Function(`return ${src.match(/const LATIN_RUN = (\/.*\/g);/)[1]}`)();
  const { LATIN_RUN } = await import("../src/lib/bidi.js");
  const sample = "به Veilig Thuis زنگ بزنید: 0800-2000، (Gefeliciteerd met je dochter!) Curaçao، IND.";
  expect([...sample.matchAll(theirs)].map((m) => m[0])).toEqual([...sample.matchAll(LATIN_RUN)].map((m) => m[0]));
});
