import { expect, test } from "@playwright/test";

// The practice exam (pages/[locale]/exam.astro), smart review (lib/progress.js reviewAfter) and taking progress to
// another device with a link (pages/[locale]/transfer.astro). Everything lives in localStorage.

test("the practice exam asks 40 questions from all themes and scores them per theme", async ({ page }) => {
  await page.goto("/nl/exam/");
  await page.locator("[data-start]").click();
  await expect(page.locator("[data-pos]")).toHaveText("Vraag 1 van 40");
  await expect(page.locator("[data-clock]")).toHaveText(/^4[45]:\d\d$/);
  await expect(page.locator("[data-grid] button")).toHaveCount(40);
  // Handing in with open questions asks once more.
  await page.locator("[data-submit]").click();
  await expect(page.locator("[data-unanswered]")).toContainText("40 vragen");
  for (let i = 0; i < 40; i++) {
    await page.locator("[data-options] .option").first().click();
    if (i < 39) await page.locator("[data-next]").click();
  }
  await expect(page.locator("[data-grid] button[data-state=answered]")).toHaveCount(40);
  await page.locator("[data-submit]").click();
  await expect(page.locator("[data-result]")).toBeVisible();
  await expect(page.locator("[data-score]")).toContainText("van de 40 goed");
  await expect(page.locator("[data-themes] li")).toHaveCount(8);
  const right = Number((await page.locator("[data-score]").textContent())!.match(/^(\d+)/)![1]);
  await expect(page.locator("[data-mistakes] .exam-mistake")).toHaveCount(40 - right);
  // Every wrong answer is kept for smart review.
  const review = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("review") || "{}")).length);
  expect(review).toBe(40 - right);
});

test("a question answered wrongly in a lesson comes back in smart review", async ({ page }) => {
  await page.goto("/nl/practice/");
  await expect(page.locator("[data-smart]")).toBeHidden();
  await page.goto("/nl/study/werk-en-inkomen/1/");
  const qs = page.locator(".term-quiz .question");
  for (let i = 0; i < 5; i++) {
    const q = qs.nth(i);
    const answer = Number(await q.getAttribute("data-answer"));
    await q.locator(".option").nth(i < 3 ? answer : (answer + 1) % 3).click();
  }
  await page.goto("/nl/practice/");
  await expect(page.locator("[data-smart]")).toBeVisible();
  await expect(page.locator("[data-smart-text]")).toContainText("2 vragen");
  await page.locator("[data-smart-start]").click();
  await expect(page.locator(".tikrar-test .question")).toHaveCount(2);
  // Answered right now, they move on and are not due again today.
  for (const q of await page.locator(".tikrar-test .question").all()) {
    const text = await q.locator(".q-prompt").textContent();
    const right = await page.evaluate(async (p) => {
      const all = await (await fetch("/nl/practice/questions.json")).json();
      const q = Object.values(all).find((x: any) => x.p === p) as any;
      return q.o[q.k];
    }, text);
    await q.locator(".option", { hasText: right }).click();
  }
  await page.goto("/nl/practice/");
  await expect(page.locator("[data-smart-text]")).toContainText("Nu niets te herhalen");
  await expect(page.locator("[data-smart-start]")).toBeHidden();
});

test("progress goes to another device with a link", async ({ page, browser }) => {
  await page.goto("/nl/transfer/");
  await page.evaluate(() => {
    localStorage.setItem("scores", JSON.stringify({ "werk-en-inkomen-1": 10, "werk-en-inkomen-2": 8 }));
    localStorage.setItem("review", JSON.stringify({ "wonen-1-1": { b: 0, d: 1 } }));
  });
  await page.reload();
  await expect(page.locator("[data-mine]")).toHaveText("2 lessen gehaald, 1 vragen om te herhalen");
  await page.locator("[data-make-link]").click();
  const url = await page.locator("[data-url]").inputValue();
  expect(url).toMatch(/\/nl\/transfer\/#p=[\w-]+$/);

  const other = await browser.newContext();
  const p2 = await other.newPage();
  await p2.goto("/nl/transfer/");
  await p2.evaluate(() => localStorage.setItem("scores", JSON.stringify({ "werk-en-inkomen-1": 6, "wonen-1": 9 })));
  await p2.goto(url);
  await expect(p2.locator("[data-found]")).toBeVisible();
  await p2.locator("[data-take]").click();
  await expect(p2.locator("[data-status]")).toContainText("Klaar");
  expect(new URL(p2.url()).hash).toBe("");
  const scores = await p2.evaluate(() => JSON.parse(localStorage.getItem("scores") || "{}"));
  expect(scores).toEqual({ "werk-en-inkomen-1": 10, "werk-en-inkomen-2": 8, "wonen-1": 9 });
  await other.close();
});

test("a broken link says so", async ({ page }) => {
  await page.goto("/nl/transfer/#p=nonsense");
  await expect(page.locator("[data-status]")).toContainText("klopt niet");
  await expect(page.locator("[data-found]")).toBeHidden();
});
