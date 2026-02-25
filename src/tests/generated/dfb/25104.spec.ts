import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";
import { ALERT_PATTERNS } from "@utils/alertPatterns";

/**
 * Test Case: 25104 - Verify that a message is displayed when a value is not entered for the Customer field on the CREATE NEW ENTRY form
 * @author AI Agent Generator
 * @date 2026-02-12
 * @category dfb
 */
const testcaseID = "25104";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;
let loadNumber: string;

test.describe.configure({ retries: 1 });
test.describe.serial("Verify that a message is displayed when a value is not entered for the Customer field on the CREATE NEW ENTRY form", () => {
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
    "Case Id: 25104 - Verify that a message is displayed when a value is not entered for the Customer field on the CREATE NEW ENTRY form",
    {
      tag: "@aiteam,@dfb,@nontabular,@postautomationrules,@rulefieldvalidation"
    },
    async () => {
      test.setTimeout(300000);

      await test.step("Step 1: Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser, userSetup.globalPassword);
        if (await pages.btmsAcceptTermPage.validateOnBTMSAcceptTermPage()) {
        await pages.btmsAcceptTermPage.acceptTermsAndConditions();
        }
      });

      await test.step("Step 2: Setup Office Preconditions", async () => {
        // Configure Office Settings as per preconditions:
        // The agent's Office Info page has the following settings:
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
        // Navigate to Post Automation page of the agent's office
        await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
        await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(testData.customerName);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 4: Click the New button to open the CREATE NEW ENTRY form", async () => {
        // Click New button to open CREATE NEW ENTRY form
        await pages.postAutomationRulePage.clickElementByText(POST_AUTOMATION_RULE.NEW_BUTTON);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 5: Select/Enter valid values for all of the fields on the CR...", async () => {
        // Fill Post Automation Rule form - EXCLUDING field(s) as per test case
        await dfbHelpers.fillPostAutomationRuleForm(
        pages,
        {
        // customer intentionally omitted per test case requirement
        emailNotification: testData.saleAgentEmail,
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

      await test.step("Step 6: Click the Create button", async () => {
        // Click Create button
        await pages.postAutomationRulePage.clickElementByText(BUTTONS.CREATE);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Verify Expected Results", async () => {
        // Expected 1: A message is displayed relating 'Invalid customer supplied'
        // Verify alert message: Invalid customer supplied
        await pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.INVALID_CUSTOMER_SUPPLIED);
      });


    }
  );
});
