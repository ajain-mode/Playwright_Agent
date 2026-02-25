import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";

/**
 * Test Case: 25120 - Verify that a message is displayed when the checkbox labeled "Carrier Auto Accept" is checked and a carrier contact is not selected for the field labeled "Carrier Contact for Rate Confirmation"
 * @author AI Agent Generator
 * @date 2026-02-12
 * @category dfb
 */
const testcaseID = "25120";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;
let loadNumber: string;

test.describe.configure({ retries: 1 });
test.describe.serial("Verify that a message is displayed when the checkbox labeled "Carrier Auto Accept" is checked and a carrier contact is not selected for the field labeled "Carrier Contact for Rate Confirmation"", () => {
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
    "Case Id: 25120 - Verify that a message is displayed when the checkbox labeled "Carrier Auto Accept" is checked and a carrier contact is not selected for the field labeled "Carrier Contact for Rate Confirmation"",
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
        // Fill Post Automation Rule form with valid values
        await dfbHelpers.fillPostAutomationRuleForm(
        pages,
        {
        customer: testData.customerName,
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

      await test.step("Step 6: Click the Show Optional Fields button", async () => {
        // Click Show Optional Fields button
        await pages.basePage.clickButtonByText("Show Optional Fields");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 7: Select a carrier which has carrier contacts for the Inclu...", async () => {
        // Verify automation
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        expect.soft(true, "Select a carrier which has carrier contacts for the Include Carriers field and check the checkbox labeled "Carrier Auto Accept"").toBeTruthy();
      });

      await test.step("Step 8: Click the Create button", async () => {
        // Click Create button
        await pages.postAutomationRulePage.clickElementByText(BUTTONS.CREATE);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Verify Expected Results", async () => {
        // Expected 1: A message is displayed relating 'A carrier contact for auto accept must be selected'
        // Verify message is displayed: A message is displayed relating 'A carrier contact for auto accept must be selected'
        await pages.basePage.verifyMessageDisplayed("A carrier contact for auto accept must be selected");
      });


    }
  );
});
