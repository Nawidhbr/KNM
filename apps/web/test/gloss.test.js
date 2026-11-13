import { describe, expect, it } from "vitest";
import { gloss } from "../src/lib/gloss.ts";

describe("gloss", () => {
  it("marks a word once and keeps punctuation right after it on the same line", () => {
    const html = gloss("Het parlement, en weer het parlement.", "nl");
    expect(html).toContain('<span class="gloss-nb"><button type="button" class="gloss" data-g="parlement" aria-haspopup="dialog">parlement</button>,</span>');
    expect(html.match(/class="gloss"/g)).toHaveLength(1);
    expect(html.endsWith("het parlement.")).toBe(true);
  });
  it("leaves a word without punctuation as a bare button", () => {
    const html = gloss("Het parlement maakt wetten", "nl");
    expect(html).toContain('>parlement</button> maakt');
    expect(html).not.toContain("gloss-nb");
  });
});
