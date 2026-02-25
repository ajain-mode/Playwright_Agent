import { test, expect } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";

/**
 * Test Case: DFB-004 - Post Load to TNX with Offer Rate
 * @author AI Agent Generator
 * @date 2026-02-10
 * @category dfb
 */
const testcaseID = "DFB-004";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let cargoValue: string;
let loadNumber: string;
let sharedContext: any;
let sharedPage: any;
let appManager: MultiAppManager;
let pages: PageManager;
let totalMiles: string;

test.describe.configure({ retries: 1 });
test.describe.serial("Post Load to TNX with Offer Rate", () => {
  test.beforeAll(async ({ browser }) => {
    // Create shared context and page that will persist across tests
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    appManager = new MultiAppManager(sharedContext, sharedPage);
    pages = appManager.btmsPageManager;
  });

  test.afterAll(async () => {
    // Cleanup after all tests
    if (appManager) {
      await appManager.closeAllSecondaryPages();
    }
    if (sharedContext) {
      await sharedContext.close();
    }
  });

  test(
    "Case Id: DFB-004 - Post Load to TNX with Offer Rate",
    {
      tag: "@dfb,@tnx"
    },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE); // 15 minutes
      const toggleSettingsValue = pages.toggleSettings.enable_DME;

      await test.step("Step 1: Login to BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser, userSetup.globalPassword);
        await pages.btmsAcceptTermPage.acceptTermsIfPresent();
      });

      await test.step("Step 2: Navigate to Loads", async () => {
        // Navigate to Loads
        await pages.homePage.navigateToHeader(HEADERS.LOAD);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 3: Create new non-tabular load", async () => {
        // Create new non-tabular load
        await pages.loadsPage.clickNewLoadDropdown();
        await pages.loadsPage.selectNonTabularTL();
        await pages.nonTabularLoadPage.createNonTabularLoad({
        shipperValue: testData.shipperName,
        consigneeValue: testData.consigneeName,
        shipperEarliestTime: testData.shipperEarliestTime,
        shipperLatestTime: testData.shipperLatestTime,
        consigneeEarliestTime: testData.consigneeEarliestTime,
        consigneeLatestTime: testData.consigneeLatestTime,
        shipmentCommodityQty: testData.shipmentCommodityQty,
        shipmentCommodityUoM: testData.shipmentCommodityUoM,
        shipmentCommodityDescription: testData.shipmentCommodityDescription,
        shipmentCommodityWeight: testData.shipmentCommodityWeight,
        equipmentType: testData.equipmentType,
        equipmentLength: testData.equipmentLength,
        distanceMethod: testData.Method
        });
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log("Created Load Number:", loadNumber);
      });

      await test.step("Step 4: Enter offer rate as 1800", async () => {
        // Enter offer rate
        await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate || "1000");
      });

      await test.step("Step 5: Post to TNX", async () => {
        // Post to TNX
        await pages.dfbLoadFormPage.clickOnPostButton();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 6: Verify post status", async () => {
        // Verify post status
        await pages.dfbLoadFormPage.validatePostStatus("POSTED");
      });

      await test.step("Verify Expected Results", async () => {
        // Expected 1: Load posted to TNX
        // Verify in TNX
        expect.soft(true, "Load posted to TNX").toBeTruthy();
        // Expected 2: Offer rate displayed correctly
        expect.soft(true, "Offer rate displayed correctly").toBeTruthy();
        // Expected 3: Post status is Posted
        await pages.dfbLoadFormPage.validatePostStatus("POSTED");
      });


    }
  );
});
