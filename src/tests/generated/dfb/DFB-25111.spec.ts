import { BrowserContext, Page, test } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";

/**
 * Test Case: DFB-25111 - Verify that a message is displayed when a value is not entered for the Email for Notifications field on the CREATE NEW ENTRY form
 * @author AI Agent Generator
 * @date 2026-03-05
 * @category dfb
 */
const testcaseID = "DFB-25111";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);


let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: DFB-25111 - Verify that a message is displayed when a value is not entered for the Email for Notifications field on the CREATE NEW ENTRY form",
  () => {
    test.beforeAll(async ({ browser }) => {
      sharedContext = await browser.newContext();
      sharedPage = await sharedContext.newPage();
      appManager = new MultiAppManager(sharedContext, sharedPage);
      pages = appManager.btmsPageManager;
    });

    test.afterAll(async () => {
      if (appManager) {
        await appManager.closeAllSecondaryPages();
      }
      if (sharedContext) {
        await sharedContext.close();
      }
    });

    test(
      "Case Id: DFB-25111 - Verify that a message is displayed when a value is not entered for the Email for Notifications field on the CREATE NEW ENTRY form",
      {
        tag: "@aiteam,@dfb,@nontabular,@postautomationrules,@rulefieldvalidation"
      },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE); // 15 minutes

      await test.step("Step 1: Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
      });

      await test.step("Step 2: Setup Office Preconditions", async () => {
        // Configure Office Settings as per preconditions
        const toggleSettingsValue = pages.toggleSettings.enable_DME;
        await dfbHelpers.setupOfficePreConditions(
        pages,
        testData.officeName,
        toggleSettingsValue,
        pages.toggleSettings.verifyAutoPost
        );
        
        await pages.adminPage.hoverAndClickAdminMenu();
        await pages.adminPage.switchUser(testData.salesAgent);
      });

      await test.step("Step 3: Navigate to Post Automation Page", async () => {
        // Navigate to Post Automation page, search customer, cleanup existing rules
        await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
        await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(testData.customerName);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 4: Click the New button to open the CREATE NEW ENTRY form", async () => {
        // Click New button to open CREATE NEW ENTRY form
        await pages.postAutomationRulePage.clickElementByText(POST_AUTOMATION_RULE.NEW_BUTTON);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 5: On CREATE NEW ENTRY pop up , enter all mandatory field ex...", async () => {
        // Fill Post Automation Rule form - EXCLUDING field(s) as per test case
        await dfbHelpers.fillPostAutomationRuleForm(
        pages,
        {
        customer: testData.customerName,
        // emailNotification intentionally omitted - testing missing email validation
        pickLocation: testData.shipperName,
        destination: testData.consigneeName,
        equipment: testData.equipmentType,
        loadType: testData.loadMethod,
        offerRate: testData.offerRate,
        commodity: testData.commodity,
        },
        true
        );
      });

      await test.step("Step 6: Click and Verify Expected Alert Message", async () => {
        // Alert fires synchronously on click — must use Promise.all to capture it
        await Promise.all([
          pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.EMAIL_NOTIFICATION_REQUIRED),
          await pages.postAutomationRulePage.clickElementByText(BUTTONS.CREATE),
        ]);
      });


      }
    );
  }
);
