/// <reference types="node" />
import "@utils/globalConstants";
import "@utils/dfbUtils/dfbGlobalConstants";
import "@utils/ediUtils/ediConstants";
import "@utils/carrierUtils/carrierConstants";
import "@utils/bulkChangeUtils/bulkChangeConstants";
import "@utils/salesLeadUtils/salesLeadConstants";
import "@utils/nonOperationalLoadsUtils/nonOperationalLoadsConstant";
import "@utils/datUtils/datConstants";

import { defineConfig, } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests",
  /* Run tests in files in parallel */

  fullyParallel: false,
  workers: 1,
  timeout: process.env.CI ? 15 * 60 * 1000 : 5 * 60 * 1000, // 15 min on CI, 5 min locally
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 0 : 0,
  reporter: [
    [
      "junit",
      {
        outputFile: "./src/reporting/junitResults/test-results.xml",
      },
    ],
    ["list"],
    ["./src/testmo/testmo-reporter.ts"],
    [
      "allure-playwright",
      {
        resultsDir: "./src/reporting/allure-results",
        detail: true,
      },
    ],
    ["html", { outputFolder: "./src/reporting/playwright-report" }],
  ],
  use: {
    actionTimeout: 180000, // 3 minutes for actions like click, fill, etc.
    navigationTimeout: 180000, // 3 minutes for page navigations
    contextOptions: {
      //  storageState: undefined,          // No shared auth state
    },
    screenshot: process.env.CI ? 'only-on-failure' : 'on',
    video: 'off',
    ignoreHTTPSErrors: true,
    permissions: [], // Block all permissions globally
    launchOptions: {
      args: [
        "--incognito",
        // "--disable-geolocation",
      ],
    },
    // Full trace on every test is very slow locally (especially on OneDrive paths).
    // trace: process.env.CI ? "on" : "retain-on-failure",
    trace: "off",
  },
  projects: [
    {
      name: "chrome", // Configuration for Google Chrome
      use: {
        //viewport: { width: 1920, height: 1080 },
        channel: 'chrome',
        // Launches installed Google Chrome (headed locally; headless in CI).
        headless: !!process.env.CI,
      },
    },
  ],
});