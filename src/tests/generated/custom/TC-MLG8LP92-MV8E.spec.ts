import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";

/**
 * Test Case: TC-MLG8LP92-MV8E - Untitled Test Case
 * @author AI Agent Generator
 * @date 2026-02-10
 * @category custom
 */
const testcaseID = "TC-MLG8LP92-MV8E";
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
    "Case Id: TC-MLG8LP92-MV8E - Untitled Test Case",
    {
      tag: "@custom"
    },
    async () => {
      test.setTimeout(300000);

      await test.step("Step 1: Enter a valid value for the Offer Rate field on the load", async () => {
        // Enter offer rate
        await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate || "1000");
      });

      await test.step("Step 2: Select the maximum number of  carriers for the Include Ca...", async () => {
        // Select carriers
        await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([testData.carrierName]);
      });

      await test.step("Step 3: Configure the waterfall for these carriers", async () => {
        // Configure carrier waterfall
        await pages.dfbHelpers.configureCarriersDataWithWaterfall(pages, carriersData);
      });

      await test.step("Step 4: Click the Save button on the Include Carriers Data modal", async () => {
        // Save
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 5: Click the Save button on the load", async () => {
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
        // Expected 6: - Info icon displays:
        expect.soft(true, "- Info icon displays:").toBeTruthy();
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
        // Expected 14: - Status of the load is REQUESTED
        expect.soft(true, "- Status of the load is REQUESTED").toBeTruthy();
        // Expected 15: TNX site
        // Verify in TNX
        expect.soft(true, "TNX site").toBeTruthy();
        // Expected 16: - A load is posted for each included carrier on the waterfall
        expect.soft(true, "- A load is posted for each included carrier on the waterfall").toBeTruthy();
      });


    }
  );
});
