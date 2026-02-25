import { test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";
import { ALERT_PATTERNS } from "@utils/alertPatterns";

/**
 * Test Case: DFB-25103 - Verify that a message is displayed when a value is not
 * entered for the Email for Notifications field on the CREATE NEW ENTRY form
 *
 * @author AI Agent Generator
 * @date 2026-02-16
 * @category dfb
 */
const testcaseID = "DFB-25103";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;

//test.describe.configure({ retries: 1 });
test.describe.serial(
  "Verify that a message is displayed when a value is not entered for the Email for Notifications field on the CREATE NEW ENTRY form",
  () => {
    test.beforeAll(async ({ browser }) => {
      sharedContext = await browser.newContext();
      sharedPage = await sharedContext.newPage();
      pages = new PageManager(sharedPage);
    });

    test.afterAll(async () => {
      if (sharedContext) {
        await sharedContext.close();
      }
    });

    test(
      "Case Id: DFB-25103 - Verify that a message is displayed when a value is not entered for the Email for Notifications field on the CREATE NEW ENTRY form",
      {
        tag: "@aiteam,@dfb,@nontabular,@postautomationrules,@rulefieldvalidation",
      },
      async () => {
        test.setTimeout(300000);

        await test.step("Step 1: Login BTMS", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          if (
            await pages.btmsAcceptTermPage.validateOnBTMSAcceptTermPage()
          ) {
            await pages.btmsAcceptTermPage.acceptTermsAndConditions();
          }
          pages.logger.info("Logged in successfully");
        });

        await test.step(
          "Step 2: Setup Office Preconditions",
          async () => {
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
            console.log(
              "Office preconditions set and switched to sales agent"
            );
          }
        );

        await test.step(
          "Step 3: Navigate to Post Automation Page",
          async () => {
            // Navigate to Post Automation page, search customer, cleanup existing rules
            await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
            await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(
              testData.customerName
            );
            await pages.basePage.waitForMultipleLoadStates([
              "load",
              "networkidle",
            ]);
          }
        );

        await test.step(
          "Step 4: Click the New button to open the CREATE NEW ENTRY form",
          async () => {
            await pages.postAutomationRulePage.clickElementByText(
              POST_AUTOMATION_RULE.NEW_BUTTON
            );
            await pages.basePage.waitForMultipleLoadStates([
              "load",
              "networkidle",
            ]);
          }
        );

        await test.step(
          "Step 5: Enter valid values for all fields EXCEPT Email for Notifications",
          async () => {
            // Fill Post Automation Rule form - EXCLUDING Email for Notifications
            await dfbHelpers.fillPostAutomationRuleForm(
              pages,
              {
                customer: testData.customerName,
                // emailNotification intentionally omitted — testing missing email validation
                pickLocation: testData.shipperName,
                destination: testData.consigneeName,
                equipment: testData.equipmentType,
                loadType: testData.loadMethod,
                offerRate: testData.offerRate,
                commodity: testData.commodity,
              },
              true
            );
          }
        );

        await test.step(
          "Step 6: Click Create and Verify Expected Alert Message",
          async () => {
            // Validate popup alert message against ALERT_PATTERNS using existing commonReusables.validateAlert
            // validateAlert: captures dialog, asserts message matches expected, accepts dialog, returns message
            await Promise.all([
              pages.commonReusables.validateAlert(
                sharedPage,
                ALERT_PATTERNS.EMAIL_NOTIFICATION_REQUIRED
              ),
              pages.postAutomationRulePage.clickElementByText(BUTTONS.CREATE),
            ]);
          }
        );
      }
    );
  }
);
