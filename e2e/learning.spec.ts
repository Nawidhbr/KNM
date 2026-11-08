import { expect, test, type Page } from "@playwright/test";

// The study path, as a learner meets it: a lesson is locked until the one before it has two stars; passing a test
// opens the next lesson; passed lessons can be reviewed. Scores live in localStorage only.

/** Answer every question of the test on this page: `right` of them correctly, the rest wrongly. */
async function takeTest(page: Page, right: number) {
  const qs = page.locator(".term-quiz .question");
  const n = await qs.count();
  for (let i = 0; i < n; i++) {
    const q = qs.nth(i);
    const answer = Number(await q.getAttribute("data-answer"));
    const pick = i < right ? answer : (answer + 1) % 3;
    await q.locator(".option").nth(pick).click();
  }
}

test("a lesson is locked until the one before it is passed", async ({ page }) => {
  await page.goto("/nl/study/werk-en-inkomen/2/");
  await expect(page.locator("html")).toHaveAttribute("data-locked", "term");
  await expect(page.locator("[data-lock-note]")).toBeVisible();
  await expect(page.locator(".lockable")).toBeHidden();
  await expect(page.locator("[data-lock-go]")).toHaveAttribute("href", "/nl/study/werk-en-inkomen/1/");
});

test("three of five right is not enough; four of five opens the next lesson", async ({ page }) => {
  await page.goto("/nl/study/werk-en-inkomen/1/");
  await expect(page.locator("html")).not.toHaveAttribute("data-locked", /.+/);
  await takeTest(page, 3);
  await expect(page.locator(".quiz-result")).toHaveAttribute("data-state", "fail");
  await expect(page.locator(".next[data-gated]")).toBeHidden();
  await page.locator("[data-again]").click();
  await takeTest(page, 4);
  await expect(page.locator(".quiz-result")).toHaveAttribute("data-state", "pass");
  await expect(page.locator(".next[data-gated]")).toBeVisible();
  await page.goto("/nl/study/werk-en-inkomen/2/");
  await expect(page.locator("html")).not.toHaveAttribute("data-locked", /.+/);
  await page.goto("/nl/study/werk-en-inkomen/");
  await expect(page.locator('.path a[data-slug="werk-en-inkomen-1"]')).toHaveAttribute("data-state", "done");
  await expect(page.locator('.path a[data-slug="werk-en-inkomen-2"]')).toHaveAttribute("data-state", "current");
  await expect(page.locator('.path a[data-slug="werk-en-inkomen-3"]')).toHaveAttribute("data-state", "locked");
});

test("review offers only passed lessons", async ({ page }) => {
  await page.goto("/nl/practice/");
  await expect(page.locator("[data-empty]")).toBeVisible();
  await page.goto("/nl/study/werk-en-inkomen/1/");
  await takeTest(page, 5);
  await page.goto("/nl/practice/");
  await expect(page.locator("[data-empty]")).toBeHidden();
  await page.locator('label[data-lesson="werk-en-inkomen-1"] input').check();
  await expect(page.locator("[data-start]")).toBeEnabled();
  await page.locator("[data-start]").click();
  await expect(page.locator(".tikrar-test .question")).toHaveCount(5);
});

test("a word in a lesson opens its explanation", async ({ page }) => {
  await page.goto("/nl/study/werk-en-inkomen/1/");
  await page.locator("button.gloss", { hasText: "uitzendbureau" }).first().click();
  await expect(page.locator("#gloss-pop")).toBeVisible();
  await expect(page.locator("#gloss-pop .gloss-plain")).toContainText("werk");
});
