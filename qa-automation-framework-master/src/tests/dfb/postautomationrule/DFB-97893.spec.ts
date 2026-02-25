import { test } from "@playwright/test";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import { PageManager } from "@utils/PageManager";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";

/**
 * Test Case: DFB-97893 - Verify that a new post automation rule is created for a EDI customer not using EDI location with include carrier field.
 * @author Deepak Bohra
 * @date 20-Jan-2026
 */

const testcaseID = "DFB-97893";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let appManager: MultiAppManager;
let cstTime: string;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe(
  "Verify that a new post automation rule is created for a EDI customer not using EDI location with include carrier field.",
  {
    tag: ["@dfb", "@smoke", "@postautomationrule", "@tporegression"],
  },
  () => {
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
      "Case Id: 97893 : Verify that a new post automation rule is created for a EDI customer not using EDI location with include carrier field",
      {
        tag: "@dfb,@tporegression,@smoke,@postautomationrule",
      },
      async () => {
        const toggleSettingsValue = pages.toggleSettings.enable_DME;
        // Login to BTMS
        await test.step("Login BTMS", async () => {
          test.setTimeout(WAIT.SPEC_TIMEOUT);
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          pages.logger.info("BTMS Login Successful");
        });

        await test.step("Setup DFB Test Environment", async () => {
          await dfbHelpers.setupOfficePreConditions(
            pages,
            testData.officeName,
            toggleSettingsValue,
            pages.toggleSettings.verifyAutoPost,
          );

          await pages.adminPage.hoverAndClickAdminMenu();
          await pages.adminPage.switchUser(testData.salesAgent);
          console.log("Switched user to that has agent as its salesperson");
        });

        await test.step("Add the New post automation rule for a NON EDI customer", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
          await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(
            CUSTOMER_NAME.CUSTOMER_5,
          );
          await pages.postAutomationRulePage.clickElementByText(
            POST_AUTOMATION_RULE.NEW_BUTTON,
          );
          await pages.dfbHelpers.fillPostAutomationRuleForm(
            pages,
            {
              customer: testData.customerName,
              emailNotification: testData.saleAgentEmail,
              pickLocation: testData.shipperName,
              destination: testData.consigneeName,
              equipment: testData.equipmentType,
              loadType: testData.loadMethod,
              offerRate: testData.offerRate,
              includeCarrier: [CARRIER_NAME.CARRIER_1],
            },
            true,
          );

          await pages.postAutomationRulePage.clickElementByText(BUTTONS.CREATE);
          cstTime = await pages.commonReusables.getCstPlusOneFormatted();
          console.log("Current Date Time in CST + 1 hour: " + cstTime);
        });

        await test.step("Validate the new post automation rule get added on the Post Automation Rule page", async () => {
          await pages.postAutomationRulePage.ruleInputSearch(
            CUSTOMER_NAME.CUSTOMER_5,
          );
          await pages.postAutomationRulePage.verifySinglePostAutomationRow({
            originCity: testData.shipperCity,
            originZip: testData.shipperZip,
            originState: testData.shipperState,
            destinationCity: testData.consigneeCity,
            destinationState: testData.consigneeState,
            destinationZip: testData.consigneeZip,
            equipment: POST_AUTOMATION_RULE.COMMODITY_FLATBED_CODE,
            customerName: CUSTOMER_NAME.CUSTOMER_5,
            method: testData.loadMethod,
            offerRate: testData.offerRate,
            originEdi: POST_AUTOMATION_RULE.DEFAULT_VALUE,
            destinationEdi: POST_AUTOMATION_RULE.DEFAULT_VALUE,
            cstTimeValue: cstTime,
          });
        });

        await test.step("Validate after edit the post automation rule information is correctly displayed", async () => {
          await pages.postAutomationRulePage.clickSelectSingleRecordAndEdit();
          await pages.postAutomationRulePageEditEntryModal.validateCustomerSelection(
            testData.customerName,
          );
          await pages.postAutomationRulePageEditEntryModal.validateEmailSelection(
            testData.saleAgentEmail,
          );
          await pages.postAutomationRulePageEditEntryModal.validateLocationSelection(
            testData.shipperName,
            POST_AUTOMATION_RULE.PICK,
          );
          await pages.postAutomationRulePageEditEntryModal.validateAllLocationFields(
            {
              name: testData.pickName,
              address: testData.shipperAddress,
              city: testData.shipperCity,
              state: testData.shipperState,
              zip: testData.shipperZip,
              type: POST_AUTOMATION_RULE.PICK,
            },
            POST_AUTOMATION_RULE.PICK,
          );
          await pages.postAutomationRulePageEditEntryModal.validateLocationSelection(
            testData.consigneeName,
            POST_AUTOMATION_RULE.DROP,
          );
          await pages.postAutomationRulePageEditEntryModal.validateAllLocationFields(
            {
              name: testData.dropName,
              address: testData.consigneeAddress,
              city: testData.consigneeCity,
              state: testData.consigneeState,
              zip: testData.consigneeZip,
              type: POST_AUTOMATION_RULE.DROP,
            },
            POST_AUTOMATION_RULE.DROP,
          );
          await pages.postAutomationRulePageEditEntryModal.validateLocationSelection(
            testData.consigneeName,
            POST_AUTOMATION_RULE.DROP,
          );
          await pages.postAutomationRulePageEditEntryModal.validateAllLocationFields(
            {
              name: testData.dropName,
              address: testData.consigneeAddress,
              city: testData.consigneeCity,
              state: testData.consigneeState,
              zip: testData.consigneeZip,
              type: POST_AUTOMATION_RULE.DROP,
            },
            POST_AUTOMATION_RULE.DROP,
          );
          await pages.postAutomationRulePage.getSelectedCarriers(
            POST_AUTOMATION_RULE.INCLUDE_CARRIER,
          );
          await pages.postAutomationRulePage.verifyCarrierSelected(
            CARRIER_NAME.CARRIER_1,
            POST_AUTOMATION_RULE.INCLUDE_CARRIER,
          );

          await pages.postAutomationRulePageEditEntryModal.validateEquipmentLoadMethodOfferRateFields(
            {
              equipment: testData.equipmentType,
              loadType: testData.loadMethod,
              offerRate: LOAD_OFFER_RATES.OFFER_RATE_4,
            },
          );
        });
      },
    );
  },
);
