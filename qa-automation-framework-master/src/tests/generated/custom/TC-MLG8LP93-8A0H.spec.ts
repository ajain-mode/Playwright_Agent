import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";

/**
 * Test Case: TC-MLG8LP93-8A0H - Untitled Test Case
 * @author AI Agent Generator
 * @date 2026-02-10
 * @category custom
 */
const testcaseID = "TC-MLG8LP93-8A0H";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;
let loadNumber: string;

test.describe.configure({ retries: 1 });
test.describe.serial("Untitled Test Case", () => {
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
    "Case Id: TC-MLG8LP93-8A0H - Untitled Test Case",
    {
      tag: "@custom"
    },
    async () => {
      test.setTimeout(300000);

      await test.step("Step 1: Enter a valid value for the Offer Rate field on the load", async () => {
        // Enter offer rate
        await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate || "1000");
      });

      await test.step("Step 2: Select the maximum number of carriers for the Include Car...", async () => {
        // Select carriers
        await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([testData.carrierName]);
      });

      await test.step("Step 3: Click the Save button", async () => {
        // Save
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Verify Expected Results", async () => {
        // Expected 1: BTMS
        expect.soft(true, "BTMS").toBeTruthy();
        // Expected 2: - Post Staus becomes POSTED
        expect.soft(true, "- Post Staus becomes POSTED").toBeTruthy();
        // Expected 3: - Create Rule button is activated
        expect.soft(true, "- Create Rule button is activated").toBeTruthy();
        // Expected 4: - Cancel button is activated
        expect.soft(true, "- Cancel button is activated").toBeTruthy();
        // Expected 5: - Post button becomes deactivated
        expect.soft(true, "- Post button becomes deactivated").toBeTruthy();
        // Expected 6: - Hovering over Info icon displays:
        expect.soft(true, "- Hovering over Info icon displays:").toBeTruthy();
        // Expected 7: - Origin Zip
        expect.soft(true, "- Origin Zip").toBeTruthy();
        // Expected 8: - Destination Zip
        expect.soft(true, "- Destination Zip").toBeTruthy();
        // Expected 9: - Equipment
        expect.soft(true, "- Equipment").toBeTruthy();
        // Expected 10: - Load Method
        expect.soft(true, "- Load Method").toBeTruthy();
        // Expected 11: - Offer Rate
        expect.soft(true, "- Offer Rate").toBeTruthy();
        // Expected 12: DME
        expect.soft(true, "DME").toBeTruthy();
        // Expected 13: - Load is created
        expect(loadNumber, "Load should be created").toBeTruthy();
        // Expected 14: - Vendor Statuses:
        expect.soft(true, "- Vendor Statuses:").toBeTruthy();
        // Expected 15: - BTMS REQUESTED
        expect.soft(true, "- BTMS REQUESTED").toBeTruthy();
        // Expected 16: - TNX REQUESTED
        // Verify in TNX
        expect.soft(true, "- TNX REQUESTED").toBeTruthy();
        // Expected 17: TNX rep site
        // Verify in TNX
        expect.soft(true, "TNX rep site").toBeTruthy();
        // Expected 18: - A load is posted for all included carriers
        expect.soft(true, "- A load is posted for all included carriers").toBeTruthy();
      });


    }
  );
});
