import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Accessibility (WCAG 2.1 A and AA, checked by axe) on the main pages, in light and dark mode: contrast, names of
// buttons and links, headings, landmarks, form labels. Many readers read Dutch with effort and some use a screen
// reader or zoom, so this is part of every check.

const pages = ["/nl/", "/nl/study/", "/nl/study/werk-en-inkomen/", "/nl/study/werk-en-inkomen/1/", "/nl/practice/", "/nl/exam/", "/nl/transfer/", "/nl/topics/", "/nl/topics/digid/", "/nl/news/", "/nl/glossary/", "/nl/contact/", "/nl/unlock/", "/nl/about/"];

for (const scheme of ["light", "dark"] as const) {
  for (const path of pages) {
    test(`${path} (${scheme}) has no accessibility violations`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      await page.waitForLoadState("load");
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const found = r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}× — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
      expect(found, "accessibility violations").toEqual([]);
    });
  }
}
