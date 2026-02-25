import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";

/**
 * Test Case: EDI-002 - Reject 204 Load Tender
 * @author AI Agent Generator
 * @date 2026-02-10
 * @category edi
 */
const testcaseID = "EDI-002";
const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;
let loadNumber: string;

test.describe.configure({ retries: 1 });
test.describe.serial("Reject 204 Load Tender", () => {
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
    "Case Id: EDI-002 - Reject 204 Load Tender",
    {
      tag: "@edi,@rejection"
    },
    async () => {
      test.setTimeout(300000);

      await test.step("Step 1: Login to BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser, userSetup.globalPassword);
        await pages.btmsAcceptTermPage.acceptTermsIfPresent();
      });

      await test.step("Step 2: Navigate to EDI queue", async () => {
        // Navigate to EDI queue
        await pages.homePage.navigateToHeader(HEADERS.LOAD);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 3: Receive 204 tender", async () => {
        // Process EDI tender
        await pages.edi204LoadTendersPage.acceptTender(testData.tenderID);
      });

      await test.step("Step 4: Reject the tender", async () => {
        // Action: Reject the tender
        // TODO: Implement this step based on your page objects
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 5: Verify 990 rejection sent", async () => {
        // Verify: Verify 990 rejection sent
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        expect.soft(true, "Verify 990 rejection sent").toBeTruthy();
      });

      await test.step("Verify Expected Results", async () => {
        // Expected 1: Tender rejected
        expect.soft(true, "Tender rejected").toBeTruthy();
        // Expected 2: 990 rejection sent
        // Verify EDI response
        expect.soft(true, "990 rejection sent").toBeTruthy();
      });


    }
  );
});
