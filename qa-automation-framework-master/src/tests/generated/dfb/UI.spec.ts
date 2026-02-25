import { test, expect } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";

/**
 * Test Case: UI - Test Script Description	Precondition(s)	Test Steps	Expected Result	Next Test Steps in BTMS	Expected Results	Next Test Steps in TNX	Expected Results
 * @author AI Agent Generator
 * @date 2026-02-10
 * @category dfb
 */
const testcaseID = "UI";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let cargoValue: string;
let loadNumber: string;
let sharedContext: any;
let sharedPage: any;
let appManager: MultiAppManager;
let pages: PageManager;
let totalMiles: string;

test.describe.configure({ retries: 1 });
test.describe.serial("Test Script Description	Precondition(s)	Test Steps	Expected Result	Next Test Steps in BTMS	Expected Results	Next Test Steps in TNX	Expected Results", () => {
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
    "Case Id: UI - Test Script Description	Precondition(s)	Test Steps	Expected Result	Next Test Steps in BTMS	Expected Results	Next Test Steps in TNX	Expected Results",
    {
      tag: "@dfb,@tnx"
    },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE); // 15 minutes
      const toggleSettingsValue = pages.toggleSettings.enable_DME;

      await test.step("Step 1: Select the maximum number of carriers for the Include Car...", async () => {
        // Select carriers
        await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([testData.carrierName]);
      });


    }
  );
});
