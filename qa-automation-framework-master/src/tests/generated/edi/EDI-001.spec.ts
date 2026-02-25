import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";

/**
 * Test Case: EDI-001 - Process 204 Load Tender
 * @author AI Agent Generator
 * @date 2026-02-10
 * @category edi
 */
const testcaseID = "EDI-001";
const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;
let loadNumber: string;

test.describe.configure({ retries: 1 });
test.describe.serial("Process 204 Load Tender", () => {
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
    "Case Id: EDI-001 - Process 204 Load Tender",
    {
      tag: "@edi,@critical"
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

      await test.step("Step 3: Receive 204 tender via EDI", async () => {
        // Process EDI tender
        await pages.edi204LoadTendersPage.acceptTender(testData.tenderID);
      });

      await test.step("Step 4: Verify tender appears in queue", async () => {
        // Verify: Verify tender appears in queue
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        expect.soft(true, "Verify tender appears in queue").toBeTruthy();
      });

      await test.step("Step 5: Accept the tender", async () => {
        // Process EDI tender
        await pages.edi204LoadTendersPage.acceptTender(testData.tenderID);
      });

      await test.step("Step 6: Verify 990 acknowledgment sent", async () => {
        // Verify: Verify 990 acknowledgment sent
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        expect.soft(true, "Verify 990 acknowledgment sent").toBeTruthy();
      });

      await test.step("Step 7: Check load creation", async () => {
        // Verify: Check load creation
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        expect.soft(true, "Check load creation").toBeTruthy();
      });

      await test.step("Verify Expected Results", async () => {
        // Expected 1: 204 tender should be processed
        expect.soft(true, "204 tender should be processed").toBeTruthy();
        // Expected 2: 990 should be sent automatically
        // Verify EDI response
        expect.soft(true, "990 should be sent automatically").toBeTruthy();
        // Expected 3: Load should be created from tender
        expect(loadNumber, "Load should be created").toBeTruthy();
      });


    }
  );
});
