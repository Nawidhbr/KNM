import { expect, test } from "@playwright/test";

// Buying access (pages/[locale]/unlock.astro, scripts/unlock.js): the return link from Mollie or the mail carries a
// code; the page checks it with /api/redeem (answered here by the test) and keeps the access in localStorage, after
// which every page carries data-access and the offers disappear.

const until = Date.UTC(2027, 10, 9);

test("a paid code unlocks this browser", async ({ page }) => {
  await page.route("**/api/redeem?*", (r) => r.fulfill({ json: { ok: true, until } }));
  await page.goto("/nl/unlock/?code=tr_TestTest12.abcdefghijklmnopqrstuv");
  await expect(page.locator("[data-done]")).toBeVisible();
  await expect(page.locator("[data-done-text]")).toContainText("Gelukt");
  await expect(page.locator("[data-offer]")).toBeHidden();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("access") || "null"))).toEqual({ code: "tr_TestTest12.abcdefghijklmnopqrstuv", until });
  // The code leaves the address bar, so it is not shared by accident.
  expect(new URL(page.url()).search).toBe("");
  await page.goto("/nl/study/");
  await expect(page.locator("html")).toHaveAttribute("data-access", "");
});

test("a payment still open is checked again, a failed one says so", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/redeem?*", (r) => r.fulfill({ json: ++calls === 1 ? { ok: false, status: "pending" } : { ok: false, status: "failed" } }));
  await page.goto("/nl/unlock/?code=tr_TestTest12.abcdefghijklmnopqrstuv");
  await expect(page.locator("[data-status]")).toContainText("niet gelukt", { timeout: 8000 });
  expect(calls).toBe(2);
  expect(await page.evaluate(() => localStorage.getItem("access"))).toBe(null);
});

test("a link pasted on another device works too", async ({ page }) => {
  let asked = "";
  await page.route("**/api/redeem?*", (r) => {
    asked = new URL(r.request().url()).searchParams.get("code") || "";
    return r.fulfill({ json: { ok: true, until } });
  });
  await page.goto("/en/unlock/");
  await page.fill("[data-code-form] input[name=code]", "https://www.nederlands.app/en/unlock/?code=tr_TestTest12.abcdefghijklmnopqrstuv");
  await page.click("[data-code-form] button");
  await expect(page.locator("[data-done-text]")).toContainText("Done");
  expect(asked).toBe("tr_TestTest12.abcdefghijklmnopqrstuv");
});

test("access that has run out no longer counts", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("access", JSON.stringify({ code: "x", until: Date.now() - 1000 })));
  await page.goto("/nl/study/");
  await expect(page.locator("html")).not.toHaveAttribute("data-access", /.*/);
});
