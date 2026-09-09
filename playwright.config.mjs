import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*browser.spec.mjs",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: { browserName: "chromium", headless: true, viewport: { width: 1100, height: 900 }, reducedMotion: "reduce" }
});
