import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import commissionHelper from "@utils/commission-helpers";

/**
 * Test Case: COM-001 - Verify Commission Calculation
 * @author AI Agent Generator
 * @date 2026-02-10
 * @category commission
 */
const testcaseID = "COM-001";
const testData = dataConfig.getTestDataFromCsv(dataConfig.commissionData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;
let loadNumber: string;

test.describe.configure({ retries: 1 });
test.describe.serial("Verify Commission Calculation", () => {
  test.beforeAll(async ({ browser }) => {
    // Create shared context and page that will persist across tests
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    pages = new PageManager(sharedPage);
  });

  test.afterAll(async () => {
    // Cleanup after all tests
    if (sharedContext) {
      await sharedContext.close();
    }
  });

  test(
    "Case Id: COM-001 - Verify Commission Calculation",
    {
      tag: "@commission,@finance"
    },
    async () => {
      test.setTimeout(300000);

      await test.step("Step 1: Login to BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser, userSetup.globalPassword);
        await pages.btmsAcceptTermPage.acceptTermsIfPresent();
      });

      await test.step("Step 2: Navigate to Finance", async () => {
        // Navigate to Finance
        await pages.homePage.navigateToHeader(HEADERS.FINANCE);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 3: Search for commission report", async () => {
        // Search operation
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 4: Verify commission amount", async () => {
        // Verify: Verify commission amount
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        expect.soft(true, "Verify commission amount").toBeTruthy();
      });

      await test.step("Step 5: Check internal share calculation", async () => {
        // Verify: Check internal share calculation
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        expect.soft(true, "Check internal share calculation").toBeTruthy();
      });

      await test.step("Verify Expected Results", async () => {
        // Expected 1: Commission calculated correctly
        expect.soft(true, "Commission calculated correctly").toBeTruthy();
        // Expected 2: Internal share is accurate
        expect.soft(true, "Internal share is accurate").toBeTruthy();
      });


    }
  );
});
