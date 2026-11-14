import { expect, test } from "@playwright/test";

// Reading aloud (scripts/read-aloud.js) with the browser's own speech. The browser here has no voices, so the test
// gives it a Dutch one and records what would be spoken.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const said: string[] = [];
    (window as any).__said = said;
    class U { text: string; voice: any; lang = ""; rate = 1; onend: any; onerror: any; constructor(t: string) { this.text = t; } }
    (window as any).SpeechSynthesisUtterance = U;
    Object.defineProperty(window, "speechSynthesis", {
      value: { getVoices: () => [{ lang: "nl-NL", name: "Test" }], speak: (u: U) => said.push(u.text), cancel: () => {}, addEventListener: () => {} },
    });
  });
});

test("a lesson and its questions can be read aloud", async ({ page }) => {
  await page.goto("/nl/study/werk-en-inkomen/1/");
  const lesson = page.locator('[data-say="lesson"]');
  await expect(lesson).toBeVisible();
  await lesson.click();
  await expect(lesson).toHaveAttribute("aria-pressed", "true");
  const said = await page.evaluate(() => (window as any).__said as string[]);
  expect(said[0]).toContain(await page.locator(".situation").innerText());
  await page.locator(".term-quiz .question").first().locator(".say-btn").click();
  const q = await page.evaluate(() => (window as any).__said[1] as string);
  expect(q).toContain("A: ");
});

test("questions built by a script get a button too", async ({ page }) => {
  await page.goto("/nl/exam/");
  await page.locator("[data-start]").click();
  await expect(page.locator(".exam-q > .say-btn")).toHaveCount(1);
});

test("without a voice for the language there is no button", async ({ page }) => {
  await page.addInitScript(() => { (window as any).speechSynthesis.getVoices = () => [{ lang: "en-US" }]; });
  await page.goto("/nl/study/werk-en-inkomen/1/");
  await expect(page.locator('[data-say="lesson"]')).toBeHidden();
  await expect(page.locator(".question .say-btn")).toHaveCount(0);
});
