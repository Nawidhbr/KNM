import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Help translations (config/help.ts, components/Help.astro): Dari folded under the Dutch of a lesson, off until the
// reader turns it on, remembered for every page, also in review; never on the exam or the English pages.
test("the Dari help translation is off until turned on, then folds open under each part", async ({ page }) => {
  await page.goto("/nl/study/werk-en-inkomen/1/");
  const fold = page.locator(".primer-body details.help-tr").first();
  await expect(fold).toBeHidden();
  const toggle = page.locator(".help-btn");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".help-note")).toBeVisible();
  await expect(page.locator(".help-title")).toHaveAttribute("data-help-lang", "fa-af");
  await expect(fold).toBeVisible();
  await expect(fold.locator(".help-text")).toBeHidden();
  await fold.locator("summary").click();
  await expect(fold.locator(".help-text")).toBeVisible();
  await expect(fold.locator(".help-text")).toHaveAttribute("dir", "rtl");
  // One fold per paragraph, and the question with its options.
  expect(await page.locator(".primer-body details.help-tr").count()).toBe(await page.locator(".primer-body > p").count());
  await expect(page.locator(".question").first().locator(".help-options li")).toHaveCount(3);

  // Remembered on the next page, and the settings switch shows it.
  await page.goto("/nl/study/werk-en-inkomen/2/");
  await expect(page.locator("html")).toHaveAttribute("data-help", "fa-af");
  await page.locator(".settings-toggle").click();
  const sw = page.locator('#settings [data-help-switch="fa-af"]');
  await expect(sw).toHaveAttribute("aria-checked", "true");
  await sw.click();
  await expect(page.locator("html")).not.toHaveAttribute("data-help", /./);
  await expect(page.locator(".help-btn")).toHaveAttribute("aria-pressed", "false");
});

test("a lesson with the help translation open has no accessibility violations", async ({ page }) => {
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.addInitScript(() => localStorage.setItem("help", "fa-af"));
    await page.goto("/nl/study/werk-en-inkomen/1/");
    for (const s of await page.locator(".primer-body details.help-tr > summary").all()) await s.click();
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  }
});

test("review questions carry the help translation, the exam and English pages do not", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("help", "fa-af");
    localStorage.setItem("scores", JSON.stringify({ "werk-en-inkomen-1": 10 }));
  });
  await page.goto("/nl/practice/");
  await page.locator('input[name="lesson"][value="werk-en-inkomen-1"]').check();
  await page.locator("[data-start]").click();
  const q = page.locator(".tikrar-test .question").first();
  const fold = q.locator(":scope > details.help-tr");
  await expect(fold).toBeVisible();
  await fold.locator("summary").click();
  await expect(fold.locator(".help-options li")).toHaveCount(3);
  // The letters follow the shuffled buttons: help option A translates the text of button A.
  const json = await (await page.request.get("/nl/practice/questions.json")).json();
  const prompt = await q.locator(".q-prompt").innerText();
  const item = Object.values(json as Record<string, any>).find((x) => x.p === prompt);
  const first = (await q.locator(".option").first().innerText()).replace(/^A\s*/, "").trim();
  const orig = item.o.indexOf(first);
  expect(orig).toBeGreaterThanOrEqual(0);
  await expect(fold.locator(".help-options li").first()).toContainText(item.x["fa-af"].o[orig]);
  await page.goto("/nl/exam/");
  await expect(page.locator(".help-tr")).toHaveCount(0);
  await page.goto("/en/study/werk-en-inkomen/1/");
  await expect(page.locator(".help-tr, .help-btn")).toHaveCount(0);
});
