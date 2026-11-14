import { describe, expect, it } from "vitest";
import { getThemes } from "@knm/content";
import { PICTURES, picture } from "../src/lib/pictures.ts";

describe("pictures", () => {
  it("every lesson names a drawing that exists", () => {
    for (const th of getThemes()) for (const l of th.lessons) if (l.picture) expect(PICTURES[l.picture], `${th.id}-${l.n}`).toBeTruthy();
  });
  it("an unknown drawing fails loudly", () => {
    expect(() => picture("nope")).toThrow(/Unknown picture/);
  });
  it("uses classes, never inline styles (the CSP forbids them)", () => {
    for (const svg of Object.values(PICTURES)) expect(svg).not.toMatch(/style=/);
  });
});
