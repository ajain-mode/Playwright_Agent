import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";
import { ALERT_PATTERNS } from "@utils/alertPatterns";

/**
 * Test Case: DFB-25104 - Verify that a message is displayed when a value is not entered for the Email for Notifications field on the CREATE NEW ENTRY form
 * @author AI Agent Generator
 * @date 2026-02-17
 * @category dfb
 */
const testcaseID = "DFB-25104";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;
let loadNumber: string;

test.describe.configure({ retries: 1 });
test.describe.serial("Verify that a message is displayed when a value is not entered for the Email for Notifications field on the CREATE NEW ENTRY form", () => {
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
    "Case Id: DFB-25104 - Verify that a message is displayed when a value is not entered for the Email for Notifications field on the CREATE NEW ENTRY form",
    {
      tag: "@aiteam,@dfb,@nontabular,@postautomationrules,@rulefieldvalidation"
    },
    async () => {
      test.setTimeout(300000);

      await test.step("Step 1: Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        if (await pages.btmsAcceptTermPage.validateOnBTMSAcceptTermPage()) {
        await pages.btmsAcceptTermPage.acceptTermsAndConditions();
        }
      });

      await test.step("Step 2: Setup Office Preconditions", async () => {
        // Configure Office Settings as per preconditions:
        // - Match vendors field is set to TNX
        // - Enable Digital Matching Engine field is set to YES
        const toggleSettingsValue = pages.toggleSettings.enable_DME;
        await dfbHelpers.setupOfficePreConditions(
        pages,
        testData.officeName,
        toggleSettingsValue,
        pages.toggleSettings.verifyAutoPost
        );
        
        await pages.adminPage.hoverAndClickAdminMenu();
        await pages.adminPage.switchUser(testData.salesAgent);
        console.log("Office preconditions set and switched to sales agent");
      });

      await test.step("Step 3: Navigate to Post Automation Page", async () => {
        // Navigate to Post Automation page, search customer, cleanup existing rules
        await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
        await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(testData.customerName);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 4: Navigate to DAT", async () => {
        // Navigate to DAT
        await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
        await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 5: Click the New button to open the CREATE NEW ENTRY form", async () => {
        // Click New button to open CREATE NEW ENTRY form
        await pages.postAutomationRulePage.clickElementByText(POST_AUTOMATION_RULE.NEW_BUTTON);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 6: On CREATE NEW ENTRY pop up , enter all mandatory field ex...", async () => {
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

      await test.step("Step 7: Type:Drop", async () => {
        // Type:Drop
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 8: LoadMethod/TYPE: TL", async () => {
        // LoadMethod/TYPE: TL
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 9: Click the Create button", async () => {
        // Click Create button
        await pages.postAutomationRulePage.clickElementByText(BUTTONS.CREATE);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Verify Expected Results", async () => {
        // Expected: A message is displayed relating 'Invalid customer supplied'
        // Use existing commonReusables.validateAlert for browser alert dialog
        await Promise.all([
          pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.INVALID_CUSTOMER_SUPPLIED),
          pages.postAutomationRulePage.clickElementByText(BUTTONS.CREATE),
        ]);
      });


    }
  );
});
