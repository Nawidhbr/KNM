import { expect, test } from "@playwright/test";

// The main pages on desktop and phone: no page scrolls sideways, no script error, every image loads.

const pages = ["/nl/", "/nl/study/", "/nl/study/werk-en-inkomen/", "/nl/study/werk-en-inkomen/1/", "/nl/practice/", "/nl/topics/", "/nl/topics/digid/", "/nl/news/", "/nl/glossary/", "/nl/contact/", "/nl/unlock/", "/nl/terms/", "/en/", "/en/study/werk-en-inkomen/1/"];

for (const path of pages) {
  test(`${path} fits the screen and runs without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    const res = await page.goto(path);
    expect(res?.status(), "page exists").toBe(200);
    await page.waitForLoadState("load");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(1);
    const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src));
    expect(broken, "broken images").toEqual([]);
    expect(errors, "script errors").toEqual([]);
  });
}
