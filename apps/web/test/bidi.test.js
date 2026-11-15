import { describe, expect, it } from "vitest";
import { isolate, isolateAll } from "../../../packages/content/src/bidi.ts";

const runs = (s) => [...s.matchAll(/⁦([^⁩]*)⁩/g)].map((m) => m[1]);

describe("isolate (right-to-left text)", () => {
  it("isolates Dutch words, abbreviations and numbers", () => {
    const s = isolate("به Veilig Thuis زنگ بزنید: 0800-2000، رایگان.");
    expect(runs(s)).toEqual(["Veilig Thuis", "0800-2000"]);
    expect(s.replace(/[⁦⁩]/g, "")).toBe("به Veilig Thuis زنگ بزنید: 0800-2000، رایگان.");
  });
  it("keeps brackets outside, so they mirror with the Dari around them", () => {
    expect(runs(isolate("خشونت خانگی (huiselijk geweld)"))).toEqual(["huiselijk geweld"]);
  });
  it("leaves placeholders and Dari without Latin letters alone", () => {
    expect(isolate("به {email} ایمیل بفرستید")).toBe("به {email} ایمیل بفرستید");
    expect(isolate("در سال ۱۹۴۵.")).toBe("در سال ۱۹۴۵.");
  });
  it("isolates every string of a dictionary", () => {
    expect(isolateAll({ a: ["KNM"], b: { c: "DUO" }, n: 3 })).toEqual({ a: ["⁦KNM⁩"], b: { c: "⁦DUO⁩" }, n: 3 });
  });
});
