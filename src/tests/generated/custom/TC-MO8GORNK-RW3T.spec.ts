import { test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";

/**
 * Test Case: TC-MO8GORNK-RW3T - --id BT-72258
 * @author AI Agent Generator
 * @date 2026-04-21
 * @category custom
 */
const testcaseID = "TC-MO8GORNK-RW3T";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;


test.describe.configure({ retries: 1 });
test.describe.serial("--id BT-72258", () => {
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
    "Case Id: TC-MO8GORNK-RW3T - --id BT-72258",
    {
      tag: "@custom"
    },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

      await test.step("Step 1: Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        if (await pages.btmsAcceptTermPage.validateOnBTMSAcceptTermPage()) {
        await pages.btmsAcceptTermPage.acceptTermsAndConditions();
        }
      });

      await test.step("Step 2: -id BT-72258", async () => {
        await pages.dfbLoadFormPage.getPostStatusText();
      });


    }
  );
});
