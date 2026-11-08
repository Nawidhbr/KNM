import { defineConfig, devices } from "@playwright/test";

// End-to-end tests of the study path and the main pages, against the built site (run `npm run build` first).
export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: "http://localhost:4321", ...devices["Desktop Chrome"] },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] }, testMatch: /layout\.spec/ },
  ],
  webServer: { command: "node scripts/serve-dist.mjs apps/web/dist 4321", url: "http://localhost:4321/nl/", reuseExistingServer: !process.env.CI },
});
